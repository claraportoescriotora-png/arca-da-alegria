import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trophy, Clock } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';

// --- Types ---
type SymbolType = 'cross' | 'dove' | 'heart' | 'star' | 'rainbow' | 'light' | 'bread' | 'fish' | 'cloud' | 'sun' | 'leaf' | 'mountain' | 'path' | 'crown' | 'cup' | 'fire' | 'water' | 'music' | 'book' | 'anchor';

interface Card {
    id: number;
    symbol: SymbolType;
    isFlipped: boolean;
    isMatched: boolean;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const SYMBOLS: SymbolType[] = [
    'cross', 'dove', 'heart', 'star', 'rainbow', 'light', 'bread',
    'fish', 'cloud', 'sun', 'leaf', 'mountain', 'path', 'crown',
    'cup', 'fire', 'water', 'music', 'book', 'anchor'
];

export default function SignsGame() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { addXp } = useUser();

    const [isDripLocked, setIsDripLocked] = useState(false);
    const [dripDaysRemaining, setDripDaysRemaining] = useState(0);
    const [unlockDelayDays, setUnlockDelayDays] = useState(0);
    const [requiredMissionDay, setRequiredMissionDay] = useState(0);
    const [loading, setLoading] = useState(true);

    // Game State
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');
    const [cards, setCards] = useState<Card[]>([]);
    const [gameState, setGameState] = useState<'menu' | 'preview' | 'playing' | 'gameover' | 'victory' | 'paused'>('menu');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [timer, setTimer] = useState(0);
    const [moves, setMoves] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [isPreview, setIsPreview] = useState(false);

    // Config based on difficulty
    const getConfig = (diff: Difficulty) => {
        switch (diff) {
            case 'easy': return { rows: 4, cols: 3, pairs: 6, timeLimit: 60 }; // 3x4 grid
            case 'medium': return { rows: 5, cols: 4, pairs: 10, timeLimit: 180 }; // 4x5 grid
            case 'hard': return { rows: 6, cols: 5, pairs: 15, timeLimit: 300 }; // 5x6 grid
        }
    };

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

