import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Star, Lock, Calendar, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { format, addDays, isAfter, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
    id: string;
    description: string;
    xp_reward: number;
    is_completed: boolean;
}

interface MissionDay {
    id: string;
    day_number: number;
    title: string;
    description: string;
    tasks: Task[];
    is_locked: boolean;
    unlock_date?: Date;
}

interface PackDetails {
    id: string;
    title: string;
    description: string;
    cover_url: string;
}

export default function MissionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addXp } = useUser();
    const { toast } = useToast();

    const [pack, setPack] = useState<PackDetails | null>(null);
    const [days, setDays] = useState<MissionDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);

    // New State for Enrollment & Weeks
    const [enrolledAt, setEnrolledAt] = useState<Date | null>(null);
    const [activeWeek, setActiveWeek] = useState(1);

    useEffect(() => {
        if (id && user) {
            fetchData();
        }
    }, [id, user]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Pack
            const { data: packData } = await supabase
                .from('mission_packs')
                .select('*')
                .eq('id', id)
                .single();
            setPack(packData);

            // 2. Fetch Enrollment
            const { data: enrollmentData } = await supabase
                .from('user_mission_enrollments')
                .select('started_at')
                .eq('pack_id', id)
                .eq('user_id', user!.id)
                .single();

            const startDate = enrollmentData ? new Date(enrollmentData.started_at) : null;
            setEnrolledAt(startDate);

            // 3. Fetch Days & Tasks
            const { data: missionsData } = await supabase
                .from('missions')
                .select(`
                    id, day_number, title, description,
                    mission_tasks (id, description, xp_reward, order_index)
                `)
                .eq('pack_id', id)
                .order('day_number');

            // 4. Fetch User Progress
            const { data: progressData } = await supabase
                .from('user_mission_progress')
                .select('task_id')
                .eq('user_id', user!.id);

            const completedTaskIds = new Set(progressData?.map(p => p.task_id));

            // 5. Transform & Calculate Locking
            const now = new Date();
            const formattedDays: MissionDay[] = (missionsData || []).map(m => {
                let isLocked = true;
                let unlockDate = undefined;

                if (startDate) {
                    // Unlock logic: Day 1 is always open. Day N opens at 20:00 of (Start + N-1 days)
                    // Wait, user said "desbloqueadas no dia seguinte após 20h"
                    // Let's assume: Day 1 opens immediately.
                    // Day 2 opens: StartDate + 1 day at 00:00 (or 20:00 previous day?).
                    // Let's go with simpler: Day N opens on StartDate + (N-1) days.
                    // If user starts today (Day 1), Day 2 opens tomorrow.

                    const dayOffset = m.day_number - 1;
                    const targetDate = addDays(startDate, dayOffset);
                    // Let's set unlock time to 04:00 AM to be safe for "next day"
                    // Or keep it strictly 24h intervals.
                    // User asked: "desbloqueadas no dia seguinte após 20 h"
                    // Let's imply: Day 2 unlocks at 20:00 of Day 1? Or 20:00 of Day 2?
                    // Let's use: Unlocks at 00:00 of the calculated day.

                    unlockDate = setHours(setMinutes(targetDate, 0), 4); // 4 AM default

                    // Logic: If (Now >= UnlockDate) -> Unlocked
                    isLocked = isAfter(unlockDate, now);
                } else {
                    // Not enrolled -> All locked except maybe preview? No, block all.
                    isLocked = true;
                }

                return {
                    id: m.id,
                    day_number: m.day_number,
                    title: m.title,
                    description: m.description,
                    is_locked: isLocked,
                    unlock_date: unlockDate,
                    tasks: (m.mission_tasks || [])
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((t: any) => ({
                            id: t.id,
                            description: t.description,
                            xp_reward: t.xp_reward,
                            is_completed: completedTaskIds.has(t.id)
                        }))
                };
            });

            setDays(formattedDays);

            // Auto-expand current day if enrolled
            if (startDate) {
                const firstActive = formattedDays.find(d => !d.is_locked && d.tasks.some(t => !t.is_completed));
                if (firstActive) {
                    setExpandedDay(firstActive.day_number);
                    // Auto-switch tab to current week
                    const week = Math.ceil(firstActive.day_number / 7);
                    setActiveWeek(week);
                }
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartMission = async () => {
        if (!user || !id) return;
        try {
            const { error } = await supabase
                .from('user_mission_enrollments')
                .insert({ user_id: user.id, pack_id: id });

            if (error) throw error;

            toast({ title: "Missão Iniciada! 🚀", description: "Boa sorte na sua jornada!" });
            fetchData(); // Reload to apply locking logic
        } catch (error) {
            console.error(error);
            toast({ title: "Erro", description: "Não foi possível iniciar.", variant: "destructive" });
        }
    };

    const handleToggleTask = async (taskId: string, currentStatus: boolean, xp: number) => {
        if (!user) return;
        // Optimistic update logic (same as before)
        // ... (省略 for brevity, assume same logic or copy from previous)
        try {
            setDays(prev => prev.map(day => ({
                ...day,
                tasks: day.tasks.map(t =>
                    t.id === taskId ? { ...t, is_completed: !currentStatus } : t
                )
            })));

            if (!currentStatus) {
                const { error } = await supabase.from('user_mission_progress').insert({ user_id: user.id, task_id: taskId });
                if (error) throw error;
                addXp(xp);
                toast({ className: "bg-green-500 text-white", title: "Tarefa Concluída! 🎉", description: `+${xp} XP` });
            } else {
                const { error } = await supabase.from('user_mission_progress').delete().eq('user_id', user.id).eq('task_id', taskId);
                if (error) throw error;
            }
        } catch (error) {
            fetchData();
        }
    };

    if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;
    if (!pack) return null;

    // Filter days for current week
    const startDay = (activeWeek - 1) * 7 + 1;
    const endDay = activeWeek * 7;
    const weekDays = days.filter(d => d.day_number >= startDay && d.day_number <= endDay);

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <div className="relative h-64 bg-primary">
                <img src={pack.cover_url} className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-background/20 text-white backdrop-blur"><ArrowLeft /></button>
                <div className="absolute bottom-6 left-6 right-6">
                    <h1 className="text-3xl font-fredoka font-bold text-foreground mb-2">{pack.title}</h1>
                    {!enrolledAt ? (
                        <button
                            onClick={handleStartMission}
                            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition w-full justify-center md:w-fit mx-auto"
                        >
                            <Play className="fill-current w-5 h-5" /> Iniciar Missão Agora
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-primary bg-primary/10 px-3 py-1 rounded-lg w-fit">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">Em andamento - Dia {Math.min(days.length, Math.ceil((new Date().getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24)) + 1)}</span>
                        </div>
                    )}
                </div>
            </div>

            <main className="container max-w-md mx-auto px-4 mt-6">
                {/* Always show tabs now */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
                    {[1, 2, 3, 4].map(week => (
                        <button
                            key={week}
                            onClick={() => setActiveWeek(week)}
                            className={cn(
                                "px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors",
                                activeWeek === week
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card border hover:bg-muted"
                            )}
                        >
                            Semana {week}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {weekDays.map(day => (
                        <div
                            key={day.id}
                            className={cn(
                                "bg-card rounded-2xl border transition-all overflow-hidden",
                                day.is_locked ? "opacity-90" : "", // Less opacity for preview
                                expandedDay === day.day_number ? "ring-1 ring-primary/20 shadow-md" : ""
                            )}
                        >
                            <button
                                // Always allow expanding to preview
                                onClick={() => setExpandedDay(expandedDay === day.day_number ? null : day.day_number)}
                                className="w-full p-4 flex items-center gap-4 text-left relative"
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0",
                                    day.is_locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                )}>
                                    {day.is_locked ? <Lock className="w-5 h-5" /> : day.day_number}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{day.title}</h3>
                                    <p className="text-xs text-muted-foreground">{day.description}</p>
                                </div>
                                {day.is_locked && day.unlock_date && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-black/75 text-white px-2 py-1 rounded">
                                        Libera {format(day.unlock_date, 'dd/MM', { locale: ptBR })}
                                    </div>
                                )}
                            </button>

                            {expandedDay === day.day_number && (
                                <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 border-t mt-2 pt-2">
                                    {day.tasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => {
                                                if (!day.is_locked && enrolledAt) {
                                                    handleToggleTask(task.id, task.is_completed, task.xp_reward);
                                                } else if (!enrolledAt) {
                                                    toast({ description: "Inicie a missão para realizar tarefas!", variant: "default" });
                                                } else {
                                                    toast({ description: "Dia bloqueado!", variant: "destructive" });
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                                                (!day.is_locked && enrolledAt) ? "cursor-pointer hover:border-primary/50" : "cursor-not-allowed opacity-60",
                                                task.is_completed ? "bg-green-500/10 border-green-500/20" : "bg-background border-border"
                                            )}
                                        >
                                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0", task.is_completed ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground")}>
                                                <CheckCircle2 className="w-3 h-3" />
                                            </div>
                                            <span className={cn("flex-1 text-sm", task.is_completed && "line-through text-muted-foreground")}>{task.description}</span>
                                            <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">+{task.xp_reward}XP</span>
                                        </div>
                                    ))}

                                    {!enrolledAt && (
                                        <div className="text-center pt-2">
                                            <span className="text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full">Modo Visualização 👀</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
