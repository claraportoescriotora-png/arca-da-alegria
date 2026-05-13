import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Trophy, Settings, Calendar, ChevronRight, Target, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MissionPack {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  total_days: number;
  is_active: boolean;
  user_id: string | null;
  child_id: string | null;
  start_date: string | null;
  unlock_delay_days: number;
  // Computed
  completed_tasks: number;
  total_tasks: number;
  enrolled: boolean;
}

export default function Missions() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [packs, setPacks] = useState<MissionPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchPacks();
  }, [userId]);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      // Fetch packs (RLS handles visibility: admin packs + own packs)
      const { data: packsData, error } = await supabase
        .from('mission_packs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch enrollments for current user
      const { data: enrollments } = await supabase
        .from('user_mission_enrollments')
        .select('pack_id, started_at')
        .eq('user_id', userId!);

      const enrolledPackIds = new Set(enrollments?.map(e => e.pack_id));

      // Fetch user progress (task completions)
      const { data: progress } = await supabase
        .from('user_mission_progress')
        .select('task_id')
        .eq('user_id', userId!);

      const completedTaskIds = new Set(progress?.map(p => p.task_id));

      // For each pack, count tasks
      const packIds = (packsData || []).map(p => p.id);
      const { data: allMissions } = await supabase
        .from('missions')
        .select('id, pack_id, mission_tasks(id)')
        .in('pack_id', packIds);

      const tasksByPack: Record<string, { total: number; completed: number }> = {};
      for (const mission of allMissions || []) {
        const tasks = (mission.mission_tasks as any[]) || [];
        if (!tasksByPack[mission.pack_id]) {
          tasksByPack[mission.pack_id] = { total: 0, completed: 0 };
        }
        tasksByPack[mission.pack_id].total += tasks.length;
        tasksByPack[mission.pack_id].completed += tasks.filter((t: any) => completedTaskIds.has(t.id)).length;
      }

      const enriched: MissionPack[] = (packsData || []).map(p => ({
        ...p,
        enrolled: enrolledPackIds.has(p.id),
        total_tasks: tasksByPack[p.id]?.total ?? 0,
        completed_tasks: tasksByPack[p.id]?.completed ?? 0,
      }));

      setPacks(enriched);
    } catch (err) {
      console.error('Error fetching packs:', err);
    } finally {
      setLoading(false);
    }
  };

  const progressPct = (pack: MissionPack) =>
    pack.total_tasks > 0 ? Math.round((pack.completed_tasks / pack.total_tasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-fredoka text-xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Missões
            </h1>
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

      <main className="container max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Hero banner */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white shadow-lg">
          <h2 className="font-fredoka text-2xl font-bold mb-1">Sua Jornada 🚀</h2>
          <p className="text-white/80 text-sm">Complete missões, ganhe XP e conquiste recompensas.</p>
        </div>

        {loading ? (
          // Skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm animate-pulse">
              <div className="h-40 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))
        ) : packs.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border space-y-4">
            <Target className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
            <div>
              <h3 className="font-bold text-foreground mb-1">Nenhuma Missão Disponível</h3>
              <p className="text-muted-foreground text-sm px-6">
                O Moreh ainda não criou trilhas. Acesse o Painel do Moreh para começar.
              </p>
            </div>
            <button
              onClick={() => navigate('/moreh')}
              className="mx-auto flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Criar Trilha (Moreh)
            </button>
          </div>
        ) : (
          packs.map(pack => {
            const pct = progressPct(pack);
            const isParentPack = pack.user_id !== null;

            return (
              <div
                key={pack.id}
                onClick={() => navigate(`/missions/${pack.id}`)}
                className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform group"
              >
                {/* Cover */}
                <div className="relative h-40 bg-muted overflow-hidden">
                  {pack.cover_url ? (
                    <img src={pack.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={pack.title} />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/20 to-purple-500/20">
                      <Target className="w-16 h-16 text-primary/40" />
                    </div>
                  )}
                  {/* Tags */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {isParentPack && (
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Moreh
                      </span>
                    )}
                    {!isParentPack && (
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Disponível no App
                      </span>
                    )}
                    {pack.enrolled && (
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Em andamento
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-fredoka text-lg font-bold text-foreground mb-1">{pack.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{pack.description}</p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {pack.total_days} dias
                    </span>
                    {pack.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        Início: {format(new Date(pack.start_date + 'T12:00:00'), "dd MMM", { locale: ptBR })}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {pack.enrolled && pack.total_tasks > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{pack.completed_tasks}/{pack.total_tasks} tarefas</span>
                        <span className="font-bold text-primary">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {pack.enrolled ? 'Continuar Missão' : 'Ver Trilha'}
                    </span>
                    <ChevronRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      <BottomNav />
    </div>
  );
}
