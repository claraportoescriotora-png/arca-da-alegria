import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trophy, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// --- Game Constants ---
const GRID_SIZE = 15; // 15x15 Grid
const INITIAL_SPEED = 400;
const MIN_SPEED = 100;
const WOLF_MOVE_INTERVAL = 20; // Moves every 20 ticks

// --- Types ---
type Position = { x: number; y: number };
type FruitType = 'apple' | 'grape' | 'pear' | 'strawberry';

const FRUITS: { type: FruitType; icon: string; color: string }[] = [
    { type: 'apple', icon: '🍎', color: 'text-red-500' },
    { type: 'grape', icon: '🍇', color: 'text-purple-500' },
    { type: 'pear', icon: '🍐', color: 'text-yellow-500' },
    { type: 'strawberry', icon: '🍓', color: 'text-pink-500' },
];

export default function ShepherdGame() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addXp } = useUser();
    const { toast } = useToast();

    // --- State ---
    const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
    const [direction, setDirection] = useState<Position>({ x: 1, y: 0 }); // Moving Right
    const [nextDirection, setNextDirection] = useState<Position>({ x: 1, y: 0 }); // Buffer for input
    const [fruit, setFruit] = useState<{ pos: Position; type: FruitType; icon: string }>({ pos: { x: 10, y: 10 }, type: 'apple', icon: '🍎' });
    const [wolf, setWolf] = useState<Position | null>(null); // Wolf might not appear immediately
    const [wolfTimer, setWolfTimer] = useState(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('shepherd_highscore') || '0'));
    const [gameWon, setGameWon] = useState(false); // Can you "win"? Maybe reach 100 sheep?

    const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);

    // --- Initialization ---
    useEffect(() => {
        spawnFruit();
        spawnWolf();
    }, []);

    // --- Input Handling ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': if (direction.y === 0) setNextDirection({ x: 0, y: -1 }); break;
                case 'ArrowDown': if (direction.y === 0) setNextDirection({ x: 0, y: 1 }); break;
                case 'ArrowLeft': if (direction.x === 0) setNextDirection({ x: -1, y: 0 }); break;
                case 'ArrowRight': if (direction.x === 0) setNextDirection({ x: 1, y: 0 }); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [direction]);

    // --- Game Loop ---
    useEffect(() => {
        if (isPlaying && !isGameOver && !gameWon) {
            const speed = Math.max(MIN_SPEED, INITIAL_SPEED - (score * 2));
            gameLoopRef.current = setInterval(moveSnake, speed);
        } else {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        }
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [isPlaying, isGameOver, gameWon, snake, direction, nextDirection, wolf, score]); // Dependencies for closure freshness

    // --- Logic ---
    const moveSnake = () => {
        setDirection(nextDirection);
        const newHead = {
            x: snake[0].x + nextDirection.x,
            y: snake[0].y + nextDirection.y
        };

        // 1. Check if moving OUTSIDE grid
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            handleGameOver();
            return;
        }

        // 2. Check if moving INTO itself (Self-Collision)
        // Forgiveness: Only die if it's NOT the tail (which will move). 
        // Actually standard snake dies on body. But let's check carefully.
        const bodyCollision = snake.slice(0, -1).some(segment => segment.x === newHead.x && segment.y === newHead.y);
        if (bodyCollision) {
            handleGameOver();
            return;
        }

        // 3. Wolf Collision
        if (wolf && newHead.x === wolf.x && newHead.y === wolf.y) {
            handleWolfCollision();
            // Don't move into the wolf, just hit it and recoil? 
            // Or move through it but lose tail?
            // Let's bounce back? Or just continue moving but lose tail?
            // "O jogo continua" -> Ensure we don't die. 
            // If we just continue, we'll overlap the wolf. Let's respawn the wolf immediately if hit.
            spawnWolf();
        }

        const newSnake = [newHead, ...snake];

        // 4. Fruit Collection
        if (newHead.x === fruit.pos.x && newHead.y === fruit.pos.y) {
            setScore(s => s + 1);
            spawnFruit();
            // Don't pop tail -> snake grows
        } else {
            newSnake.pop(); // Remove tail
        }

        // Wolf Movement Logic
        setWolfTimer(t => {
            if (t >= WOLF_MOVE_INTERVAL) {
                spawnWolf(); // Relocate wolf
                return 0;
            }
            return t + 1;
        });

        setSnake(newSnake);
    };

    const handleWolfCollision = () => {
        toast({
            title: "Cuidado com o Lobo! 🐺",
            description: "Você perdeu algumas ovelhinhas!",
            variant: "destructive",
            duration: 2000
        });

        // Lose last 3 segments (but keep at least head)
        setSnake(prev => {
            const keepCount = Math.max(1, prev.length - 3);
            return prev.slice(0, keepCount);
        });
    };

    const handleGameOver = () => {
        setIsGameOver(true);
        setIsPlaying(false);
        if (score > 0) {
            addXp(score * 10); // 10 XP per sheep
        }

        // Update High Score
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('shepherd_highscore', score.toString());
        }
    };

    const spawnFruit = () => {
        // Random Position not on snake or wolf
        let newPos;
        do {
            newPos = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
        } while (isOccupied(newPos));

        const randomFruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        setFruit({ pos: newPos, type: randomFruit.type, icon: randomFruit.icon });
    };

    const spawnWolf = () => {
        // Random Position away from head
        let newPos;
        let attempts = 0;
        do {
            newPos = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            attempts++;
        } while (
            (isOccupied(newPos) || distanceFromHead(newPos) < 4) && attempts < 50
        );

        if (attempts < 50) setWolf(newPos);
    };

    const isOccupied = (pos: Position) => {
        // Check snake
        if (snake.some(s => s.x === pos.x && s.y === pos.y)) return true;
        // Check wolf
        if (wolf && wolf.x === pos.x && wolf.y === pos.y) return true;
        return false;
    };

    const distanceFromHead = (pos: Position) => {
        if (snake.length === 0) return 0;
        return Math.abs(pos.x - snake[0].x) + Math.abs(pos.y - snake[0].y);
    };

    const startGame = () => {
        setSnake([{ x: 7, y: 7 }]);
        setDirection({ x: 1, y: 0 });
        setNextDirection({ x: 1, y: 0 });
        setScore(0);
        setIsGameOver(false);
        setIsPlaying(true);
        spawnFruit();
        spawnWolf();
    };

    // --- Rendering Helpers ---
    const getCellContent = (x: number, y: number) => {
        // 1. Snake Head
        if (snake[0].x === x && snake[0].y === y) return <span className="text-xl animate-bounce">🧑‍🦯</span>; // Shepherd/Leader

        // 2. Snake Body
        const bodyIndex = snake.findIndex((s, i) => i > 0 && s.x === x && s.y === y);
        if (bodyIndex !== -1) return <span className="text-lg animate-pulse delay-75">🐑</span>;

        // 3. Fruit
        if (fruit.pos.x === x && fruit.pos.y === y) return <span className="text-lg animate-bounce">{fruit.icon}</span>;

        // 4. Wolf
        if (wolf && wolf.x === x && wolf.y === y) return <span className="text-xl">🐺</span>;

        return null;
    };

    return (
        <div className="min-h-screen bg-[#F0F9FF] flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-20 glass border-b border-border/50">
                <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/games')}
                        className="w-10 h-10 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-colors active:scale-95 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>

                    <div className="flex flex-col items-center">
                        <h1 className="font-fredoka font-bold text-lg text-slate-700">O Bom Pastor</h1>
                        <div className="flex gap-4 text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1">🐑 {score}</span>
                            <span className="flex items-center gap-1 text-amber-500">🏆 {highScore}</span>
                        </div>
                    </div>

                    <button
                        onClick={startGame}
                        className="w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors active:scale-95 shadow-sm text-green-700"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Game Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">

                {/* Sky / Background Decor */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-200 to-transparent -z-10" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-green-100 to-transparent -z-10" />

                {/* Board */}
                <div
                    className="relative bg-white/40 backdrop-blur-sm border-4 border-white rounded-xl shadow-xl overflow-hidden"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                        width: '100%',
                        maxWidth: '400px',
                        aspectRatio: '1/1',
                    }}
                >
                    {/* Overlay if Not Playing */}
                    {!isPlaying && (
                        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                            {isGameOver ? (
                                <div className="bg-white p-6 rounded-3xl shadow-2xl animate-in zoom-in-95 max-w-[280px] w-full text-center">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2 font-fredoka">Ops!</h2>
                                    <p className="text-slate-600 mb-2">O pastor tropeçou, mas ele pode tentar de novo!</p>
                                    <p className="text-slate-500 mb-4 text-sm font-bold">Ovelhinhas salvas: {score}</p>
                                    <button onClick={startGame} className="w-full bg-green-500 text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:bg-green-600 active:scale-95 transition-all">
                                        Tentar Novamente
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 max-w-[280px] w-full text-center">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2 font-fredoka">Vamos começar?</h2>
                                    <p className="text-slate-600 mb-6 text-sm">Use as setas para guiar o pastor e juntar as ovelhinhas. Cuidado com o lobo! 🐺</p>
                                    <button onClick={startGame} className="w-full bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-600 active:scale-95 transition-all animate-pulse">
                                        Começar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grid Cells */}
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                        const x = i % GRID_SIZE;
                        const y = Math.floor(i / GRID_SIZE);
                        const isChecker = (x + y) % 2 === 0;
                        return (
                            <div
                                key={i}
                                className={cn(
                                    "w-full h-full flex items-center justify-center text-sm select-none",
                                    isChecker ? "bg-green-50/50" : "bg-green-100/50" // Checkerboard pattern
                                )}
                            >
                                {getCellContent(x, y)}
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Controls */}
                <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-[220px] relative z-20 pb-8">
                    <div />
                    <button
                        className="h-16 bg-white rounded-2xl shadow-md border-b-4 border-slate-200 flex items-center justify-center active:bg-blue-50 active:translate-y-1 transition-all"
                        onPointerDown={(e) => { e.preventDefault(); if (direction.y === 0) setNextDirection({ x: 0, y: -1 }); }}
                    >
                        <ArrowUp className="w-10 h-10 text-slate-600" />
                    </button>
                    <div />

                    <button
                        className="h-16 bg-white rounded-2xl shadow-md border-b-4 border-slate-200 flex items-center justify-center active:bg-blue-100 active:translate-y-1 transition-all"
                        onPointerDown={(e) => { e.preventDefault(); if (direction.x === 0) setNextDirection({ x: -1, y: 0 }); }}
                    >
                        <ArrowLeftIcon className="w-10 h-10 text-slate-600" />
                    </button>
                    <button
                        className="h-16 bg-white rounded-2xl shadow-md border-b-4 border-slate-200 flex items-center justify-center active:bg-blue-100 active:translate-y-1 transition-all"
                        onPointerDown={(e) => { e.preventDefault(); if (direction.y === 0) setNextDirection({ x: 0, y: 1 }); }}
                    >
                        <ArrowDown className="w-10 h-10 text-slate-600" />
                    </button>
                    <button
                        className="h-16 bg-white rounded-2xl shadow-md border-b-4 border-slate-200 flex items-center justify-center active:bg-blue-100 active:translate-y-1 transition-all"
                        onPointerDown={(e) => { e.preventDefault(); if (direction.x === 0) setNextDirection({ x: 1, y: 0 }); }}
                    >
                        <ArrowRight className="w-10 h-10 text-slate-600" />
                    </button>
                </div>

            </main>
        </div>
    );
}
