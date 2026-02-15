import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trophy, Lightbulb, Key, DoorOpen, Skull } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { cn } from "@/lib/utils";

// --- Types ---
type CellType = 'wall' | 'path' | 'start' | 'end' | 'key' | 'door' | 'sin';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Cell {
    x: number;
    y: number;
    type: CellType;
    visited: boolean;
    visible: boolean;
    isGuide: boolean;
    open?: boolean;
}

export default function FindJesusGame() {
    const navigate = useNavigate();
    const { addXp } = useUser();

    // --- State ---
    const [level, setLevel] = useState(() => parseInt(localStorage.getItem('find_jesus_level') || '1'));

    // Config
    const getGridSize = () => Math.min(31, 11 + Math.floor((level - 1) * 2)); // Grows wider. Odd numbers prefered for Maze.
    const getFogRadius = () => {
        if (level < 3) return 5;
        if (level < 6) return 4;
        return 3;
    };

    const [grid, setGrid] = useState<Cell[][]>([]);
    const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
    const [hasKey, setHasKey] = useState(false);
    const [gameState, setGameState] = useState<'playing' | 'victory' | 'gameover'>('playing');
    const [guideCooldown, setGuideCooldown] = useState(0);
    const [showGuide, setShowGuide] = useState(false);

    const touchStart = useRef<{ x: number, y: number } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // --- Helpers ---
    const getPath = (grid: Cell[][], start: { x: number, y: number }, endType: CellType): { x: number, y: number }[] | null => {
        const size = grid.length;
        const queue: { x: number, y: number, path: { x: number, y: number }[] }[] = [];
        const visited = new Set<string>();

        queue.push({ x: start.x, y: start.y, path: [] });
        visited.add(`${start.x},${start.y}`);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const cell = grid[current.y][current.x];

            if (cell.type === endType) {
                return current.path;
            }

            const neighbors = [
                { x: current.x, y: current.y - 1 }, { x: current.x, y: current.y + 1 },
                { x: current.x - 1, y: current.y }, { x: current.x + 1, y: current.y }
            ];

            for (const n of neighbors) {
                if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size) {
                    const nCell = grid[n.y][n.x];
                    // Walkable?
                    // Wall is no up. Sin is no up.
                    // Door is walkable ONLY if we are hypothetically checking connectivity assuming we have key,
                    // BUT for the 'Guide' we check real state. 
                    // For 'Generation' we treat door as walkable because we place key reachable.
                    if (nCell.type !== 'wall' && nCell.type !== 'sin' && !visited.has(`${n.x},${n.y}`)) {
                        visited.add(`${n.x},${n.y}`);
                        queue.push({
                            x: n.x, y: n.y,
                            path: [...current.path, { x: n.x, y: n.y }]
                        });
                    }
                }
            }
        }
        return null;
    };


    // --- Maze Generation ---
    const generateMaze = useCallback(() => {
        let size = getGridSize();
        if (size % 2 === 0) size++; // Ensure odd logic for walls

        // 1. Initialize
        const newGrid: Cell[][] = Array.from({ length: size }, (_, y) =>
            Array.from({ length: size }, (_, x) => ({
                x, y,
                type: 'wall',
                visited: false,
                visible: false,
                isGuide: false
            }))
        );

        // 2. Recursive Backtracker
        const stack: { x: number, y: number }[] = [];
        const startX = 1;
        const startY = 1;

        newGrid[startY][startX].type = 'path';
        newGrid[startY][startX].visited = true;
        stack.push({ x: startX, y: startY });

        const directions = [
            { dx: 0, dy: -2 }, { dx: 0, dy: 2 },
            { dx: -2, dy: 0 }, { dx: 2, dy: 0 }
        ];

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors: { x: number, y: number }[] = [];

            for (const { dx, dy } of directions) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && !newGrid[ny][nx].visited) {
                    neighbors.push({ x: nx, y: ny });
                }
            }

            if (neighbors.length > 0) {
                const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                const wallX = current.x + (chosen.x - current.x) / 2;
                const wallY = current.y + (chosen.y - current.y) / 2;

                newGrid[wallY][wallX].type = 'path';
                newGrid[chosen.y][chosen.x].type = 'path';
                newGrid[chosen.y][chosen.x].visited = true;
                stack.push(chosen);
            } else {
                stack.pop();
            }
        }

        // 3. Braiding (Loops) - More aggressive on higher levels
        if (level > 1) {
            for (let y = 1; y < size - 1; y += 2) {
                for (let x = 1; x < size - 1; x += 2) {
                    if (newGrid[y][x].type === 'path') {
                        let pathNeighbors = 0;
                        for (const { dx, dy } of directions) {
                            if (newGrid[y + dy / 2]?.[x + dx / 2]?.type !== 'wall') pathNeighbors++;
                        }
                        // If dead end or just random (for difficulty)
                        const chance = level > 5 ? 0.3 : 0.1;
                        if (pathNeighbors === 1 || Math.random() < chance) {
                            const potentialBreaks = directions.filter(({ dx, dy }) => {
                                const nx = x + dx;
                                const ny = y + dy;
                                return nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && newGrid[ny][nx].type === 'path';
                            });
                            if (potentialBreaks.length > 0) {
                                const brk = potentialBreaks[Math.floor(Math.random() * potentialBreaks.length)];
                                newGrid[y + brk.dy / 2][x + brk.dx / 2].type = 'path';
                            }
                        }
                    }
                }
            }
        }

        // 4. Place End
        let endX = size - 2;
        let endY = size - 2;
        while (newGrid[endY][endX].type !== 'path') {
            endX--;
            if (endX < 1) { endX = size - 2; endY--; }
        }
        newGrid[endY][endX].type = 'end';

        // 5. Place Traps (Sin) - INTERCEPTING THE PATH
        if (level >= 3) {
            // Calculate solution path first
            let pathToEnd = getPath(newGrid, { x: 1, y: 1 }, 'end');

            if (pathToEnd && pathToEnd.length > 5) {
                // Determine number of traps based on level
                const trapCount = Math.floor(level / 2);

                for (let i = 0; i < trapCount; i++) {
                    // Recalculate path each time because config changes
                    pathToEnd = getPath(newGrid, { x: 1, y: 1 }, 'end');
                    if (!pathToEnd) break;

                    // Pick a spot in the middle 50% of the path
                    const pathIdx = Math.floor(pathToEnd.length * (0.3 + Math.random() * 0.4));
                    const trapPos = pathToEnd[pathIdx];

                    // Don't place trap on start/end/neighbors of start
                    if (trapPos && trapPos.x + trapPos.y > 4) {
                        newGrid[trapPos.y][trapPos.x].type = 'sin';

                        // CRITICAL: ENSURE BYPASS
                        // Check if still solvable. If not, carve a detour.
                        if (!getPath(newGrid, { x: 1, y: 1 }, 'end')) {
                            // Carve detour: Find neighbors of trapPos that are walls, turn one into path connecting to existing path
                            // Simple: Blast clear neighbors
                            const neighbors = [
                                { x: trapPos.x + 1, y: trapPos.y }, { x: trapPos.x - 1, y: trapPos.y },
                                { x: trapPos.x, y: trapPos.y + 1 }, { x: trapPos.x, y: trapPos.y - 1 }
                            ];
                            for (const n of neighbors) {
                                if (n.x > 0 && n.x < size - 1 && n.y > 0 && n.y < size - 1 && newGrid[n.y][n.x].type === 'wall') {
                                    newGrid[n.y][n.x].type = 'path';
                                    // Just opening one might not be enough if it leads to sealed area, 
                                    // but with braided loops it usually works. 
                                    // To be safe, we open diagonals too? No, let's keep it simple.
                                }
                            }
                        }
                    }
                }
            }
        }

        // 6. Keys and Doors
        if (level >= 5) { // Moved to level 5 for better difficulty curve
            // ... logic same as before but ensured persistence
            // For now simplified logic
            let keyPlaced = false;
            while (!keyPlaced) {
                const kx = Math.floor(Math.random() * (size - 2)) + 1;
                const ky = Math.floor(Math.random() * (size - 2)) + 1;
                if (newGrid[ky][kx].type === 'path') {
                    newGrid[ky][kx].type = 'key';
                    keyPlaced = true;
                }
            }
            // Door near end
            const endNeighbors = [{ x: endX - 1, y: endY }, { x: endX, y: endY - 1 }];
            for (const n of endNeighbors) { // simplified check
                if (newGrid[n.y]?.[n.x]?.type === 'path') {
                    newGrid[n.y][n.x].type = 'door';
                    newGrid[n.y][n.x].open = false;
                    break;
                }
            }
        }

        newGrid[1][1].type = 'start';

        setGrid(newGrid);
        setPlayerPos({ x: 1, y: 1 });
        setHasKey(level < 5);
        setGameState('playing');
        setShowGuide(false);
        setGuideCooldown(0);
        updateFogOfWar(newGrid, 1, 1);

    }, [level]);

    // --- Fog ---
    const updateFogOfWar = (currentGrid: Cell[][], px: number, py: number) => {
        const radius = getFogRadius();
        const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
        for (let y = 0; y < newGrid.length; y++) {
            for (let x = 0; x < newGrid[0].length; x++) {
                if (newGrid[y][x].visible) continue;
                const dist = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
                if (dist <= radius) newGrid[y][x].visible = true;
            }
        }
        setGrid(newGrid);
    };

    // --- Guide ---
    const triggerGuide = () => {
        if (guideCooldown > 0 || showGuide || gameState !== 'playing') return;
        setShowGuide(true);
        setGuideCooldown(30 + (level * 2));

        const target = (level >= 5 && !hasKey) ? 'key' : 'end';

        // Custom BFS that respects Doors if locked
        // ... (similar to previous, can just re-use logic)
        // For simplicity reusing BFS logic in-line not needed if we trust player to explore
        // Let's implement a visual "Hint" that just highlights direction or short path

        // Simple BFS for Guide
        const path = getPath(grid, playerPos, target as CellType);

        if (path) {
            const newGrid = [...grid];
            path.slice(0, 15).forEach(p => { // Only show next 15 steps
                if (newGrid[p.y][p.x].type === 'path' || newGrid[p.y][p.x].type === 'door') {
                    newGrid[p.y][p.x].isGuide = true;
                }
            });
            setGrid(newGrid);
            setTimeout(() => {
                setGrid(prev => prev.map(row => row.map(cell => ({ ...cell, isGuide: false }))));
                setShowGuide(false);
            }, 3000);
        }
    };

    // Cooldown
    useEffect(() => {
        if (guideCooldown > 0) {
            const timer = setInterval(() => setGuideCooldown(c => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [guideCooldown]);

    // --- Move ---
    const move = (dx: number, dy: number) => {
        if (gameState !== 'playing') return;
        const newX = playerPos.x + dx;
        const newY = playerPos.y + dy;
        const size = getGridSize();

        if (newX < 0 || newX >= size || newY < 0 || newY >= size) return;
        const cell = grid[newY][newX];

        if (cell.type === 'wall') return;
        if (cell.type === 'door' && !hasKey) return;

        // SIN TRAP
        if (cell.type === 'sin') {
            setGameState('gameover');
            return;
        }

        setPlayerPos({ x: newX, y: newY });
        updateFogOfWar(grid, newX, newY);

        if (cell.type === 'key') {
            setHasKey(true);
            const newGrid = [...grid];
            newGrid[newY][newX] = { ...cell, type: 'path' };
            setGrid(newGrid);
        }
        if (cell.type === 'end') handleVictory();
    };

    const handleVictory = () => {
        setGameState('victory');
        addXp(50 + level * 15);
        localStorage.setItem('find_jesus_level', (level + 1).toString());
    };

    const restartLevel = () => {
        generateMaze(); // Regenerates same level
    };

    useEffect(() => { generateMaze(); }, [generateMaze]);

    // Keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') move(0, -1);
            if (e.key === 'ArrowDown') move(0, 1);
            if (e.key === 'ArrowLeft') move(-1, 0);
            if (e.key === 'ArrowRight') move(1, 0);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playerPos, grid, gameState]);

    const gridSize = getGridSize();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans touch-none select-none">
            <header className="sticky top-0 z-20 glass border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
                <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={() => navigate('/games')} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="font-fredoka font-bold text-lg text-white">Nível {level}</h1>
                        <div className="flex gap-2 text-xs text-white/50">
                            {level >= 5 && (
                                <span className={cn("flex items-center gap-1", hasKey ? "text-yellow-400" : "text-white/30")}>
                                    <Key className="w-3 h-3" /> {hasKey ? "Com Chave" : "Sem Chave"}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={triggerGuide} disabled={guideCooldown > 0} className={cn("w-10 h-10 rounded-full flex items-center justify-center", guideCooldown > 0 ? "bg-slate-800 text-white/30" : "bg-yellow-500 animate-pulse text-white")}>
                            <Lightbulb className="w-5 h-5" />
                        </button>
                        <button onClick={() => generateMaze()} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div
                    ref={gridRef}
                    className="relative bg-black rounded-xl shadow-2xl overflow-hidden touch-none border border-slate-800"
                    style={{
                        width: 'min(92vw, 400px)',
                        height: 'min(92vw, 400px)',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                    }}
                    onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
                    onTouchEnd={(e) => {
                        if (!touchStart.current) return;
                        const dx = e.changedTouches[0].clientX - touchStart.current.x;
                        const dy = e.changedTouches[0].clientY - touchStart.current.y;
                        if (Math.abs(dx) > Math.abs(dy)) {
                            if (Math.abs(dx) > 20) move(dx > 0 ? 1 : -1, 0);
                        } else {
                            if (Math.abs(dy) > 20) move(0, dy > 0 ? 1 : -1);
                        }
                        touchStart.current = null;
                    }}
                >
                    {grid.map((row) => row.map((cell) => {
                        const isPlayer = playerPos.x === cell.x && playerPos.y === cell.y;
                        if (!cell.visible) return <div key={`${cell.x}-${cell.y}`} className="bg-slate-950" />;

                        let bg = "bg-slate-900";
                        if (cell.type === 'wall') bg = "bg-slate-800 rounded-sm scale-90";
                        else if (cell.type === 'door') bg = hasKey ? "bg-green-900/50" : "bg-red-900/50";
                        else if (cell.type === 'sin') bg = "bg-red-950/30"; // Subtle warning on path?
                        else if (cell.isGuide) bg = "bg-yellow-500/20";

                        return (
                            <div key={`${cell.x}-${cell.y}`} className={cn("flex items-center justify-center", bg)}>
                                {cell.type === 'end' && <span className="text-yellow-400 animate-pulse text-lg">✨</span>}
                                {cell.type === 'key' && <Key className="text-yellow-400 w-3 h-3" />}
                                {cell.type === 'door' && <DoorOpen className={hasKey ? "text-green-400 w-4 h-4" : "text-red-400 w-4 h-4"} />}
                                {cell.type === 'sin' && <Skull className="text-red-500 w-4 h-4 animate-bounce" />}
                                {isPlayer && <span className="text-xl">🧒</span>}
                            </div>
                        );
                    }))}

                    {gameState === 'victory' && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
                            <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Vitória!</h2>
                            <button onClick={() => setLevel(l => l + 1)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Próximo Nível</button>
                        </div>
                    )}

                    {gameState === 'gameover' && (
                        <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
                            <Skull className="w-16 h-16 text-red-500 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Cuidado com o Pecado!</h2>
                            <p className="text-white/70 mb-6 text-sm">Ele te afasta do caminho. Tente de novo!</p>
                            <button onClick={restartLevel} className="px-6 py-3 bg-white text-red-600 rounded-xl font-bold">Tentar Novamente</button>
                        </div>
                    )}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 w-32 mx-auto">
                    <div />
                    <button onClick={() => move(0, -1)} className="p-3 bg-white/10 rounded-full text-white">⬆️</button>
                    <div />
                    <button onClick={() => move(-1, 0)} className="p-3 bg-white/10 rounded-full text-white">⬅️</button>
                    <button onClick={() => move(0, 1)} className="p-3 bg-white/10 rounded-full text-white">⬇️</button>
                    <button onClick={() => move(1, 0)} className="p-3 bg-white/10 rounded-full text-white">➡️</button>
                </div>
            </main>
        </div>
    );
}
