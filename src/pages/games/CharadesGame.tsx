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
    id: number;
    category: 'animals' | 'people' | 'objects' | 'fruits';
    text: string;
    icon?: string;
    isSpecial?: boolean;
    specialAction?: string;
}

// --- Types ---
type Category = 'animals' | 'people' | 'objects' | 'fruits';

const CARDS: CardData[] = [
    // --- ANIMALS (40) ---
    { id: 1, category: 'animals', text: 'Leão (Daniel)' },
    { id: 2, category: 'animals', text: 'Baleia (Jonas)' },
    { id: 3, category: 'animals', text: 'Ovelha (O Bom Pastor)' },
    { id: 4, category: 'animals', text: 'Pomba (Noé)' },
    { id: 5, category: 'animals', text: 'Burrinho (Jesus)' },
    { id: 6, category: 'animals', text: 'Peixe (Pedro)' },
    { id: 7, category: 'animals', text: 'Formiga (Sábia)' },
    { id: 8, category: 'animals', text: 'Águia (Força)' },
    { id: 9, category: 'animals', text: 'Camelo (Rico)' },
    { id: 10, category: 'animals', text: 'Galo (Pedro)' },
    { id: 11, category: 'animals', text: 'Serpente (No Éden)' },
    { id: 12, category: 'animals', text: 'Cachorro' },
    { id: 13, category: 'animals', text: 'Gato' },
    { id: 14, category: 'animals', text: 'Macaco' },
    { id: 15, category: 'animals', text: 'Coelho' },
    { id: 16, category: 'animals', text: 'Tartaruga' },
    { id: 17, category: 'animals', text: 'Elefante' },
    { id: 18, category: 'animals', text: 'Girafa' },
    { id: 19, category: 'animals', text: 'Pintinho' },
    { id: 20, category: 'animals', text: 'Pato' },
    { id: 21, category: 'animals', text: 'Vaca' },
    { id: 22, category: 'animals', text: 'Porco' },
    { id: 23, category: 'animals', text: 'Esquilo' },
    { id: 24, category: 'animals', text: 'Jacaré' },
    { id: 25, category: 'animals', text: 'Tubarão' },
    { id: 26, category: 'animals', text: 'Urso' },
    { id: 27, category: 'animals', text: 'Borboleta' },
    { id: 28, category: 'animals', text: 'Coruja' },
    { id: 29, category: 'animals', text: 'Canguru' },
    { id: 30, category: 'animals', text: 'Zebra' },
    { id: 31, category: 'animals', text: 'Hipopótamo' },
    { id: 32, category: 'animals', text: 'Rinoceronte' },
    { id: 33, category: 'animals', text: 'Tigre' },
    { id: 34, category: 'animals', text: 'Lobo' },
    { id: 35, category: 'animals', text: 'Aranha' },
    { id: 36, category: 'animals', text: 'Abelha' },
    { id: 37, category: 'animals', text: 'Cavalo' },
    { id: 38, category: 'animals', text: 'Boi' },
    { id: 39, category: 'animals', text: 'Grilo' },
    { id: 40, category: 'animals', text: 'Pássaro' },

    // --- PEOPLE (40) ---
    { id: 41, category: 'people', text: 'Davi (Estilingue)' },
    { id: 42, category: 'people', text: 'Golias (Gigante)' },
    { id: 43, category: 'people', text: 'Noé (Martelo)' },
    { id: 44, category: 'people', text: 'Moisés (Cajado)' },
    { id: 45, category: 'people', text: 'Sansão (Forte)', isSpecial: true, specialAction: 'Dê um abraço bem forte!' },
    { id: 46, category: 'people', text: 'Rei Davi' },
    { id: 47, category: 'people', text: 'Ester (Rainha)' },
    { id: 48, category: 'people', text: 'Pastor de Ovelhas' },
    { id: 49, category: 'people', text: 'Pescador (Rede)' },
    { id: 50, category: 'people', text: 'Semeador (Sementes)' },
    { id: 51, category: 'people', text: 'José (Túnica)' },
    { id: 52, category: 'people', text: 'Maria (Bebê Jesus)' },
    { id: 53, category: 'people', text: 'Anjo (Asas)' },
    { id: 54, category: 'people', text: 'Daniel (Oração)' },
    { id: 55, category: 'people', text: 'Jonas (Fugindo)' },
    { id: 56, category: 'people', text: 'Zaqueu (No pé)' },
    { id: 57, category: 'people', text: 'Cego Bartimeu' },
    { id: 58, category: 'people', text: 'Bom Samaritano' },
    { id: 59, category: 'people', text: 'João Batista' },
    { id: 60, category: 'people', text: 'Paulo (Escrevendo)' },
    { id: 61, category: 'people', text: 'Abraão (Estrelas)' },
    { id: 62, category: 'people', text: 'Isaque (Caminhando)' },
    { id: 63, category: 'people', text: 'Rebeca (Cântaro)' },
    { id: 64, category: 'people', text: 'Rute (Colheita)' },
    { id: 65, category: 'people', text: 'Samuel (Ouvindo)' },
    { id: 66, category: 'people', text: 'Elias (Fogo)' },
    { id: 67, category: 'people', text: 'Eliseu (Capa)' },
    { id: 68, category: 'people', text: 'Gideão (Vaso)' },
    { id: 69, category: 'people', text: 'Débora (Juíza)' },
    { id: 70, category: 'people', text: 'Josué (Muralha)' },
    { id: 71, category: 'people', text: 'Miriã (Pandeiro)' },
    { id: 72, category: 'people', text: 'Sarah (Rindo)' },
    { id: 73, category: 'people', text: 'Marta (Limpando)' },
    { id: 74, category: 'people', text: 'Maria Madalena' },
    { id: 75, category: 'people', text: 'Soldado Romano' },
    { id: 76, category: 'people', text: 'Pedinte' },
    { id: 77, category: 'people', text: 'Ladrão na Cruz' },
    { id: 78, category: 'people', text: 'Dono da Estalagem' },
    { id: 79, category: 'people', text: 'Sábio' },
    { id: 80, category: 'people', text: 'Criança com Lanches' },

    // --- OBJECTS (40) ---
    { id: 81, category: 'objects', text: 'Arca de Noé' },
    { id: 82, category: 'objects', text: 'Cesta de Moisés' },
    { id: 83, category: 'objects', text: 'Harpa de Davi' },
    { id: 84, category: 'objects', text: 'Coroa de Ouro' },
    { id: 85, category: 'objects', text: 'Cruz de Jesus', isSpecial: true, specialAction: 'Diga "Jesus te ama"!' },
    { id: 86, category: 'objects', text: 'Bíblia' },
    { id: 87, category: 'objects', text: 'Pão e Peixe' },
    { id: 88, category: 'objects', text: 'Cajado de Pastor' },
    { id: 89, category: 'objects', text: 'Estilingue' },
    { id: 90, category: 'objects', text: 'Trombeta' },
    { id: 91, category: 'objects', text: 'Barco de Pesca' },
    { id: 92, category: 'objects', text: 'Rede de Sair' },
    { id: 93, category: 'objects', text: 'Lamparina' },
    { id: 94, category: 'objects', text: 'Tenda' },
    { id: 95, category: 'objects', text: 'Altar' },
    { id: 96, category: 'objects', text: 'Escada de Jacó' },
    { id: 97, category: 'objects', text: 'Túnica Colorida' },
    { id: 98, category: 'objects', text: 'Moedas de Prata' },
    { id: 99, category: 'objects', text: 'Poço de Água' },
    { id: 100, category: 'objects', text: 'Mesa de Jantar' },
    { id: 101, category: 'objects', text: 'Cadeira' },
    { id: 102, category: 'objects', text: 'Janela' },
    { id: 103, category: 'objects', text: 'Porta' },
    { id: 104, category: 'objects', text: 'Chave' },
    { id: 105, category: 'objects', text: 'Martelo' },
    { id: 106, category: 'objects', text: 'Serrote' },
    { id: 107, category: 'objects', text: 'Vassoura' },
    { id: 108, category: 'objects', text: 'Balde' },
    { id: 109, category: 'objects', text: 'Espada de Brinquedo' },
    { id: 110, category: 'objects', text: 'Escudo' },
    { id: 111, category: 'objects', text: 'Capacete' },
    { id: 112, category: 'objects', text: 'Sandália' },
    { id: 113, category: 'objects', text: 'Anel' },
    { id: 114, category: 'objects', text: 'Espelho' },
    { id: 115, category: 'objects', text: 'Relógio' },
    { id: 116, category: 'objects', text: 'Telefone' },
    { id: 117, category: 'objects', text: 'Bola' },
    { id: 118, category: 'objects', text: 'Boneca' },
    { id: 119, category: 'objects', text: 'Carrinho' },
    { id: 120, category: 'objects', text: 'Pipa' },

    // --- FRUITS (40) ---
    { id: 121, category: 'fruits', text: 'Maçã' },
    { id: 122, category: 'fruits', text: 'Uva' },
    { id: 123, category: 'fruits', text: 'Figo' },
    { id: 124, category: 'fruits', text: 'Banana' },
    { id: 125, category: 'fruits', text: 'Melancia' },
    { id: 126, category: 'fruits', text: 'Morango' },
    { id: 127, category: 'fruits', text: 'Abacaxi' },
    { id: 128, category: 'fruits', text: 'Laranja' },
    { id: 129, category: 'fruits', text: 'Limão' },
    { id: 130, category: 'fruits', text: 'Pera' },
    { id: 131, category: 'fruits', text: 'Manga' },
    { id: 132, category: 'fruits', text: 'Mamão' },
    { id: 133, category: 'fruits', text: 'Melão' },
    { id: 134, category: 'fruits', text: 'Kiwi' },
    { id: 135, category: 'fruits', text: 'Cereja' },
    { id: 136, category: 'fruits', text: 'Goiaba' },
    { id: 137, category: 'fruits', text: 'Caju' },
    { id: 138, category: 'fruits', text: 'Amora' },
    { id: 139, category: 'fruits', text: 'Framboesa' },
    { id: 140, category: 'fruits', text: 'Pitaya' },
    { id: 141, category: 'fruits', text: 'Maracujá' },
    { id: 142, category: 'fruits', text: 'Tangerina' },
    { id: 143, category: 'fruits', text: 'Ameixa' },
    { id: 144, category: 'fruits', text: 'Pêssego' },
    { id: 145, category: 'fruits', text: 'Caqui' },
    { id: 146, category: 'fruits', text: 'Carambola' },
    { id: 147, category: 'fruits', text: 'Jabuticaba' },
    { id: 148, category: 'fruits', text: 'Acerola' },
    { id: 149, category: 'fruits', text: 'Coco' },
    { id: 150, category: 'fruits', text: 'Graviola' },
    { id: 151, category: 'fruits', text: 'Romã' },
    { id: 152, category: 'fruits', text: 'Jaca' },
    { id: 153, category: 'fruits', text: 'Abacate' },
    { id: 154, category: 'fruits', text: 'Lichia' },
    { id: 155, category: 'fruits', text: 'Tâmara' },
    { id: 156, category: 'fruits', text: 'Damasco' },
    { id: 157, category: 'fruits', text: 'Nozes' },
    { id: 158, category: 'fruits', text: 'Castanha' },
    { id: 159, category: 'fruits', text: 'Avelã' },
    { id: 160, category: 'fruits', text: 'Pistache' },
];

export default function CharadesGame() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [isDripLocked, setIsDripLocked] = useState(false);
    const [dripDaysRemaining, setDripDaysRemaining] = useState(0);
    const [unlockDelayDays, setUnlockDelayDays] = useState(0);
    const [requiredMissionDay, setRequiredMissionDay] = useState(0);
    const [loading, setLoading] = useState(true);

    // State
    const [gameState, setGameState] = useState<'menu' | 'drawing' | 'acting' | 'challenge'>('menu');
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);
    const [history, setHistory] = useState<number[]>([]);

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

            // Drip Check
            const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
                unlockDelayDays: data.unlock_delay_days,
                requiredMissionDay: data.required_mission_day
            });

            if (isLocked) {
                setIsDripLocked(true);
                setDripDaysRemaining(daysRemaining);
                setUnlockDelayDays(data.unlock_delay_days || 0);
                setRequiredMissionDay(data.required_mission_day || 0);
            }
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

        const pool = category ? CARDS.filter(c => c.category === category) : CARDS;
        const availablePool = pool.length > 15
            ? pool.filter(c => !history.includes(c.id))
            : pool;

        setTimeout(() => {
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
