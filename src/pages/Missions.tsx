import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Trophy, Check, ChevronRight, AlertCircle, Plus, Settings } from 'lucide-react';
import { useMoreh } from '@/hooks/useMoreh';
import { useChildTasks } from '@/hooks/useChildTasks';
import { ProgressCard } from '@/components/ProgressCard';

export default function Missions() {
    const navigate = useNavigate();
    const { children, loading: loadingMoreh } = useMoreh();
    const [activeChildId, setActiveChildId] = useState<string | null>(null);

    // Auto-select first child once children are loaded
    useEffect(() => {
        if (children.length > 0 && !activeChildId) {
            setActiveChildId(children[0].id);
        }
    }, [children]); // intentionally no activeChildId dep to avoid resetting manual selection

    const { tasks, loading: loadingTasks } = useChildTasks(activeChildId);

    const completedCount = tasks.filter(t => t.status !== 'pending' && t.status !== 'failed').length;
    const dailyProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    const isLoading = loadingMoreh || loadingTasks;

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="sticky top-0 z-40 glass border-b border-border">
                <div className="container max-w-md mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="font-fredoka text-xl font-bold text-foreground flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Missões Diárias
                        </h1>
                        {/* Moreh quick-access button */}
                        <button
                            onClick={() => navigate('/moreh')}
                            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                            title="Painel do Moreh (pais)"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
                    <h2 className="font-fredoka text-2xl font-bold mb-2">Sua Jornada 🚀</h2>
                    <p className="text-white/90">Acompanhe e complete as missões preparadas pelo Moreh.</p>
                </div>

                {/* Child Selector — only show if more than 1 child */}
                {!loadingMoreh && children.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {children.map(child => (
                            <button
                                key={child.id}
                                onClick={() => setActiveChildId(child.id)}
                                className={`px-4 py-2 rounded-full font-semibold transition-colors whitespace-nowrap ${
                                    activeChildId === child.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {child.name}
                            </button>
                        ))}
                    </div>
                )}

                <ProgressCard percentage={dailyProgress} />

                <div className="space-y-4">
                    {isLoading ? (
                        // Skeleton loaders
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex gap-4 animate-pulse">
                                <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
                                <div className="flex-1 space-y-2 py-2">
                                    <div className="h-4 w-3/4 bg-muted rounded-md" />
                                    <div className="h-3 w-1/2 bg-muted rounded-md" />
                                </div>
                            </div>
                        ))
                    ) : children.length === 0 ? (
                        // No children registered yet — guide parent to Moreh
                        <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border space-y-4">
                            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                            <div>
                                <h3 className="font-bold text-foreground mb-1">Nenhum filho cadastrado</h3>
                                <p className="text-muted-foreground text-sm px-6">
                                    O pai (Moreh) precisa cadastrar os filhos e criar as primeiras missões.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/moreh')}
                                className="mx-auto flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
                            >
                                <Plus className="w-4 h-4" />
                                Ir para o Painel do Moreh
                            </button>
                        </div>
                    ) : tasks.length === 0 ? (
                        // Children exist but no templates created yet
                        <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border space-y-4">
                            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                            <div>
                                <h3 className="font-bold text-foreground mb-1">Nenhuma Missão para Hoje</h3>
                                <p className="text-muted-foreground text-sm px-6">
                                    O Moreh ainda não preparou missões para hoje. Aproveite os jogos!
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/moreh')}
                                className="mx-auto flex items-center gap-2 px-5 py-3 bg-primary/10 text-primary rounded-2xl font-bold text-sm hover:bg-primary/20 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Criar Missões (Moreh)
                            </button>
                        </div>
                    ) : (
                        tasks.map(task => {
                            const isDone = task.status !== 'pending' && task.status !== 'failed';

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => {
                                        if (!isDone) {
                                            navigate(`/tasks/${task.id}`);
                                        }
                                    }}
                                    className={`group transition-all duration-300 rounded-2xl p-4 border shadow-sm flex items-center justify-between ${
                                        isDone
                                            ? 'border-green-500/50 bg-green-500/5 cursor-default'
                                            : 'border-border bg-card cursor-pointer active:scale-95'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                                            isDone ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
                                        }`}>
                                            {isDone ? <Check className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-lg mb-1 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                {task.template?.title || 'Missão'}
                                            </h3>
                                            {task.template?.is_mandatory && !isDone && (
                                                <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-1 rounded-md">
                                                    Obrigatório
                                                </span>
                                            )}
                                            {isDone && (
                                                <span className="text-xs font-medium text-green-600">
                                                    Missão Concluída! ✓
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {!isDone && (
                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