    // --- Init Game ---
    const startGame = (diff: Difficulty) => {
        setDifficulty(diff);
        const config = getConfig(diff);

        // Select symbols
        const selectedSymbols = SYMBOLS.slice(0, config.pairs);
        // Create pairs
        const deck = [...selectedSymbols, ...selectedSymbols];
        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        const newCards = deck.map((symbol, index) => ({
            id: index,
            symbol,
            isFlipped: true, // Preview state
            isMatched: false
        }));

        setCards(newCards);
        setGameState('playing');
        setIsPreview(true);
        setTimer(config.timeLimit > 0 ? config.timeLimit : 0);
        setMoves(0);
        setCountdown(3);
        setIsChecking(false);

        // Countdown logic
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownInterval);
                    setTimeout(() => {
                        setCountdown(null);
                        setIsPreview(false);
                        setCards(curr => curr.map(c => ({ ...c, isFlipped: false })));
                    }, 1000);
                    return prev !== null ? 0 : null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // --- Game Logic ---
    useEffect(() => {
        if (gameState !== 'playing' || isPreview) return;

        // Timer
        const config = getConfig(difficulty);
        if (config.timeLimit > 0) {
            const interval = setInterval(() => {
                setTimer(t => {
                    if (t <= 1) {
                        clearInterval(interval);
                        setGameState('gameover');
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [gameState, difficulty, isPreview]);

    const handleCardClick = (index: number) => {
        if (gameState !== 'playing' || isPreview || isChecking) return;
        if (cards[index].isMatched || cards[index].isFlipped) return;

        // 1. ATOMIC UPDATE: Flip card and calculate next state in one go
        setCards(prevCards => {
            const nextCards = [...prevCards];
            nextCards[index] = { ...nextCards[index], isFlipped: true };

            const currentlyFlipped = nextCards.filter(c => c.isFlipped && !c.isMatched);

            if (currentlyFlipped.length === 2) {
                // LOCK UI
                setIsChecking(true);
                setMoves(m => m + 1);

                const [card1, card2] = currentlyFlipped;

                if (card1.symbol === card2.symbol) {
                    // MATCH - Resolve after a small visual delay
                    setTimeout(() => {
                        setCards(finalCards => {
                            const matched = finalCards.map(c =>
                                (c.id === card1.id || c.id === card2.id) ? { ...c, isMatched: true } : c
                            );

                            // Check Win immediately
                            if (matched.every(c => c.isMatched)) {
                                setGameState('victory');
                                addXp(50 + (difficulty === 'medium' ? 50 : 0) + (difficulty === 'hard' ? 100 : 0));
                            }
                            return matched;
                        });
                        setIsChecking(false);
                    }, 500);
                } else {
                    // NO MATCH - Close after 1s
                    setTimeout(() => {
                        setCards(finalCards => finalCards.map(c =>
                            (c.id === card1.id || c.id === card2.id) ? { ...c, isFlipped: false } : c
                        ));
                        setIsChecking(false);
                    }, 1000);
                }
            }

            return nextCards;
        });
    };

    // --- Render Helpers ---
    const renderSymbol = (symbol: SymbolType) => {
        const color = getSymbolColor(symbol);
        switch (symbol) {
            case 'cross':
                return <path d="M10 2 v20 M2 8 h16" stroke={color} strokeWidth="3" strokeLinecap="round" />;
            case 'dove':
                return <path d="M2 12 Q5 5 12 12 T22 12 Q18 18 12 18 T2 12" fill={color} />;
            case 'heart':
                return <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={color} />;
            case 'star':
                return <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={color} />;
            case 'cloud':
                return <path d="M17.5 19c0 .83-.67 1.5-1.5 1.5H4c-1.1 0-2-.9-2-2 0-1.1.9-2 2-2 .34 0 .65.09.93.24.23-1.63 1.63-2.9 3.32-2.9.23 0 .45.03.66.08C9.59 12.21 11.45 11 13.5 11c2.48 0 4.5 2.02 4.5 4.5 0 .17-.02.34-.05.5.95.27 1.65 1.12 1.65 2.15 0 .28-.05.55-.15.8z" fill={color} />;
            case 'sun':
                return (
                    <g>
                        <circle cx="12" cy="12" r="5" fill={color} />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="2" strokeLinecap="round" />
                    </g>
                );
            case 'rainbow':
                return (
                    <g fill="none" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 18 a 10 10 0 0 1 16 0" stroke="#ef4444" />
                        <path d="M6 18 a 8 8 0 0 1 12 0" stroke="#f59e0b" />
                        <path d="M8 18 a 6 6 0 0 1 8 0" stroke="#10b981" />
                    </g>
                );
            case 'fish':
                return <path d="M20 12c-2.5 0-4.5-1.5-6-3s-3.5-3-6-3C4 6 2 9 2 12s2 6 6 6c2.5 0 4.5-1.5 6-3s3.5-3 6-3l2 2v-4l-2 2z" stroke={color} strokeWidth="2" fill="none" />;
            case 'light':
                return <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke={color} strokeWidth="2" strokeLinecap="round" />;
            case 'bread':
                return <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z M12 6v12 M6 12h12" stroke={color} strokeWidth="2" fill="none" />;
            case 'crown':
                return <path d="M2 18h20l-2-10-4 4-4-8-4 8-4-4-2 10z" fill={color} />;
            case 'anchor':
                return <path d="M12 2v16 M5 12a7 7 0 0 0 14 0 M2 12h3 M19 12h3 M12 22v-4" stroke={color} strokeWidth="2" strokeLinecap="round" />;
            case 'cup':
                return <path d="M6 2h12v8a6 6 0 0 1-12 0V2z M12 10v10 M8 22h8" stroke={color} strokeWidth="2" fill="none" />;
            case 'fire':
                return <path d="M12 2c0 0-4 4-4 8a4 4 0 1 0 8 0c0-4-4-8-4-8z" fill={color} />;
            case 'water':
                return <path d="M12 2c0 0-7 7-7 11a7 7 0 1 0 14 0c0-4-7-11-7-11z" fill={color} />;
            case 'music':
                return <path d="M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke={color} strokeWidth="2" fill="none" />;
            case 'book':
                return <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" stroke={color} strokeWidth="2" fill="none" />;
            case 'leaf':
                return <path d="M2 22c0-5.52 4.48-10 10-10s10 4.48 10 10" stroke={color} strokeWidth="2" fill="none" />;
            case 'mountain':
                return <path d="M2 20L10 4L18 20H2z M14 20L18 14L22 20H14z" fill={color} />;
            case 'path':
                return <path d="M4 22V2l16 20V2" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />;
            default:
                return <circle cx="12" cy="12" r="8" fill={color} />;
        }
    };

    const getSymbolColor = (symbol: SymbolType) => {
        switch (symbol) {
            case 'heart': return '#ec4899'; // Pink
            case 'star': return '#eab308'; // Yellow
            case 'leaf': return '#22c55e'; // Green
            case 'sun': return '#f59e0b'; // Amber
            case 'cloud': return '#bae6fd'; // Light Blue
            case 'rainbow': return 'transparent';
            case 'cross': return '#8b5cf6'; // Violet
            case 'fire': return '#ef4444'; // Red
            case 'water': return '#3b82f6'; // Blue
            case 'music': return '#a855f7'; // Purple
            case 'book': return '#6366f1'; // Indigo
            case 'crown': return '#facc15'; // Yellow-400
            case 'anchor': return '#64748b'; // Slate
            case 'cup': return '#fb923c'; // Orange
            default: return '#6366f1'; // Indigo
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-20 glass border-b border-white/20 bg-white/70 backdrop-blur-md">
                <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/games')}
                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </button>
                    <h1 className="font-fredoka font-bold text-xl text-slate-700">Sinais da Volta de Jesus</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                {gameState === 'menu' && (
                    <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🧩</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 font-fredoka">Vamos brincar?</h2>
                        <p className="text-slate-500 mb-8 font-medium">Encontre os pares dos sinais da volta de Jesus!</p>

                        <div className="space-y-3">
                            <button onClick={() => startGame('easy')} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-md transition-transform active:scale-95 text-lg">
                                Fácil (3x4)
                            </button>
                            <button onClick={() => startGame('medium')} className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-md transition-transform active:scale-95 text-lg">
                                Médio (4x5)
                            </button>
                            <button onClick={() => startGame('hard')} className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-2xl shadow-md transition-transform active:scale-95 text-lg">
                                Difícil (5x6)
                            </button>
                        </div>
                    </div>
                )}

                {(gameState === 'playing' || gameState === 'preview') && (
                    <div className="w-full max-w-lg">
                        {/* HUD */}
                        <div className="flex items-center justify-between mb-6 px-4">
                            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl shadow-sm text-slate-700 font-bold border border-slate-100">
                                <span className="text-indigo-500">🔄</span>
                                <span>{moves}</span>
                            </div>

                            <button
                                onClick={() => setGameState('paused')}
                                className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl shadow-sm text-slate-700 font-bold border border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                                ⏸️ Pausar
                            </button>

                            <div className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl shadow-sm font-bold border transition-all",
                                timer < 10 && timer > 0 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-white text-slate-700 border-slate-100")}>
                                <Clock className="w-4 h-4 text-indigo-500" />
                                <span>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
                            </div>
                        </div>

                        {/* Grid */}
                        <div
                            className={cn(
                                "grid mx-auto px-2 perspective-1000 max-h-[65vh] overflow-visible",
                                difficulty === 'easy' ? "gap-3" : "gap-1.5"
                            )}
                            style={{
                                gridTemplateColumns: `repeat(${getConfig(difficulty).cols}, 1fr)`,
                            }}
                        >
                            {cards.map((card, index) => (
                                <button
                                    key={card.id + '-' + index}
                                    onClick={() => handleCardClick(index)}
                                    className="aspect-square w-full max-h-24 relative focus:outline-none touch-manipulation"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <div className={cn(
                                        "w-full h-full relative transition-transform duration-500 preserve-3d shadow-sm rounded-xl",
                                        card.isFlipped ? "rotate-y-180" : ""
                                    )}>
                                        {/* Front (Symbol) */}
                                        <div
                                            className={cn(
                                                "absolute inset-0 backface-hidden rounded-xl flex items-center justify-center border-2 rotate-y-180",
                                                card.isMatched ? "bg-green-50 border-green-200" : "bg-white border-white"
                                            )}
                                            style={{ transform: "rotateY(180deg)" }}
                                        >
                                            <svg viewBox="0 0 24 24" className="w-2/3 h-2/3">
                                                {renderSymbol(card.symbol)}
                                            </svg>
                                        </div>

                                        {/* Back (Pattern) */}
                                        <div className="absolute inset-0 backface-hidden bg-indigo-600 rounded-xl flex items-center justify-center border-b-4 border-indigo-800 pointer-events-none">
                                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                                            <span className="text-white font-bold text-2xl drop-shadow-sm font-fredoka">?</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === 'victory' && (
                    <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full animate-in zoom-in-95">
                        <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-bounce" />
                        <h2 className="text-3xl font-bold text-slate-800 mb-2 font-fredoka">Parabéns!</h2>
                        <p className="text-slate-500 mb-6 font-medium">
                            Você encontrou todos os sinais! Jesus é a nossa esperança.
                        </p>
                        <p className="text-lg font-bold text-indigo-600 mb-8 bg-indigo-50 py-2 rounded-xl">
                            Recompensa: +{50 + (difficulty === 'medium' ? 50 : 0) + (difficulty === 'hard' ? 100 : 0)} XP
                        </p>
                        <button onClick={() => setGameState('menu')} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-md transition-transform active:scale-95 text-lg">
                            Jogar Novamente
                        </button>
                    </div>
                )}

                {gameState === 'gameover' && (
                    <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">⏰</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 font-fredoka">O tempo acabou!</h2>
                        <p className="text-slate-500 mb-8 font-medium">Não desista, tente novamente!</p>

                        <button onClick={() => setGameState('menu')} className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-md transition-transform active:scale-95 text-lg">
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {/* Pause Overlay */}
                {gameState === 'paused' && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">⏸️</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2 font-fredoka">Jogo Pausado</h2>
                            <p className="text-slate-500 mb-8 font-medium">Deseja continuar brincando?</p>

                            <div className="space-y-3">
                                <button onClick={() => setGameState('playing')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-transform active:scale-95 text-lg">
                                    Continuar
                                </button>
                                <button onClick={() => setGameState('menu')} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl shadow-md transition-transform active:scale-95 text-lg">
                                    Sair do Jogo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Countdown Overlay */}
                {countdown !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="text-center animate-in zoom-in duration-500">
                            <div className="text-8xl font-fredoka font-bold text-white drop-shadow-lg scale-110 animate-pulse">
                                {countdown > 0 ? countdown : "JÁ!"}
                            </div>
                            <p className="text-white text-xl font-bold mt-4 drop-shadow-md">
                                Prepare-se...
                            </p>
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
