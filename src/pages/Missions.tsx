import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Trophy, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { useMoreh } from '@/hooks/useMoreh';
import { useChildTasks } from '@/hooks/useChildTasks';
import { ProgressCard } from '@/components/ProgressCard';

export default function Missions() {
    const navigate = useNavigate();
    const { children } = useMoreh();
    const [activeChildId, setActiveChildId] = useState<string | null>(children[0]?.id || null);

    // Ensure we have an active child selected if available
    if (!activeChildId && children.length > 0) {
        setActiveChildId(children[0].id);
    }

    const { tasks, loading } = useChildTasks(activeChildId);

    const completedTasks = tasks.filter(t => t.status !== 'pending' && t.status !== 'failed').length;
    const dailyProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="sticky top-0 z-40 glass border-b border-border">
                <div className="container max-w-md mx-auto px-4 py-4">
                    <div className="flex items-center gap-2">
                        <h1 className="font-fredoka text-xl font-bold text-foreground flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Missões Diárias
                        </h1>
                    </div>
                </div>
            </header>

            <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
                    <h2 className="font-fredoka text-2xl font-bold mb-2">Sua Jornada 🚀</h2>
                    <p className="text-white/90">Acompanhe e complete as missões preparadas pelo Moreh.</p>
                </div>

                {/* Child Selector */}
                {children.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {children.map(child => (
                    <button
                        key={child.id}
                        onClick={() => setActiveChildId(child.id)}
                        className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                        activeChildId === child.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {child.name}
                    </button>
                    ))}
                </div>
                )}

                <ProgressCard percentage={dailyProgress} />

                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex gap-4 animate-pulse">
                                <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
                                <div className="flex-1 space-y-2 py-2">
                                    <div className="h-4 w-3/4 bg-muted rounded-md" />
                                </div>
                            </div>
                        ))
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border">
                            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="font-bold text-foreground mb-2">Nenhuma Missão</h3>
                            <p className="text-muted-foreground text-sm px-6">O Moreh ainda não preparou missões para você hoje.</p>
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
                                    className={`group transition-all duration-300 rounded-2xl p-4 border shadow-sm cursor-pointer active:scale-95 flex items-center justify-between ${
                                        isDone ? "border-green-500/50 bg-green-500/5" : "border-border bg-card"
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
                                                {task.template.title}
                                            </h3>
                                            {task.template.is_mandatory && !isDone && (
                                                <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-1 rounded-md">
                                                    Obrigatório
                                                </span>
                                            )}
                                            {isDone && (
                                                <span className="text-xs font-medium text-green-600">
                                                    Missão Concluída!
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
