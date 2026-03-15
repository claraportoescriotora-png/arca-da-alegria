import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Star, Lock, Calendar, Play, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { format, addDays, isAfter, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isContentLocked } from '@/lib/drip';
import { useProductAccess } from '@/hooks/useProductAccess';
import { DripLockModal } from '@/components/DripLockModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Gift, Target, RotateCcw } from 'lucide-react';

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
    unlock_delay_days: number;
}

export default function MissionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { addXp } = useUser();
    const { toast } = useToast();

    const [pack, setPack] = useState<PackDetails | null>(null);
    const [days, setDays] = useState<MissionDay[]>([]);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const { isProductGated, hasAccess: hasProductAccess, product: gatedProduct } = useProductAccess('mission_pack', id || '');
    const isPremiumLocked = isProductGated && !hasProductAccess;

    const [isDripLocked, setIsDripLocked] = useState(false);
    const [dripDaysRemaining, setDripDaysRemaining] = useState(0);
    const [unlockDelayDays, setUnlockDelayDays] = useState(0);

    const [unlockDelayDaysFetched, setUnlockDelayDaysFetched] = useState<number>(0);
    const [dataLoaded, setDataLoaded] = useState(false);

    // New State for Enrollment & Weeks
    const [enrolledAt, setEnrolledAt] = useState<Date | null>(null);
    const [activeWeek, setActiveWeek] = useState(1);
    const [hasOtherActiveMission, setHasOtherActiveMission] = useState(false);

    // Goal States
    const [goalReward, setGoalReward] = useState<string>('');
    const [goalTargetPercentage, setGoalTargetPercentage] = useState<number>(80);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [savingGoal, setSavingGoal] = useState(false);

    // Progress
    const [totalTasksCount, setTotalTasksCount] = useState(0);
    const [completedTasksCount, setCompletedTasksCount] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const [processingTasks, setProcessingTasks] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    useEffect(() => {
        if (!dataLoaded || profile === null) return;
        const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
            unlockDelayDays: unlockDelayDaysFetched
        });
        if (isLocked) {
            setIsDripLocked(true);
            setDripDaysRemaining(daysRemaining);
            setUnlockDelayDays(unlockDelayDaysFetched);
        }
    }, [dataLoaded, profile]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Pack
            const { data: packData, error: packError } = await supabase
                .from('mission_packs')
                .select('*')
                .eq('id', id)
                .single();

            if (packError) throw packError;
            setPack(packData);

            setUnlockDelayDaysFetched(packData.unlock_delay_days || 0);
            setDataLoaded(true);

            const { data: enrollmentData } = await supabase
                .from('user_mission_enrollments')
                .select('started_at, pack_id, goal_reward, goal_target_percentage')
                .eq('user_id', profile!.id);

            const thisEnrollment = enrollmentData?.find(e => e.pack_id === id);
            const startDate = thisEnrollment ? new Date(thisEnrollment.started_at) : null;
            setEnrolledAt(startDate);
            setGoalReward(thisEnrollment?.goal_reward || '');
            setGoalTargetPercentage(thisEnrollment?.goal_target_percentage || 80);

            // Fetch progress to see if OTHER enrollments are actually "finished"
            const { data: progressData } = await supabase
                .from('user_mission_progress')
                .select('task_id')
                .eq('user_id', profile!.id);
            const completedTaskIds = new Set(progressData?.map(p => p.task_id));

            // Check if there is another uncompleted mission
            let otherActive = false;
            const otherPacks = enrollmentData?.filter(e => e.pack_id !== id) || [];

            if (otherPacks.length > 0) {
                // Here we fetch tasks of the other packs to determine if they are finished.
                const { data: otherMissions } = await supabase
                    .from('missions')
                    .select('id, pack_id, mission_tasks(id)')
                    .in('pack_id', otherPacks.map(p => p.pack_id));

                if (otherMissions) {
                    // Group other missions by pack
                    for (const otherPack of otherPacks) {
                        const packMissions = otherMissions.filter(m => m.pack_id === otherPack.pack_id);
                        let allTasksCompleted = true;

                        for (const m of packMissions) {
                            const tasks = m.mission_tasks || [];
                            if (tasks.some((t: any) => !completedTaskIds.has(t.id))) {
                                allTasksCompleted = false; // found an incomplete task
                                break;
                            }
                        }

                        if (!allTasksCompleted && packMissions.length > 0) {
                            otherActive = true;
                            break;
                        }
                    }
                }
            }
            setHasOtherActiveMission(otherActive);

            // 3. Fetch Days & Tasks for CURRENT Pack
            const { data: missionsData } = await supabase
                .from('missions')
                .select(`
                    id, day_number, title, description,
                    mission_tasks (id, description, xp_reward, order_index)
                `)
                .eq('pack_id', id)
                .order('day_number');

            // 4. Fetch User Progress
            // We already fetched progress, just grab it from above or re-use it.
            // But we can just use `completedTaskIds` we created in step 2.

            // 5. Transform & Calculate Locking
            const now = new Date();
            let sumTotalTasks = 0;
            let sumCompletedTasks = 0;

            const formattedDays: MissionDay[] = (missionsData || []).map(m => {
                let isDayLocked = true;
                let unlockDate = undefined;

                if (startDate) {
                    const dayOffset = m.day_number - 1;
                    const targetDate = addDays(startDate, dayOffset);
                    unlockDate = setHours(setMinutes(targetDate, 0), 4);
                    isDayLocked = isAfter(unlockDate, now);
                } else {
                    isDayLocked = true;
                }

                const dayTasks = (m.mission_tasks || [])
                    .sort((a: any, b: any) => a.order_index - b.order_index)
                    .map((t: any) => {
                        const isCompleted = completedTaskIds.has(t.id);
                        sumTotalTasks++;
                        if (isCompleted) sumCompletedTasks++;

                        return {
                            id: t.id,
                            description: t.description,
                            xp_reward: t.xp_reward,
                            is_completed: isCompleted
                        };
                    });

                return {
                    id: m.id,
                    day_number: m.day_number,
                    title: m.title,
                    description: m.description,
                    is_locked: isDayLocked,
                    unlock_date: unlockDate,
                    tasks: dayTasks
                };
            });

            setDays(formattedDays);
            setTotalTasksCount(sumTotalTasks);
            setCompletedTasksCount(sumCompletedTasks);

            // Auto-expand current day if enrolled
            if (startDate) {
                const firstActive = formattedDays.find(d => !d.is_locked && d.tasks.some(t => !t.is_completed));
                if (firstActive) {
                    setExpandedDay(firstActive.day_number);
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
        if (!profile || !id) return;

        if (isPremiumLocked) {
            if (gatedProduct?.id) {
                navigate('/store', { state: { productId: gatedProduct.id } });
            } else {
                navigate('/store');
            }
            return;
        }

        try {
            const { error } = await supabase
                .from('user_mission_enrollments')
                .insert({ user_id: profile.id, pack_id: id });

            if (error) throw error;

            toast({ title: "Missão Iniciada! 🚀", description: "Boa sorte na sua jornada!" });
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ title: "Erro", description: "Não foi possível iniciar.", variant: "destructive" });
        }
    };

    const handleToggleTask = async (taskId: string, currentStatus: boolean, xp: number) => {
        if (!profile || processingTasks[taskId]) return; // Prevent spam clicks

        try {
            setProcessingTasks(prev => ({ ...prev, [taskId]: true }));

            setDays(prev => prev.map(day => ({
                ...day,
                tasks: day.tasks.map(t =>
                    t.id === taskId ? { ...t, is_completed: !currentStatus } : t
                )
            })));

            if (!currentStatus) {
                const { error } = await supabase.from('user_mission_progress').insert({ user_id: profile.id, task_id: taskId });
                if (error) throw error;
                addXp(xp);
                toast({ className: "bg-green-500 text-white", title: "Tarefa Concluída! 🎉", description: `+${xp} XP` });
            } else {
                const { error } = await supabase.from('user_mission_progress').delete().eq('user_id', profile.id).eq('task_id', taskId);
                if (error) throw error;
            }
        } catch (error) {
            fetchData();
        } finally {
            setProcessingTasks(prev => ({ ...prev, [taskId]: false }));
        }
    };

    const handleSaveGoal = async () => {
        if (!profile || !id) return;
        try {
            setSavingGoal(true);
            const { error } = await supabase
                .from('user_mission_enrollments')
                .update({ goal_reward: goalReward, goal_target_percentage: goalTargetPercentage })
                .eq('pack_id', id)
                .eq('user_id', profile.id);

            if (error) throw error;
            toast({ title: "Meta salva com sucesso! 🎯" });
            setIsGoalModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao salvar meta.", variant: "destructive" });
        } finally {
            setSavingGoal(false);
        }
    };

    const handleResetMission = async () => {
        if (!profile || !id) return;

        const confirmReset = window.confirm("Certeza que deseja CORTAR todo o processo e recomeçar essa missão do zero? Suas tarefas serão apagadas, mas você manterá a recompensa ganha se for o caso.");
        if (!confirmReset) return;

        setIsResetting(true);
        try {
            // Get all task IDs in this pack to delete progress from
            const taskIds = days.flatMap(d => d.tasks.map(t => t.id));

            if (taskIds.length > 0) {
                const { error: progressError } = await supabase
                    .from('user_mission_progress')
                    .delete()
                    .eq('user_id', profile.id)
                    .in('task_id', taskIds);
                if (progressError) throw progressError;
            }

            // Also delete the enrollment itself
            const { error: enrollError } = await supabase
                .from('user_mission_enrollments')
                .delete()
                .eq('user_id', profile.id)
                .eq('pack_id', id);

            if (enrollError) throw enrollError;

            toast({ title: "Missão Reiniciada!", description: "Tudo pronto pra você recomeçar da estaca zero." });

            // Refetch or reload the page context completely
            setEnrolledAt(null);
            setExpandedDay(null);
            fetchData();
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Falha ao reiniciar", description: error.message });
        } finally {
            setIsResetting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;
    if (!pack) return null;

    // Filter days for current week
    const startDay = (activeWeek - 1) * 7 + 1;
    const endDay = activeWeek * 7;
    const weekDays = days.filter(d => d.day_number >= startDay && d.day_number <= endDay);

    const currentPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
    const goalReached = currentPercentage >= goalTargetPercentage;

    return (
        <div className="min-h-screen bg-background pb-8">
            <header className="relative h-64 bg-primary">
                <img src={pack.cover_url} className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-background/20 text-white backdrop-blur"><ArrowLeft /></button>
                <div className="absolute bottom-6 left-6 right-6">
                    <h1 className="text-3xl font-fredoka font-bold text-foreground mb-2">{pack.title}</h1>
                    {!enrolledAt ? (
                        <button
                            onClick={handleStartMission}
                            disabled={(isDripLocked && !isPremiumLocked) || hasOtherActiveMission}
                            className={cn(
                                "text-white px-8 py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg transition w-full md:w-fit mx-auto",
                                isPremiumLocked
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-105"
                                    : (isDripLocked || hasOtherActiveMission)
                                        ? "bg-slate-600 opacity-70 cursor-not-allowed hover:bg-slate-600 hover:scale-100"
                                        : "bg-green-500 hover:bg-green-600 hover:scale-105"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {isPremiumLocked ? (
                                    <>
                                        <Star className="fill-current w-5 h-5 text-white" />
                                        Ver Pacote Premium
                                    </>
                                ) : (
                                    <>
                                        <Play className="fill-current w-5 h-5" />
                                        {isDripLocked ? "Aguardando Liberação" : hasOtherActiveMission ? "Outra Missão em Andamento " : "Iniciar Missão Agora"}
                                    </>
                                )}
                            </span>
                            {hasOtherActiveMission && !isPremiumLocked && (
                                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">(Complete-a primeiro)</span>
                            )}
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-primary bg-primary/10 px-3 py-1 rounded-lg w-fit">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">Em andamento - Dia {Math.min(days.length, Math.ceil((new Date().getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24)) + 1)}</span>
                            </div>

                            <div
                                onClick={() => setIsGoalModalOpen(true)}
                                className={cn(
                                    "p-3 rounded-xl border bg-card/90 backdrop-blur-sm cursor-pointer shadow-sm hover:shadow-md transition-all",
                                    goalReached ? "border-green-500 bg-green-50" : ""
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                                        <Gift className={cn("w-4 h-4", goalReached ? "text-green-500" : "text-amber-500")} />
                                        {goalReward || "Definir Meta / Recompensa"}
                                    </h3>
                                    <span className="text-xs font-bold text-muted-foreground">{currentPercentage}% / {goalTargetPercentage}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-500", goalReached ? "bg-green-500" : "bg-amber-400")}
                                        style={{ width: `${Math.min(100, (currentPercentage / goalTargetPercentage) * 100)}%` }}
                                    />
                                </div>
                                {goalReached && goalReward && (
                                    <p className="text-xs font-bold text-green-600 mt-2 animate-pulse text-center">🎉 Meta Atingida! Parabéns! 🎉</p>
                                )}
                            </div>

                            {currentPercentage === 100 && (
                                <button
                                    onClick={handleResetMission}
                                    disabled={isResetting}
                                    className="mt-2 text-primary font-bold flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-background/90 backdrop-blur shadow-sm hover:scale-105 transition-all text-sm w-fit self-center"
                                >
                                    <RotateCcw className={cn("w-4 h-4", isResetting && "animate-spin")} />
                                    {isResetting ? "Reiniciando..." : "Refazer essa Missão"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <main className="container max-w-md mx-auto px-4 mt-6">
                {days.length > 7 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar mb-4">
                        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, i) => {
                            const week = i + 1;
                            return (
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
                            );
                        })}
                    </div>
                )}

                <div className="space-y-4">
                    {weekDays.map(day => (
                        <div
                            key={day.id}
                            className={cn(
                                "bg-card rounded-2xl border transition-all overflow-hidden",
                                day.is_locked ? "opacity-90" : "",
                                expandedDay === day.day_number ? "ring-1 ring-primary/20 shadow-md" : ""
                            )}
                        >
                            <button
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
                                                if (!day.is_locked && enrolledAt && !isDripLocked) {
                                                    handleToggleTask(task.id, task.is_completed, task.xp_reward);
                                                } else if (isDripLocked) {
                                                    toast({ description: "Conteúdo bloqueado!", variant: "destructive" });
                                                } else if (!enrolledAt) {
                                                    toast({ description: "Inicie a missão para realizar tarefas!", variant: "default" });
                                                } else {
                                                    toast({ description: "Dia bloqueado!", variant: "destructive" });
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                                                (!day.is_locked && enrolledAt && !isDripLocked && !processingTasks[task.id]) ? "cursor-pointer hover:border-primary/50" : "cursor-not-allowed opacity-60",
                                                task.is_completed ? "bg-green-500/10 border-green-500/20" : "bg-background border-border",
                                                processingTasks[task.id] && "animate-pulse"
                                            )}
                                        >
                                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0", task.is_completed ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground")}>
                                                {processingTasks[task.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
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

            {/* Goal Setting Modal */}
            <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-fredoka text-2xl flex items-center gap-2">
                            <Target className="w-6 h-6 text-primary" />
                            Meta da Missão
                        </DialogTitle>
                        <DialogDescription>
                            Defina uma recompensa para incentivar a jornada!
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reward" className="font-bold">Recompensa (O que vai ganhar?)</Label>
                            <Input
                                id="reward"
                                placeholder="Ex: Um passeio no parque, Sorvete..."
                                value={goalReward}
                                onChange={(e) => setGoalReward(e.target.value)}
                                className="h-12 border-primary/20 focus-visible:ring-primary"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="font-bold">Porcentagem Alvo</Label>
                                <span className="font-bold text-primary">{goalTargetPercentage}%</span>
                            </div>
                            <Slider
                                value={[goalTargetPercentage]}
                                onValueChange={(vals) => setGoalTargetPercentage(vals[0] || 80)}
                                max={100}
                                min={10}
                                step={10}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                                Concluir {goalTargetPercentage}% das tarefas ({Math.ceil((totalTasksCount * goalTargetPercentage) / 100)} tarefas) para desbloquear a recompensa.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full font-bold h-12 rounded-xl"
                            onClick={handleSaveGoal}
                            disabled={savingGoal}
                        >
                            {savingGoal ? "Salvando..." : "Salvar Meta"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DripLockModal
                isOpen={isDripLocked}
                onOpenChange={(open) => {
                    setIsDripLocked(open);
                    if (!open) navigate('/missions');
                }}
                daysRemaining={dripDaysRemaining}
                unlockDelayDays={unlockDelayDays}
            />
        </div>
    );
}
