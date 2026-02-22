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
  type: string;
  pdfUrl: string;
  unlock_delay_days: number;
  required_mission_day: number;
}

export default function Activities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
        // Only use placeholder if the URL is strictly missing.
        // Also add a light cache-buster for mobile PWA stability.
        image: a.image_url
          ? (a.image_url.includes('?') ? a.image_url : `${a.image_url}?t=${Date.now()}`)
          : 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp',
        pdfUrl: a.pdf_url,
        type: a.type === 'coloring' ? 'Colorir' :
          a.type === 'cutting' ? 'Recortar' :
            a.type === 'puzzle' ? 'Labirinto' : 'Colorir',
        unlock_delay_days: a.unlock_delay_days || 0,
        required_mission_day: a.required_mission_day || 0
      }));

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url: string, title: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <>
            <div className="grid grid-cols-2 gap-4">
              {activities
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(activity => (
                  <ActivityCard
                    key={activity.id}
                    id={activity.id}
                    title={activity.title}
                    image={activity.image}
                    type={activity.type}
                    unlockDelayDays={activity.unlock_delay_days}
                    requiredMissionDay={activity.required_mission_day}
                  />
                ))}
            </div>

            {/* Pagination Controls */}
            {activities.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-2 py-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-card border border-border font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(activities.length / itemsPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      const totalPages = Math.ceil(activities.length / itemsPerPage);
                      // Show first page, last page, current page, and adjacent pages
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, idx, arr) => (
                      <div key={page} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="text-muted-foreground px-1">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${currentPage === page
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border hover:bg-muted'
                            }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(activities.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(activities.length / itemsPerPage)}
                  className="px-4 py-2 rounded-lg bg-card border border-border font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
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
