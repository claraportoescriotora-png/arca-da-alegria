import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { ActivityCard } from '@/components/ActivityCard';
import { supabase } from '@/lib/supabase';

interface Activity {
  id: string;
  title: string;
  image: string;
  type: 'Colorir' | 'Labirinto' | 'Ligue os Pontos' | 'Recortar';
}

export default function Activities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*');

      if (error) throw error;

      const formattedActivities: Activity[] = (data || []).map(a => ({
        id: a.id,
        title: a.title,
        image: a.image_url || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
        type: a.type === 'coloring' ? 'Colorir' :
          a.type === 'cutting' ? 'Recortar' :
            a.type === 'puzzle' ? 'Labirinto' : 'Colorir'
      }));

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {activities.map(activity => (
              <ActivityCard
                key={activity.id}
                id={activity.id}
                title={activity.title}
                image={activity.image}
                type={activity.type as any}
              />
            ))}
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma atividade encontrada</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
