import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Smile, Users, Heart, Star, Sparkles, User, Apple, Box, CheckCircle, PawPrint } from 'lucide-react';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';

const CATEGORIES = [
    { id: 'animals', label: 'Animais', icon: <PawPrint className="w-6 h-6" />, color: 'bg-orange-100 text-orange-600 border-orange-200' },
    { id: 'people', label: 'Pessoas', icon: <Users className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600 border-blue-200' },
    { id: 'objects', label: 'Objetos', icon: <Box className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600 border-purple-200' },
    { id: 'fruits', label: 'Frutas', icon: <Apple className="w-5 h-5" />, color: 'bg-red-100 text-red-600 border-red-200' },
];

interface CardData {
    id: string;
    category: 'animals' | 'people' | 'objects' | 'fruits';
    text: string;
    icon?: string;
    isSpecial?: boolean;
    specialAction?: string;
}

// --- Types ---
type Category = 'animals' | 'people' | 'objects' | 'fruits';



export default function CharadesGame() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [isDripLocked, setIsDripLocked] = useState(false);
    const [dripDaysRemaining, setDripDaysRemaining] = useState(0);
    const [unlockDelayDays, setUnlockDelayDays] = useState(0);
    const [requiredMissionDay, setRequiredMissionDay] = useState(0);
    const [loading, setLoading] = useState(true);

    const [unlockDelayDaysFetched, setUnlockDelayDaysFetched] = useState<number>(0);
    const [requiredMissionDayFetched, setRequiredMissionDayFetched] = useState<number>(0);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        if (id) fetchGameConfig();
    }, [id]);

    useEffect(() => {
        if (!dataLoaded || profile === null) return;
        const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
            unlockDelayDays: unlockDelayDaysFetched,
            requiredMissionDay: requiredMissionDayFetched
        });
        if (isLocked) {
            setIsDripLocked(true);
            setDripDaysRemaining(daysRemaining);
            setUnlockDelayDays(unlockDelayDaysFetched);
            setRequiredMissionDay(requiredMissionDayFetched);
        }
    }, [dataLoaded, profile, unlockDelayDaysFetched, requiredMissionDayFetched]);

    // State
    const [gameState, setGameState] = useState<'menu' | 'drawing' | 'acting' | 'challenge'>('menu');
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);
    const [history, setHistory] = useState<string[]>([]);
    const [gameCards, setGameCards] = useState<CardData[]>([]);

    // --- Initialization ---
    useEffect(() => {
        if (id) fetchGameConfig();
    }, [id]);

    const fetchGameConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('games')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data.status !== 'available') {
                navigate('/games');
                return;
            }

            setUnlockDelayDaysFetched(data.unlock_delay_days || 0);
            setRequiredMissionDayFetched(data.required_mission_day || 0);

            // Load Charades Cards
            const { data: cardsData, error: cardsError } = await supabase
                .from('charades_cards')
                .select('*');

            if (cardsError) throw cardsError;

            if (cardsData) {
                setGameCards(cardsData.map((c: any) => ({
                    id: c.id,
                    category: c.category,
                    text: c.text,
                    isSpecial: c.is_special,
                    specialAction: c.special_action
                })));
            }

            setDataLoaded(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Logic
    const drawCard = (category?: string) => {
        if (isDripLocked) return;
        setGameState('drawing');
        setCurrentCategory(category);

        const pool = category ? gameCards.filter(c => c.category === category) : gameCards;
        const availablePool = pool.length > 15
            ? pool.filter(c => !history.includes(c.id))
            : pool;

        setTimeout(() => {
            if (availablePool.length === 0) {
                // Return to menu or handle empty deck
                setGameState('menu');
                return;
            }
            const randomCard = availablePool[Math.floor(Math.random() * availablePool.length)];
            setCurrentCard(randomCard);
            setHistory(prev => [randomCard.id, ...prev].slice(0, 10));
            setGameState('acting');
        }, 1200);
    };

    const skipCard = () => {
        drawCard(currentCategory);
    };

    const handleGuessed = () => {
        if (currentCard?.isSpecial) {
            setGameState('challenge');
        } else {
            setGameState('challenge');
        }
    }

    if (loading) return <div className="flex justify-center items-center h-screen bg-amber-50 font-sans"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div></div>;

    return (
        <div className="min-h-screen bg-amber-50 flex flex-col font-sans select-none overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-20 glass border-b border-amber-200 bg-amber-100/80 backdrop-blur-md">
                <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={() => navigate('/games')} className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors shadow-sm text-amber-800">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-fredoka font-bold text-xl text-amber-800 flex items-center gap-2">
                        <Smile className="w-6 h-6" /> Mímica
                    </h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">

                {gameState === 'menu' && (
                    <div className="w-full space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-amber-900 font-fredoka mb-2">Quem vou imitar?</h2>
                            <p className="text-amber-700">Escolha uma categoria para sortear!</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => drawCard()}
                                className="col-span-2 p-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-lg transform active:scale-95 transition-all text-white font-bold text-xl flex flex-col items-center gap-2 border-b-4 border-orange-600"
                            >
                                <Sparkles className="w-8 h-8 animate-pulse" />
                                Surpresa (Aleatório)
                            </button>

                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => drawCard(cat.id as Category)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transform active:scale-95 transition-all shadow-sm h-32",
                                        cat.color,
                                        "bg-white"
                                    )}
                                >
                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl", cat.color.replace('text-', 'bg-').split(' ')[0], "bg-opacity-20")}>
                                        {cat.icon}
                                    </div>
                                    <span className="font-bold">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === 'drawing' && (
                    <div className="flex flex-col items-center animate-in zoom-in spin-in-3 duration-1000">
                        <div className="w-40 h-56 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white animate-bounce">
                            <span className="text-6xl">?</span>
                        </div>
                        <p className="mt-8 text-xl font-bold text-amber-800 animate-pulse">Sorteando...</p>
                    </div>
                )}

                {/* PHASE 1: ACTING */}
                {gameState === 'acting' && currentCard && (
                    <div className="w-full max-w-sm relative group perspective-1000 animate-in zoom-in-90 duration-500">
                        <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-amber-200 overflow-hidden relative">
                            {/* Top Pattern */}
                            <div className="h-32 bg-amber-100 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#d97706 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                                <span className="text-[5rem] drop-shadow-lg transform hover:scale-110 transition-transform duration-300 block">
                                    {currentCard.icon}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-8 text-center space-y-4">
                                <div>
                                    <p className="text-amber-500 font-bold uppercase tracking-wider text-sm mb-1">Você é...</p>
                                    <h2 className="text-4xl font-black text-slate-800 font-fredoka">{currentCard.text}</h2>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                    <p className="text-amber-800 font-bold mb-1">🤫 Shhh! </p>
                                    <p className="text-amber-700 text-sm">Não fale nada! Apenas faça mímica.</p>
                                </div>

                                <div className="pt-4 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={skipCard}
                                        className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    >
                                        Pular
                                    </button>
                                    <button
                                        onClick={handleGuessed}
                                        className="py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-6 h-6" />
                                        Adivinharam!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PHASE 2: CHALLENGE REVEAL */}
                {gameState === 'challenge' && currentCard && (
                    <div className="w-full max-w-sm relative group perspective-1000 animate-in zoom-in-90 duration-500">
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-amber-200 overflow-hidden relative z-10">
                            <div className="h-24 bg-green-100 flex items-center justify-center">
                                <Star className="w-16 h-16 text-green-500 animate-bounce" fill="currentColor" />
                            </div>

                            <div className="p-8 text-center space-y-6">
                                <div>
                                    <h2 className="text-3xl font-black text-green-600 font-fredoka mb-2">Muito Bem!</h2>
                                    <p className="text-slate-600">Vocês acertaram que era <b>{currentCard.text}</b>!</p>
                                </div>

                                {currentCard.isSpecial ? (
                                    <div className="bg-rose-50 border-2 border-rose-200 p-5 rounded-2xl flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
                                        <Heart className="w-10 h-10 text-rose-500 fill-rose-500 animate-pulse" />
                                        <div>
                                            <p className="text-rose-800 font-black text-lg uppercase tracking-wide mb-1">Desafio do Amor</p>
                                            <p className="text-rose-700 font-medium text-lg leading-tight">
                                                "{currentCard.specialAction}"
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                                        <p className="text-amber-800 font-bold">🎉 Ponto para a família!</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        onClick={() => setGameState('menu')}
                                        className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                        Próxima Carta
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            <DripLockModal
                isOpen={isDripLocked}
                onOpenChange={(open) => {
                    setIsDripLocked(open);
                    if (!open) navigate('/games');
                }}
                daysRemaining={dripDaysRemaining}
                unlockDelayDays={unlockDelayDays}
                requiredMissionDay={requiredMissionDay}
            />
        </div>
    );
}
