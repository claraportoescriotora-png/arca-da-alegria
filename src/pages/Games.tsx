import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { GameCard } from '@/components/GameCard';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

interface Game {
  id: string;
  title: string;
  image: string; // Mapped from image_url
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  duration: string;
  xp: number; // Mapped from xp_reward
}

export default function Games() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth(); // Get user profile for XP

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

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
        duration: '5 min', // Not in DB yet? Defaulting.
        xp: g.xp_reward || 50
      }));

      setGames(formattedGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayGame = (title: string) => {
    toast({
      title: "Em breve",
      description: `O jogo "${title}" estará disponível logo!`,
    });
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
            <p className="font-fredoka font-bold text-lg text-foreground">{profile?.level || 1}</p>
            <p className="text-xs text-muted-foreground">Nível</p>
          </div>

          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto rounded-full gradient-secondary flex items-center justify-center mb-2">
              <Star className="w-5 h-5 text-white" />
            </div>
            <p className="font-fredoka font-bold text-lg text-foreground">{profile?.xp || 0}</p>
            <p className="text-xs text-muted-foreground">XP Total</p>
          </div>

          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto rounded-full gradient-accent flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <p className="font-fredoka font-bold text-lg text-foreground">{profile?.streak || 0}</p>
            <p className="text-xs text-muted-foreground">Dias Seguidos</p>
          </div>
        </div>

        {/* Daily Challenge - Static for now, could be dynamic later */}
        <div className="gradient-primary rounded-3xl p-6 text-white">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-white/20 rounded-full mb-3">
            ⭐ DESAFIO DO DIA
          </span>
          <h3 className="font-fredoka text-xl font-bold mb-2">Complete 3 Jogos</h3>
          <p className="text-white/80 text-sm mb-4">Ganhe 100 XP extra!</p>

          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full w-0 transition-all duration-500" />
          </div>
          <p className="text-xs text-white/80 mt-2">0 de 3 completados</p>
        </div>

        {/* Games List */}
        <section>
          <h2 className="font-fredoka text-lg font-semibold text-foreground mb-4">Todos os Jogos</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {games.map(game => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  image={game.image}
                  difficulty={game.difficulty}
                  duration={game.duration}
                  onClick={() => handlePlayGame(game.title)}
                />
              ))}
            </div>
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
