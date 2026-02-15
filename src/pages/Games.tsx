import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { GameCard } from '@/components/GameCard';
import { Pagination } from '@/components/Pagination';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { useUser } from '@/contexts/UserContext';

interface Game {
  id: string;
  title: string;
  image: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  duration: string;
  xp: number;
  type: string;
  status: string;
}

export default function Games() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth(); // Get user profile from Auth (Supabase)
  const { addXp, xp, level } = useUser(); // Get addXp, xp, level from UserContext (Gamification)

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  // Pagination
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchGames();
    checkDailyChallenge();
  }, []);

  const checkDailyChallenge = () => {
    const today = new Date().toISOString().split('T')[0];
    const savedData = localStorage.getItem('daily_gaming_challenge');

    if (savedData) {
      const { date, count, completed } = JSON.parse(savedData);
      if (date === today) {
        setDailyProgress(count);
        setChallengeCompleted(completed);
      } else {
        // Reset for new day
        localStorage.setItem('daily_gaming_challenge', JSON.stringify({ date: today, count: 0, completed: false }));
        setDailyProgress(0);
        setChallengeCompleted(false);
      }
    } else {
      localStorage.setItem('daily_gaming_challenge', JSON.stringify({ date: today, count: 0, completed: false }));
    }
  };

  const updateDailyProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    const savedData = localStorage.getItem('daily_gaming_challenge');
    let currentCount = 0;
    let isCompleted = false;

    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.date === today) {
        currentCount = parsed.count;
        isCompleted = parsed.completed;
      }
    }

    if (!isCompleted && currentCount < 3) {
      const newCount = currentCount + 1;
      const newCompleted = newCount >= 3;

      localStorage.setItem('daily_gaming_challenge', JSON.stringify({
        date: today,
        count: newCount,
        completed: newCompleted
      }));

      setDailyProgress(newCount);
      setChallengeCompleted(newCompleted);

      if (newCompleted) {
        addXp(100);
        toast({
          title: "🎉 Desafio Completo!",
          description: "Você ganhou +100 XP por explorar 3 jogos hoje!",
          className: "bg-green-500 text-white border-none"
        });
      }
    }
  };

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const formattedGames: Game[] = (data || []).map(g => ({
        id: g.id,
        title: g.title,
        image: g.image_url || 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
        difficulty: g.difficulty || 'Fácil',
        duration: '5 min',
        xp: g.xp_reward || 50,
        type: g.type || 'external',
        status: g.status || 'available'
      }));

      setGames(formattedGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGame = (game: Game) => {
    // Track participation for daily challenge
    updateDailyProgress();

    if (game.status === 'coming_soon') {
      toast({
        title: "Em breve 🚧",
        description: `O jogo "${game.title}" estará disponível logo!`,
      });
      return;
    }

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
        description: "Este tipo de jogo está sendo integrado.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-card hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-fredoka text-xl font-bold text-foreground">Jogos</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto rounded-full gradient-primary flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            {/* Show Total Games Available */}
            <p className="font-fredoka font-bold text-lg text-foreground">{loading ? '-' : games.length}</p>
            <p className="text-xs text-muted-foreground">Jogos</p>
          </div>

          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto rounded-full gradient-secondary flex items-center justify-center mb-2">
              <Star className="w-5 h-5 text-white" />
            </div>
            {/* Use context XP for real-time updates */}
            <p className="font-fredoka font-bold text-lg text-foreground">{xp}</p>
            <p className="text-xs text-muted-foreground">XP Total</p>
          </div>

          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto rounded-full gradient-accent flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {/* Streak comes from profile or 0 */}
            <p className="font-fredoka font-bold text-lg text-foreground">{profile?.streak || 0}</p>
            <p className="text-xs text-muted-foreground">Dias Seguidos</p>
          </div>
        </div>

        {/* Daily Challenge - Dynamic */}
        <div className="gradient-primary rounded-3xl p-6 text-white relative overflow-hidden">
          {challengeCompleted && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px] z-10">
              <div className="bg-white text-green-600 px-4 py-2 rounded-full font-bold shadow-lg animate-in zoom-in">
                Desafio Completo! ✅
              </div>
            </div>
          )}

          <span className="inline-block px-3 py-1 text-xs font-semibold bg-white/20 rounded-full mb-3">
            ⭐ DESAFIO DO DIA
          </span>
          <h3 className="font-fredoka text-xl font-bold mb-2">Jogue 3 Jogos</h3>
          <p className="text-white/80 text-sm mb-4">Ganhe 100 XP extra ao explorar!</p>

          <div className="h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(250,204,21,0.5)]"
              style={{ width: `${(dailyProgress / 3) * 100}%` }}
            />
          </div>
          <p className="text-xs text-white/90 mt-2 font-medium flex justify-between">
            <span>{Math.min(dailyProgress, 3)} de 3 jogados</span>
            {challengeCompleted && <span>+100 XP</span>}
          </p>
        </div>

        {/* Games List */}
        <section>
          <h2 className="font-fredoka text-lg font-semibold text-foreground mb-4">Todos os Jogos</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {games.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(game => (
                  <GameCard
                    key={game.id}
                    id={game.id}
                    title={game.title}
                    image={game.image}
                    difficulty={game.difficulty}
                    duration={game.duration}
                    onClick={() => handlePlayGame(game)}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(games.length / ITEMS_PER_PAGE)}
                onPageChange={setCurrentPage}
              />
            </>
          )}

          {!loading && games.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum jogo encontrado</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
