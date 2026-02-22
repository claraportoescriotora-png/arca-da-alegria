import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Music, Trophy, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';

// --- Configuration ---
const COLORS = [
    { id: 0, color: 'bg-red-400', active: 'bg-red-300', sound: 'C4', label: '❤️' },
    { id: 1, color: 'bg-blue-400', active: 'bg-blue-300', sound: 'E4', label: '☁️' },
    { id: 2, color: 'bg-green-400', active: 'bg-green-300', sound: 'G4', label: '🌿' },
    { id: 3, color: 'bg-yellow-400', active: 'bg-yellow-300', sound: 'C5', label: '⭐' },
];

const VERSES = [
    "Muito bem! Seja forte e corajoso!", // Josh 1:9
    "O Senhor é o meu pastor!", // Psalm 23:1
    "Tudo posso naquele que me fortalece!", // Phil 4:13
    "Alegrai-vos sempre no Senhor!", // Phil 4:4
    "O amor é paciente e bondoso.", // 1 Cor 13:4
];

export default function RhythmGame() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { addXp } = useUser();

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
    }, [dataLoaded, profile]);

    // State
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSequence, setPlayerSequence] = useState<number[]>([]);
    const [round, setRound] = useState(() => parseInt(localStorage.getItem('rhythm_level') || '1'));
    const [gameState, setGameState] = useState<'start' | 'watching' | 'playing' | 'success' | 'gameover'>('start');
    const [activeBtn, setActiveBtn] = useState<number | null>(null);
    const [message, setMessage] = useState("Repita a sequência!");
    const [muted, setMuted] = useState(false);

    // Audio Context (Lazy init)
    const audioCtx = useRef<AudioContext | null>(null);

    // --- Audio Logic ---
    const playTone = (freq: number, type: 'sine' | 'triangle' = 'sine') => {
        if (muted) return;
        if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);

        gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.current.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(audioCtx.current.destination);

        osc.start();
        osc.stop(audioCtx.current.currentTime + 0.5);
    };

    const getFreq = (note: string) => {
        switch (note) {
            case 'C4': return 261.63;
            case 'E4': return 329.63;
            case 'G4': return 392.00;
            case 'C5': return 523.25;
            default: return 440;
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

            setUnlockDelayDaysFetched(data.unlock_delay_days || 0);
            setRequiredMissionDayFetched(data.required_mission_day || 0);
            setDataLoaded(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- Game Logic ---
    const startGame = () => {
        setSequence([]);
        setPlayerSequence([]);
        setGameState('watching');

        const startLevel = parseInt(localStorage.getItem('rhythm_level') || '1');
        setRound(startLevel);
        setMessage("Observe...");

        setTimeout(() => startRoundWithLevel(startLevel), 1000);
    };

    const startRoundWithLevel = (lvl: number) => {
        const length = lvl + 1;
        const newSeq: number[] = [];

        let last = -1;
        for (let i = 0; i < length; i++) {
            let next = Math.floor(Math.random() * 4);
            if (i > 0 && next === last && Math.random() > 0.3) {
                next = (next + 1) % 4;
            }
            newSeq.push(next);
            last = next;
        }

        setSequence(newSeq);
        setPlayerSequence([]);
        setGameState('watching');
        setMessage(`Nível ${lvl}: Observe!`);

        playSequence(newSeq);
    }

    const nextRound = () => {
        const currentSeq = [...sequence];

        let next = Math.floor(Math.random() * 4);
        if (currentSeq.length >= 2) {
            const last1 = currentSeq[currentSeq.length - 1];
            const last2 = currentSeq[currentSeq.length - 2];
            if (last1 === last2 && next === last1) {
                next = (next + 1) % 4;
            }
        }

        const newSeq = [...currentSeq, next];
        setSequence(newSeq);
        setPlayerSequence([]);
        setGameState('watching');
        setMessage(`Nível ${round + 1}: Observe!`);

        playSequence(newSeq);
    };

    const playSequence = (seq: number[]) => {
        let i = 0;
        const interval = setInterval(() => {
            if (i >= seq.length) {
                clearInterval(interval);
                setGameState('playing');
                setMessage("Sua vez!");
                return;
            }

            const btnId = seq[i];
            activateButton(btnId);
            i++;
        }, 800);
    };

    const activateButton = (id: number) => {
        setActiveBtn(id);
        const btn = COLORS.find(c => c.id === id);
        if (btn) playTone(getFreq(btn.sound));
        setTimeout(() => setActiveBtn(null), 400);
    };

    const handleTap = (id: number) => {
        if (gameState !== 'playing' || isDripLocked) return;

        activateButton(id);

        const newPlayerSeq = [...playerSequence, id];
        setPlayerSequence(newPlayerSeq);

        const currentIndex = newPlayerSeq.length - 1;
        if (newPlayerSeq[currentIndex] !== sequence[currentIndex]) {
            setGameState('gameover');
            setMessage("Ops! Vamos tentar de novo?");
            playTone(150, 'triangle');
            return;
        }

        if (newPlayerSeq.length === sequence.length) {
            setGameState('success');
            const verse = VERSES[Math.floor(Math.random() * VERSES.length)];
            setMessage(verse);
            addXp(20);

            const nextLevel = round + 1;
            localStorage.setItem('rhythm_level', nextLevel.toString());

            setTimeout(() => {
                setRound(nextLevel);
                nextRound();
            }, 2000);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-sky-100 font-sans"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div></div>;

    return (
        <div className="min-h-screen bg-sky-100 flex flex-col font-sans select-none overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-20 glass border-b border-white/20 bg-white/30 backdrop-blur-md">
                <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/games')}
                        className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-6 h-6 text-sky-700" />
                    </button>
                    <h1 className="font-fredoka font-bold text-xl text-sky-800 flex items-center gap-2">
                        <Music className="w-5 h-5" /> Ritmo
                    </h1>
                    <button
                        onClick={() => setMuted(!muted)}
                        className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors shadow-sm"
                    >
                        {muted ? <VolumeX className="w-5 h-5 text-sky-700" /> : <Volume2 className="w-5 h-5 text-sky-700" />}
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">

                {/* Status Board */}
                <div className="mb-8 text-center space-y-2">
                    <span className="inline-block px-4 py-1 bg-white/60 rounded-full text-sky-800 font-bold text-sm shadow-sm backdrop-blur-sm">
                        Nível {round}
                    </span>
                    <h2 className={cn(
                        "text-2xl font-fredoka font-bold transition-all duration-300",
                        gameState === 'watching' ? "text-sky-600 scale-100" :
                            gameState === 'playing' ? "text-green-600 scale-110" :
                                gameState === 'gameover' ? "text-red-500" : "text-sky-800"
                    )}>
                        {message}
                    </h2>
                </div>

                {/* Game Grid */}
                {gameState === 'start' ? (
                    <div className="text-center space-y-6">
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl animate-bounce-soft">
                            <Music className="w-16 h-16 text-sky-400" />
                        </div>
                        <p className="text-sky-700 px-8">Observe a sequência de sons e cores, depois repita!</p>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-lg"
                        >
                            Começar
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 w-full aspect-square relative">
                        {COLORS.map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => handleTap(btn.id)}
                                disabled={gameState !== 'playing'}
                                className={cn(
                                    "rounded-3xl shadow-lg transform transition-all duration-100 flex items-center justify-center text-4xl",
                                    btn.color,
                                    activeBtn === btn.id ? "scale-95 brightness-110 ring-4 ring-white/50" : "hover:brightness-105",
                                    gameState !== 'playing' && "cursor-not-allowed opacity-90"
                                )}
                            >
                                <span className={cn(
                                    "transition-transform duration-200",
                                    activeBtn === btn.id ? "scale-125" : "scale-100"
                                )}>
                                    {btn.label}
                                </span>
                            </button>
                        ))}

                        {/* Game Over Overlay */}
                        {gameState === 'gameover' && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-10 animate-in fade-in">
                                <RotateCcw className="w-16 h-16 text-sky-500 mb-4" />
                                <h3 className="text-xl font-bold text-sky-900 mb-4">Tente Novamente!</h3>
                                <button
                                    onClick={startGame}
                                    className="px-6 py-2 bg-sky-500 text-white rounded-xl font-bold shadow hover:bg-sky-600"
                                >
                                    Reiniciar
                                </button>
                            </div>
                        )}
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
