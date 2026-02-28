import { useState, useEffect } from 'react';
import { ArrowLeft, PlayCircle, Film, Music, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { CoverCard } from '@/components/CoverCard';
import { VideoCard } from '@/components/VideoCard';
import { supabase } from '@/lib/supabase';

interface Series {
  id: string;
  title: string;
  coverUrl: string;
}

interface Movie {
  id: string;
  title: string;
  coverUrl: string;
  unlockDelayDays: number;
  requiredMissionDay: number;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  category: string;
  videoUrl: string;
  description: string;
  unlockDelayDays: number;
  requiredMissionDay: number;
}

export default function Videos() {
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);

      // Fetch Series
      const { data: seriesData } = await supabase
        .from('series')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (seriesData) {
        setSeries(seriesData.map(s => ({
          id: s.id,
          title: s.title,
          coverUrl: s.cover_url
        })));
      }

      // Fetch Movies
      const { data: moviesData } = await supabase
        .from('movies')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (moviesData) {
        setMovies(moviesData.map(m => ({
          id: m.id,
          title: m.title,
          coverUrl: m.cover_url,
          unlockDelayDays: m.unlock_delay_days || 0,
          requiredMissionDay: m.required_mission_day || 0
        })));
      }

      // Fetch Videos (Older content, like Músicas)
      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10); // Limit to top 10 recent videos

      if (videosData) {
        setVideos(videosData.map(v => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800',
          duration: v.duration || '0:00',
          category: v.category || 'Músicas',
          description: '',
          videoUrl: v.video_url || '',
          unlockDelayDays: v.unlock_delay_days || 0,
          requiredMissionDay: v.required_mission_day || 0
        })));
      }

    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="font-fredoka text-xl font-bold text-white">Catálogo</h1>
            </div>
            <PlayCircle className="w-8 h-8 text-fuchsia-500" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-md mx-auto py-6 space-y-8 overflow-hidden">

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fuchsia-500"></div>
          </div>
        ) : (
          <>
            {/* Séries Section */}
            {series.length > 0 && (
              <section>
                <div className="px-4 flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-fuchsia-400" />
                  <h2 className="font-fredoka text-lg font-bold text-white">Séries de Animação</h2>
                </div>
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x hide-scrollbar">
                  {series.map(s => (
                    <div key={s.id} className="snap-start">
                      <CoverCard
                        id={s.id}
                        title={s.title}
                        coverUrl={s.coverUrl}
                        type="series"
                      />
                      <p className="mt-2 text-xs font-medium text-slate-300 truncate w-full max-w-[120px] sm:max-w-[140px]">{s.title}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Filmes Section */}
            {movies.length > 0 && (
              <section>
                <div className="px-4 flex items-center gap-2 mb-3">
                  <Film className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-fredoka text-lg font-bold text-white">Filmes e Especiais</h2>
                </div>
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x hide-scrollbar">
                  {movies.map(m => (
                    <div key={m.id} className="snap-start">
                      <CoverCard
                        id={m.id}
                        title={m.title}
                        coverUrl={m.coverUrl}
                        type="movie"
                        unlockDelayDays={m.unlockDelayDays}
                        requiredMissionDay={m.requiredMissionDay}
                      />
                      <p className="mt-2 text-xs font-medium text-slate-300 truncate w-full max-w-[120px] sm:max-w-[140px]">{m.title}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Vídeos Antigos (Músicas etc) */}
            {videos.length > 0 && (
              <section>
                <div className="px-4 flex items-center gap-2 mb-3">
                  <Music className="w-5 h-5 text-pink-400" />
                  <h2 className="font-fredoka text-lg font-bold text-white">Clipes e Músicas</h2>
                </div>
                <div className="px-4 grid grid-cols-1 gap-4">
                  {videos.map(video => (
                    <div key={video.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
                      <VideoCard
                        id={video.id}
                        title={video.title}
                        thumbnail={video.thumbnail}
                        duration={video.duration}
                        category={video.category}
                        description={video.description}
                        unlockDelayDays={video.unlockDelayDays}
                        requiredMissionDay={video.requiredMissionDay}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {series.length === 0 && movies.length === 0 && videos.length === 0 && (
              <div className="text-center py-12 px-4">
                <p className="text-slate-400">Nenhum conteúdo no catálogo ainda.</p>
              </div>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>

    </div>
  );
}
