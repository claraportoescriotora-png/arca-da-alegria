import { useState, useEffect } from 'react';
import { Bell, Moon, Sun, BookOpen, Gamepad2, Play, FileText, ChevronRight, Heart, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthProvider';
import { BottomNav } from '@/components/BottomNav';
import { ProgressCard } from '@/components/ProgressCard';
import { QuickAccessCard } from '@/components/QuickAccessCard';
import { DevotionalCard } from '@/components/DevotionalCard';
import { StoryCard } from '@/components/StoryCard';
import { GameCard } from '@/components/GameCard';
import { CoverCard } from '@/components/CoverCard';
import { NotificationsSheet } from '@/components/NotificationsSheet';
import { UserAvatar } from '@/components/UserAvatar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";
import { requestNotificationPermission, subscribeToPushNotifications } from '@/lib/pushSubscription';
import { checkIsItemLocked } from '@/hooks/useProductAccess';
import { useMoreh } from '@/hooks/useMoreh';
import { useChildTasks } from '@/hooks/useChildTasks';

interface ContentItem {
  id: string;
  title: string;
  image: string;
  type?: string;
  category?: string;
  difficulty?: 'Fácil' | 'Médio' | 'Difícil';
  duration?: string;
  unlock_delay_days?: number;
  required_mission_day?: number;
  isLocked?: boolean;
}

interface CatalogItem {
  id: string;
  title: string;
  coverUrl: string;
  type: 'movie' | 'series';
  isLocked?: boolean;
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { name, level, avatarId, notifications } = useUser();
  const { logoUrl } = useConfig();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [recentStories, setRecentStories] = useState<ContentItem[]>([]);
  const [recentGames, setRecentGames] = useState<ContentItem[]>([]);
  const [featuredCatalog, setFeaturedCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { children } = useMoreh();
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const { tasks, loading: loadingTasks, updateTaskStatus } = useChildTasks(activeChildId);

  // Auto-select first child if none selected
  useEffect(() => {
    if (children.length > 0 && !activeChildId) {
      setActiveChildId(children[0].id);
    }
  }, [children, activeChildId]);

  useEffect(() => {
    fetchHomeContent();
    if (user) {
      // Mission progress calculation from old system removed in favor of daily tasks
      
      // Request Push Notification Permission
      const initPush = async () => {
        if ('Notification' in window && Notification.permission !== 'denied') {
          const granted = await requestNotificationPermission();
          if (granted) {
            await subscribeToPushNotifications(user.id);
          }
        }
      };

      // Delay push request slightly to not block initial render UX
      setTimeout(initPush, 3000);
    }
  }, [user]);

  const calculateDailyProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.status !== 'pending' && t.status !== 'failed');
    return Math.round((completedTasks.length / tasks.length) * 100);
  };

  const dailyProgress = calculateDailyProgress();

  const fetchHomeContent = async () => {
    try {
      setLoading(true);

      const { data: storiesData } = await supabase
        .from('stories')
        .select('*');

      if (storiesData) {
        const parsedStories = await Promise.all(storiesData.map(async s => {
          const isLocked = await checkIsItemLocked('story', s.id, user, profile, isAdmin, {
            unlockDelayDays: s.unlock_delay_days,
            requiredMissionDay: s.required_mission_day
          });
          return {
            id: s.id,
            title: s.title,
            image: s.cover_url || 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=800',
            duration: s.duration || '5 min',
            unlock_delay_days: s.unlock_delay_days || 0,
            required_mission_day: s.required_mission_day || 0,
            isLocked
          };
        }));
        parsedStories.sort((a, b) => (a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1));
        setRecentStories(parsedStories.slice(0, 2));
      }

      const { data: gamesData } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true);

      if (gamesData) {
        const parsedGames = await Promise.all(gamesData.map(async g => {
          const isLocked = await checkIsItemLocked('game', g.id, user, profile, isAdmin, {
            unlockDelayDays: g.unlock_delay_days,
            requiredMissionDay: g.required_mission_day
          });
          return {
            id: g.id,
            title: g.title,
            image: g.image_url || 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
            difficulty: g.difficulty || 'Fácil',
            type: g.type,
            duration: '5 min',
            unlock_delay_days: g.unlock_delay_days || 0,
            required_mission_day: g.required_mission_day || 0,
            isLocked
          };
        }));
        parsedGames.sort((a, b) => (a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1));
        setRecentGames(parsedGames.slice(0, 2));
      }

      // Fetch Catalog (Series and Movies)
      const { data: seriesData } = await supabase.from('series').select('*, seasons(episodes(id, unlock_delay_days, required_mission_day))').eq('is_active', true).order('created_at', { ascending: false });
      const { data: moviesData } = await supabase.from('movies').select('*').eq('is_active', true).order('created_at', { ascending: false });

      const parsedSeries = await Promise.all((seriesData || []).map(async s => {
        let hasUnlockedEpisode = false;
        let episodeCount = 0;
        if (s.seasons) {
            for (const season of s.seasons) {
              if (season.episodes) {
                for (const ep of season.episodes) {
                  episodeCount++;
                  const epLocked = await checkIsItemLocked('episode', ep.id, user, profile, isAdmin, {
                    unlockDelayDays: ep.unlock_delay_days,
                    requiredMissionDay: ep.required_mission_day
                  });
                  if (!epLocked) hasUnlockedEpisode = true;
                }
              }
            }
        }
        const isEpisodesLocked = episodeCount > 0 ? !hasUnlockedEpisode : true;
        const isPremiumSeriesLocked = await checkIsItemLocked('series', s.id, user, profile, isAdmin, {});
        return { id: s.id, title: s.title, coverUrl: s.cover_url, type: 'series' as const, isLocked: isPremiumSeriesLocked || isEpisodesLocked };
      }));
      
      const parsedMovies = await Promise.all((moviesData || []).map(async m => {
          const isLocked = await checkIsItemLocked('movie', m.id, user, profile, isAdmin, {
            unlockDelayDays: m.unlock_delay_days,
            requiredMissionDay: m.required_mission_day
          });
          return { id: m.id, title: m.title, coverUrl: m.cover_url, type: 'movie' as const, isLocked };
      }));

      const combined = [ ...parsedSeries, ...parsedMovies ];
      combined.sort((a, b) => (a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1));
      
      setFeaturedCatalog(combined.slice(0, 2));

    } catch (error) {
      console.error('Error loading home content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGame = (game: ContentItem) => {
    if (game.type === 'puzzle') {
      navigate(`/games/puzzle/${game.id}`);
    } else if (game.type === 'shepherd') {
      navigate(`/games/shepherd/${game.id}`);
    } else if (game.type === 'sky_jump') {
      navigate(`/games/sky-jump/${game.id}`);
    } else if (game.type === 'memory') {
      navigate(`/games/signs/${game.id}`);
    } else if (game.type === 'find_jesus') {
      navigate(`/games/find-jesus/${game.id}`);
    } else if (game.type === 'rhythm') {
      navigate(`/games/rhythm/${game.id}`);
    } else if (game.type === 'charades') {
      navigate(`/games/charades/${game.id}`);
    } else {
      toast({
        title: "Em construção",
        description: "Este jogo está sendo integrado.",
      });
    }
  };

  const unreadNotifications = notifications.some(n => !n.read);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/profile')}
            >
              <UserAvatar avatarId={avatarId} />
              <div>
                <p className="text-sm text-muted-foreground">Olá, {name}!</p>
                <p className="font-fredoka font-semibold text-foreground">Nível {level}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-card hover:bg-muted transition-colors"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              <NotificationsSheet>
                <button className="p-2 rounded-full bg-card hover:bg-muted transition-colors relative">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
                  )}
                </button>
              </NotificationsSheet>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Logo Meu Amiguito */}
        <div className="flex justify-center mb-2 h-16">
          {logoUrl && (
            <img src={logoUrl} alt="Meu Amiguito" className="h-full object-contain animate-in fade-in duration-500" />
          )}
        </div>

        {/* Child Selector & Tasks */}
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

        <div className="gradient-secondary rounded-3xl p-6 text-white relative">
          <h2 className="font-fredoka text-xl font-bold mb-4">Suas Missões de Hoje 🏆</h2>
          
          {loadingTasks ? (
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-white/20 rounded-xl" />
              <div className="h-12 bg-white/20 rounded-xl" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-white/80 text-sm">O Moreh ainda não preparou suas missões hoje. Aproveite os jogos!</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const isDone = task.status !== 'pending' && task.status !== 'failed';
                return (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isDone ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isDone) {
                        navigate(`/tasks/${task.id}`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDone ? 'bg-green-500' : 'bg-white/20'
                      }`}>
                        {isDone ? <Check className="w-5 h-5 text-white" /> : <div className="w-3 h-3 rounded-full bg-white/50" />}
                      </div>
                      <div>
                        <p className={`font-semibold ${isDone ? 'line-through opacity-80' : ''}`}>
                          {task.template?.title || 'Missão Órfã'}
                        </p>
                        {task.template?.is_mandatory && !isDone && (
                          <span className="text-xs bg-red-500/20 text-red-200 px-2 py-0.5 rounded-full">Obrigatório</span>
                        )}
                      </div>
                    </div>
                    {!isDone && <ChevronRight className="w-5 h-5 opacity-50" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Progress */}
        <ProgressCard percentage={dailyProgress} />

        {/* Quick Access */}
        <div className="grid grid-cols-4 gap-3">
          <QuickAccessCard icon={BookOpen} label="Histórias" path="/stories" gradient="primary" />
          <QuickAccessCard icon={Gamepad2} label="Jogos" path="/games" gradient="secondary" />
          <QuickAccessCard icon={Play} label="Vídeos" path="/videos" gradient="accent" />
          <QuickAccessCard icon={FileText} label="Tarefas" path="/activities" gradient="success" />
        </div>

        {/* Favorites Shortcut */}
        <button
          onClick={() => navigate('/favorites')}
          className="w-full flex items-center justify-between p-4 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-danger" />
            </div>
            <span className="font-semibold text-foreground">Meus Favoritos</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Devotional */}
        <DevotionalCard
          title="Pequenas Orações"
          subtitle="Aprenda a conversar com Deus"
        />

        {/* For Today */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-fredoka text-lg font-semibold text-foreground">Para Hoje</h2>
            <button
              onClick={() => navigate('/stories')}
              className="text-sm text-primary font-medium hover:underline"
            >
              Ver tudo
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {recentStories.map(story => (
                <StoryCard
                  key={story.id}
                  id={story.id}
                  title={story.title}
                  image={story.image}
                  progress={undefined}
                  unlockDelayDays={story.unlock_delay_days}
                  requiredMissionDay={story.required_mission_day}
                />
              ))}
            </div>
          )}
        </section>

        {/* Games */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-fredoka text-lg font-semibold text-foreground">Jogos Divertidos</h2>
            <button
              onClick={() => navigate('/games')}
              className="text-sm text-primary font-medium hover:underline"
            >
              Ver tudo
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentGames.map(game => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  image={game.image}
                  difficulty={game.difficulty}
                  duration={game.duration}
                  unlockDelayDays={game.unlock_delay_days}
                  requiredMissionDay={game.required_mission_day}
                  onClick={() => handlePlayGame(game)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Em Destaque (Catalog) */}
        {featuredCatalog.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-fredoka text-lg font-semibold text-foreground">Séries & Filmes</h2>
              <button
                onClick={() => navigate('/videos')}
                className="text-sm text-primary font-medium hover:underline"
              >
                Ver tudo
              </button>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x hide-scrollbar after:content-[''] after:w-1 after:shrink-0">
              {featuredCatalog.map(item => (
                <div key={item.id + item.type} className="snap-start w-[120px] sm:w-[140px] shrink-0">
                  <CoverCard
                    id={item.id}
                    title={item.title}
                    coverUrl={item.coverUrl}
                    type={item.type}
                    forceLocked={item.isLocked}
                  />
                  <p className="mt-2 text-xs font-medium text-muted-foreground truncate w-full">{item.title}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
