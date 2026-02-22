import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';
import { supabase } from '@/lib/supabase';

// --- Constants ---
const GRAVITY = 0.15; // Super Floaty
const JUMP_FORCE = -9; // Gentle Jump
const MOVE_SPEED = 4.5; // Slight reduction
const MAX_GAP = 120; // Reachable
const MAX_FALL_SPEED = 5; // Parachute effect


const SCREEN_WIDTH = 400; // Virtual width
const SCREEN_HEIGHT = 600; // Virtual height
const PLATFORM_WIDTH = 80; // Wider platforms
const PLATFORM_HEIGHT = 15;
const PLAYER_SIZE = 40;

// --- Types ---
type PlatformType = 'normal' | 'moving' | 'breakable' | 'boost';
interface Platform {
    id: number;
    x: number;
    y: number;
    type: PlatformType;
    visible: boolean;
}

interface Doodler {
    x: number;
    y: number;
    prevY: number; // For collision detection
    vx: number;
    vy: number;
}

export default function SkyJumpGame() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { addXp } = useUser();
    const { toast } = useToast();
    const { id } = useParams<{ id: string }>();

    const [isDripLocked, setIsDripLocked] = useState(false);
    const [dripDaysRemaining, setDripDaysRemaining] = useState(0);
    const [unlockDelayDays, setUnlockDelayDays] = useState(0);
    const [requiredMissionDay, setRequiredMissionDay] = useState(0);
    const [loading, setLoading] = useState(true);

    // Ref for game loop to avoid re-renders
    const requestRef = useRef<number>();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Game State Refs (for physics)
    const doodler = useRef<Doodler>({ x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2, y: SCREEN_HEIGHT - 150, prevY: SCREEN_HEIGHT - 150, vx: 0, vy: 0 });
    const platforms = useRef<Platform[]>([]);
    const cameraY = useRef(0);
    const score = useRef(0);
    const gameActive = useRef(false);
    const input = useRef({ left: false, right: false });
    const highestY = useRef(0); // Tracks progress for biome background

    // React State for UI
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'win'>('start');
    const [displayScore, setDisplayScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    useEffect(() => {
        if (id) fetchGameConfig();
        const saved = localStorage.getItem('skyJumpHighScore');
        if (saved) setHighScore(parseInt(saved));
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
                toast({ title: "Jogo Indisponível", description: "Este jogo estará disponível em breve!", variant: "default" });
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
            toast({ title: "Erro", description: "Falha ao carregar jogo.", variant: "destructive" });
            navigate('/games');
        } finally {
            setLoading(false);
        }
    };

    // ...

    // --- Biomes Logic ---
    const getBiome = (y: number) => {
        // y is negative as we go up
        const height = -y;
        if (height < 5000) return 'from-blue-300 to-blue-100'; // Earth
        if (height < 10000) return 'from-indigo-300 to-blue-300'; // Mountains
        if (height < 20000) return 'from-sky-500 to-indigo-400'; // Sky
        if (height < 30000) return 'from-slate-900 to-indigo-900'; // Space
        return 'from-yellow-100 to-amber-50'; // Heaven
    };

    const [bgGradient, setBgGradient] = useState(getBiome(0));

    // --- Initialization ---
    const initGame = () => {
        doodler.current = { x: SCREEN_WIDTH / 2 - PLAYER_SIZE / 2, y: SCREEN_HEIGHT - 150, prevY: SCREEN_HEIGHT - 150, vx: 0, vy: 0 };
        platforms.current = [];
        cameraY.current = 0;
        score.current = 0;
        highestY.current = 0;
        gameActive.current = true;
        input.current = { left: false, right: false };

        // Generate Initial Platforms
        const startY = SCREEN_HEIGHT - 50;
        const startPlatform = { id: 0, x: SCREEN_WIDTH / 2 - PLATFORM_WIDTH / 2, y: startY, type: 'normal' as PlatformType, visible: true };
        platforms.current.push(startPlatform);

        // Generate ahead starting from the first platform
        generatePlatforms(startY, -1000);

        setGameState('playing');
        setDisplayScore(0);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(update);
    };

    const generatePlatforms = (startY: number, endY: number) => {
        let y = startY;
        while (y > endY) {
            const height = -y;
            // Consistent gaps between 60 and MAX_GAP
            const difficultyMod = Math.min(height / 5000, 40); // 0 to 40 add
            const gap = 60 + Math.random() * (MAX_GAP - 60 - difficultyMod) + difficultyMod;
            // Ensure we don't exceed MAX_GAP even with randomness
            const safeGap = Math.min(gap, MAX_GAP);

            y -= safeGap;

            const x = Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH);
            const typeChance = Math.random();
            let type: PlatformType = 'normal';

            if (height > 1000 && typeChance > 0.8) type = 'moving';
            if (height > 2000 && typeChance > 0.9) type = 'breakable';
            if (typeChance > 0.95) type = 'boost';

            platforms.current.push({
                id: Math.random(),
                x,
                y,
                type,
                visible: true
            });
        }
    };

    // --- Game Loop ---
    const update = () => {
        if (!gameActive.current) return;

        // Save previous Y for collision
        doodler.current.prevY = doodler.current.y;

        // 1. Physics (Constant Speed, No Inertia)
        const MOVE_SPEED = 4; // Slow and steady

        if (input.current.left) {
            doodler.current.vx = -MOVE_SPEED;
        } else if (input.current.right) {
            doodler.current.vx = MOVE_SPEED;
        } else {
            doodler.current.vx = 0; // Immediate stop
        }

        doodler.current.x += doodler.current.vx;
        doodler.current.vy += GRAVITY;

        // Cap terminal velocity (Parachute)
        if (doodler.current.vy > MAX_FALL_SPEED) doodler.current.vy = MAX_FALL_SPEED;

        doodler.current.y += doodler.current.vy;

        // Wrap around screen
        if (doodler.current.x < -PLAYER_SIZE / 2) doodler.current.x = SCREEN_WIDTH - PLAYER_SIZE / 2;
        if (doodler.current.x > SCREEN_WIDTH - PLAYER_SIZE / 2) doodler.current.x = -PLAYER_SIZE / 2;

        // 2. Camera Follow (Lerped or Threshold)
        // Keep player at ~30% of screen height (higher up), so we see more ground below (above thumbs)
        const CAMERA_THRESHOLD = SCREEN_HEIGHT * 0.3;

        if (doodler.current.y < cameraY.current + CAMERA_THRESHOLD) {
            cameraY.current = doodler.current.y - CAMERA_THRESHOLD;
            score.current = Math.floor(-cameraY.current / 10);
            setDisplayScore(score.current);

            if (-cameraY.current > highestY.current + 1000) {
                highestY.current = -cameraY.current;
                setBgGradient(getBiome(doodler.current.y));
            }

            const lastPlatform = platforms.current[platforms.current.length - 1];
            if (lastPlatform && lastPlatform.y > cameraY.current - SCREEN_HEIGHT - 200) {
                generatePlatforms(lastPlatform.y, cameraY.current - SCREEN_HEIGHT - 600);
            }

            // Remove old platforms
            platforms.current = platforms.current.filter(p => p.y < cameraY.current + SCREEN_HEIGHT + 100);
        }

        // 3. Collision Detection (Swept AABB)
        if (doodler.current.vy > 0) { // Only falling
            const footX = doodler.current.x + PLAYER_SIZE / 2;
            const bottomY = doodler.current.y + PLAYER_SIZE;
            const prevBottomY = doodler.current.prevY + PLAYER_SIZE;

            platforms.current.forEach(p => {
                if (!p.visible) return;

                // Horizontal Check
                if (footX >= p.x && footX <= p.x + PLATFORM_WIDTH) {
                    // Vertical Check: Did we cross the platform line this frame?
                    // Or are we strictly sitting on it (tolerance)?
                    const crossedLine = prevBottomY <= p.y + 10 && bottomY >= p.y;

                    if (crossedLine) {
                        // Snap to surface
                        doodler.current.y = p.y - PLAYER_SIZE;
                        doodler.current.vy = 0; // Reset velocity

                        // Apply Jump
                        if (p.type === 'boost') {
                            doodler.current.vy = JUMP_FORCE * 1.5;
                        } else if (p.type === 'breakable') {
                            doodler.current.vy = JUMP_FORCE;
                            setTimeout(() => { p.visible = false; }, 100); // Visual delay
                        } else {
                            doodler.current.vy = JUMP_FORCE;
                        }
                    }
                }
            });
        }

        // Moving Platforms
        platforms.current.forEach(p => {
            if (p.type === 'moving') {
                p.x += Math.sin(Date.now() / 500) * 2;
            }
        });

        // 4. Game Over Condition
        if (doodler.current.y > cameraY.current + SCREEN_HEIGHT) {
            gameOver();
            return;
        }

        // 5. Win Condition
        if (-cameraY.current > 30000) {
            winGame();
            return;
        }

        draw();
        requestRef.current = requestAnimationFrame(update);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Draw Platforms
        platforms.current.forEach(p => {
            if (!p.visible) return;

            // Setup styles based on type
            ctx.fillStyle = '#65a30d'; // Default Green
            if (p.type === 'moving') ctx.fillStyle = '#0ea5e9'; // Blue
            if (p.type === 'breakable') ctx.fillStyle = '#a8a29e'; // Gray
            if (p.type === 'boost') ctx.fillStyle = '#fce7f3'; // Pink (Cloud)

            // Draw relative to camera
            ctx.beginPath();

            // Compatibility fix for older iOS/Browsers that don't support roundRect
            if (ctx.roundRect) {
                ctx.roundRect(p.x, p.y - cameraY.current, PLATFORM_WIDTH, PLATFORM_HEIGHT, 5);
            } else {
                // Fallback for older browsers
                const x = p.x;
                const y = p.y - cameraY.current;
                const w = PLATFORM_WIDTH;
                const h = PLATFORM_HEIGHT;
                const r = 5;
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
            }

            ctx.fill();

            if (p.type === 'boost') {
                ctx.font = '12px Arial';
                ctx.fillStyle = 'black';
                ctx.fillText('☁️', p.x + 20, p.y - cameraY.current + 12);
            }
        });

        // Draw Player (Daniel)
        ctx.fillStyle = '#f59e0b'; // Amber-500
        // Simple Circle for now or Placeholder
        const px = doodler.current.x;
        const py = doodler.current.y - cameraY.current;

        // Body
        ctx.beginPath();
        ctx.arc(px + PLAYER_SIZE / 2, py + PLAYER_SIZE / 2, PLAYER_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(px + 12, py + 15, 6, 0, Math.PI * 2);
        ctx.arc(px + 28, py + 15, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(px + 14, py + 15, 2, 0, Math.PI * 2);
        ctx.arc(px + 26, py + 15, 2, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.beginPath();
        ctx.arc(px + 20, py + 25, 8, 0, Math.PI, false);
        ctx.stroke();

        // Draw Score
        ctx.fillStyle = 'black';
        ctx.font = 'bold 20px Fredoka, sans-serif';
        ctx.fillText(`${score.current}m`, 20, 40);
    };

    const gameOver = () => {
        gameActive.current = false;
        setGameState('gameover');
        if (score.current > 0) addXp(Math.floor(score.current / 10)); // Reward XP

        // Update High Score
        if (score.current > highScore) {
            setHighScore(score.current);
            localStorage.setItem('skyJumpHighScore', score.current.toString());
        }
    };

    const winGame = () => {
        gameActive.current = false;
        setGameState('win');
        addXp(500); // Big Reward
    };

    // --- Input handlers for mobile ---
    const handleTouchStart = (side: 'left' | 'right') => {
        if (side === 'left') input.current.left = true;
        if (side === 'right') input.current.right = true;

        if (gameState === 'start' || gameState === 'gameover') {
            // Tap to start? Maybe explicit button is better
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen group-bg"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    const handleTouchEnd = (side: 'left' | 'right') => {
        if (side === 'left') input.current.left = false;
        if (side === 'right') input.current.right = false;
    };

    return (
        <div className={`min-h-screen bg-gradient-to-b ${bgGradient} flex flex-col font-sans transition-colors duration-1000`}>
            {/* Header */}
            <header className="sticky top-0 z-20 glass border-b border-white/20">
                <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/games')}
                        className="w-10 h-10 rounded-full bg-white/40 hover:bg-white/60 flex items-center justify-center backdrop-blur-md shadow-sm transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </button>
                    <h1 className="font-fredoka font-bold text-xl text-slate-700 drop-shadow-sm">Subindo ao Céu</h1>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500 font-bold">RECORDE</span>
                        <span className="text-sm font-black text-amber-500">{highScore}m</span>
                    </div>
                </div>
            </header>

            {/* Game Canvas Container */}
            <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="relative shadow-2xl rounded-xl overflow-hidden touch-none" style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, maxHeight: '80vh' }}>
                    <canvas
                        ref={canvasRef}
                        width={SCREEN_WIDTH}
                        height={SCREEN_HEIGHT}
                        className="w-full h-full bg-white/10 backdrop-blur-[2px]"
                    />

                    {/* Touch Controls Overlay - Invisible Split Screen */}
                    {gameState === 'playing' && (
                        <div className="absolute inset-0 flex z-10">
                            <div
                                className="flex-1 active:bg-white/5 transition-colors"
                                onPointerDown={() => handleTouchStart('left')}
                                onPointerUp={() => handleTouchEnd('left')}
                                onPointerLeave={() => handleTouchEnd('left')}
                            />
                            <div
                                className="flex-1 active:bg-white/5 transition-colors"
                                onPointerDown={() => handleTouchStart('right')}
                                onPointerUp={() => handleTouchEnd('right')}
                                onPointerLeave={() => handleTouchEnd('right')}
                            />
                        </div>
                    )}

                    {/* Menus */}
                    {gameState === 'start' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                            <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-xs animate-in zoom-in-95">
                                <h2 className="text-2xl font-bold text-primary mb-2 font-fredoka">Pronto para subir?</h2>
                                <p className="text-slate-600 mb-6 font-medium">Toque nos lados da tela para mover Daniel.</p>
                                <button onClick={initGame} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 text-lg">
                                    COMEÇAR
                                </button>
                            </div>
                        </div>
                    )}

                    {gameState === 'gameover' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                            <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-xs animate-in zoom-in-95">
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">🌤️</span>
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-1">Quase lá!</h2>
                                <p className="text-slate-500 mb-4">Você subiu {displayScore} metros!</p>

                                {displayScore >= highScore && displayScore > 0 ? (
                                    <div className="mb-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold animate-pulse">
                                        🏆 NOVO RECORDE!
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 mb-6 font-bold">Seu recorde: {highScore}m</p>
                                )}

                                <button onClick={initGame} className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95">
                                    Tentar Novamente
                                </button>
                            </div>
                        </div>
                    )}

                    {gameState === 'win' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-yellow-100/90 backdrop-blur-md z-30">
                            <div className="text-center p-8 animate-in fade-in slide-in-from-bottom-10">
                                <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4 animate-bounce" />
                                <h1 className="text-4xl font-bold text-yellow-600 mb-4 font-fredoka">Glória!</h1>
                                <p className="text-lg text-yellow-800 font-medium mb-8">Daniel chegou ao céu!</p>
                                <button onClick={() => navigate('/games')} className="px-8 py-3 bg-white text-yellow-600 font-bold rounded-full shadow-xl hover:shadow-2xl transition-transform active:scale-95">
                                    Voltar para Jogos
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Helper Text */}
                {gameState === 'playing' && (
                    <div className="absolute bottom-8 flex w-full justify-between px-12 text-white/50 text-sm font-bold pointer-events-none">
                        <span className="animate-pulse">👈 ESQUERDA</span>
                        <span className="animate-pulse">DIREITA 👉</span>
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
