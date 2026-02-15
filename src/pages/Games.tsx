import { ArrowLeft, Trophy, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { GameCard } from '@/components/GameCard';
import { games } from '@/data/content';
import { useToast } from "@/components/ui/use-toast";

export default function Games() {
  const navigate = useNavigate();
  const { toast } = useToast();

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
            <p className="font-fredoka font-bold text-lg text-foreground">12</p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </div>
          
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto rounded-full gradient-secondary flex items-center justify-center mb-2">
              <Star className="w-5 h-5 text-white" />
            </div>
            <p className="font-fredoka font-bold text-lg text-foreground">850</p>
            <p className="text-xs text-muted-foreground">XP Total</p>
          </div>
          
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto rounded-full gradient-accent flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <p className="font-fredoka font-bold text-lg text-foreground">5</p>
            <p className="text-xs text-muted-foreground">Dias Seguidos</p>
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="gradient-primary rounded-3xl p-6 text-white">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-white/20 rounded-full mb-3">
            ⭐ DESAFIO DO DIA
          </span>
          <h3 className="font-fredoka text-xl font-bold mb-2">Complete 3 Jogos</h3>
          <p className="text-white/80 text-sm mb-4">Ganhe 100 XP extra!</p>
          
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full w-1/3 transition-all duration-500" />
          </div>
          <p className="text-xs text-white/80 mt-2">1 de 3 completados</p>
        </div>

        {/* Games List */}
        <section>
          <h2 className="font-fredoka text-lg font-semibold text-foreground mb-4">Todos os Jogos</h2>
          
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
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
