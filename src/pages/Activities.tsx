import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { ActivityCard } from '@/components/ActivityCard';
import { activities } from '@/data/content';

export default function Activities() {
  const navigate = useNavigate();

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
            <h1 className="font-fredoka text-xl font-bold text-foreground">Atividades</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="gradient-success rounded-3xl p-6 text-white">
          <h2 className="font-fredoka text-xl font-bold mb-2">Tarefinhas para Imprimir 🎨</h2>
          <p className="text-white/80 text-sm">Atividades divertidas para colorir, recortar e aprender!</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {activities.map(activity => (
            <ActivityCard
              key={activity.id}
              id={activity.id}
              title={activity.title}
              image={activity.image}
              type={activity.type}
            />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
