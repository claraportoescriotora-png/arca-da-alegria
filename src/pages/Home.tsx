import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { BottomNav } from '@/components/BottomNav';
import { ProgressCard } from '@/components/ProgressCard';
import { QuickAccessCard } from '@/components/QuickAccessCard';
import { DevotionalCard } from '@/components/DevotionalCard';
import { StoryCard } from '@/components/StoryCard';
import { GameCard } from '@/components/GameCard';
import { NotificationsSheet } from '@/components/NotificationsSheet';
import { UserAvatar } from '@/components/UserAvatar';
import { BookOpen, Gamepad2, Play, FileText, ChevronRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stories, games } from '@/data/content';

import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { name, level, avatarId, notifications } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePlayGame = (title: string) => {
    toast({
      title: "Em breve",
      description: `O jogo "${title}" estará disponível logo!`,
    });
  };

  const unreadNotifications = notifications.some(n => !n.read);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
        {/* Logo Arca da Alegria */}
        <div className="flex justify-center mb-2">
          <img src="/logo/arca-logo-2.png" alt="Arca da Alegria" className="h-16 object-contain" />
        </div>

        {/* Journey Card */}
        <div className="gradient-secondary rounded-3xl p-6 text-white">
          <h2 className="font-fredoka text-xl font-bold mb-2">Sua Jornada de Fé 🏆</h2>
          <p className="text-white/80 text-sm">Continue brilhando!</p>
        </div>

        {/* Progress */}
        <ProgressCard percentage={80} />

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
          
          <div className="grid grid-cols-2 gap-4">
            {stories.slice(0, 2).map(story => (
              <StoryCard
                key={story.id}
                id={story.id}
                title={story.title}
                image={story.image}
                progress={story.progress}
              />
            ))}
          </div>
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
          
          <div className="space-y-3">
            {games.slice(0, 2).map(game => (
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
