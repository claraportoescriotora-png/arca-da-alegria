import { useState, useEffect } from 'react';
import { ArrowLeft, PlayCircle, Film, Music, Layers, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { CoverCard } from '@/components/CoverCard';
import { VideoCard } from '@/components/VideoCard';
import { supabase } from '@/lib/supabase';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthProvider';
import { checkIsItemLocked } from '@/hooks/useProductAccess';

interface Series {
  id: string;
  title: string;
  coverUrl: string;
  isLocked?: boolean;
}

interface Movie {
  id: string;
  title: string;
  coverUrl: string;
  unlockDelayDays: number;
  requiredMissionDay: number;
  isLocked?: boolean;
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
  isLocked?: boolean;
}

interface Episode {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  description: string;
  unlockDelayDays: number;
  requiredMissionDay: number;
  isLocked?: boolean;
}

export default function Videos() {
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();

  if (profile?.subscription_status === 'partner') {
    return (
      <div className="min-h-screen bg-slate-900 pb-24 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-fuchsia-500/20 rounded-full flex items-center justify-center mb-6">
          <PlayCircle className="w-10 h-10 text-fuchsia-500" />
        </div>
        <h1 className="font-fredoka text-2xl font-bold mb-4">Área Restrita 🔒</h1>
        <p className="text-slate-400 max-w-xs mx-auto mb-8">
          Seu acesso de cortesia inclui Histórias, Jogos e Missões. A área de Vídeos e Filmes não está disponível nesta modalidade.
        </p>
        <button 
          onClick={() => navigate('/home')}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-8 py-3 rounded-full font-bold transition-all"
        >
          Voltar para o Início
        </button>
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
      </div>
    );
  }
  const { videoBanners } = useConfig();
  const [series, setSeries] = useState<Series[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);

      // Fetch Series with episodes for lock evaluation
      const { data: seriesData } = await supabase
        .from('series')
        .select('*, seasons(episodes(id, unlock_delay_days, required_mission_day))')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (seriesData) {
        const formattedSeries = await Promise.all(seriesData.map(async s => {
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
                  if (!epLocked) {
                    hasUnlockedEpisode = true;
                  }
                }
              }
            }
          }
          
          const isEpisodesLocked = episodeCount > 0 ? !hasUnlockedEpisode : true;
          const isPremiumSeriesLocked = await checkIsItemLocked('series', s.id, user, profile, isAdmin, {});
          
          return {
            id: s.id,
            title: s.title,
            coverUrl: s.cover_url,
            isLocked: isPremiumSeriesLocked || isEpisodesLocked
          };
        }));
        
        formattedSeries.sort((a, b) => (a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1));
        setSeries(formattedSeries);
      }

      // Fetch Movies
      const { data: moviesData } = await supabase
        .from('movies')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (moviesData) {
        const formattedMovies = await Promise.all(moviesData.map(async m => {
          const isLocked = await checkIsItemLocked('movie', m.id, user, profile, isAdmin, {
            unlockDelayDays: m.unlock_delay_days,
            requiredMissionDay: m.required_mission_day
          });
          return {
            id: m.id,
            title: m.title,
            coverUrl: m.cover_url,
            unlockDelayDays: m.unlock_delay_days || 0,
            requiredMissionDay: m.required_mission_day || 0,
            isLocked
          };
        }));
        formattedMovies.sort((a, b) => (a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1));
        setMovies(formattedMovies);
      }

      // Fetch Videos (Older content, like Músicas)
      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10); // Limit to top 10 recent videos

      if (videosData) {
        const formattedVideos = await Promise.all(videosData.map(async v => {
          const isLocked = await checkIsItemLocked('video', v.id, user, profile, isAdmin, {
            unlockDelayDays: v.unlock_delay_days,
            requiredMissionDay: v.required_mission_day
          });
          return {
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800',
            duration: v.duration || '0:00',
            category: v.category || 'Músicas',
            description: '',
            videoUrl: v.video_url || '',
            unlockDelayDays: v.unlock_delay_days || 0,
            requiredMissionDay: v.required_mission_day || 0,
            isLocked
          };
        }));
        formattedVideos.sort((a, b) => (a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1));
        setVideos(formattedVideos);
      }

      // Fetch Episodes
      const { data: episodesData } = await supabase
        .from('episodes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (episodesData) {
        const formattedEpisodes = await Promise.all(episodesData.map(async e => {
          const isLocked = await checkIsItemLocked('episode', e.id, user, profile, isAdmin, {
            unlockDelayDays: e.unlock_delay_days,
            requiredMissionDay: e.required_mission_day
          });
          return {
            id: e.id,
            title: e.title,
            thumbnail: e.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800',
            duration: e.duration || '0:00',
            description: e.description || 'Episódio da série',
            unlockDelayDays: e.unlock_delay_days || 0,
            requiredMissionDay: e.required_mission_day || 0,
            isLocked
          };
        }));
        // Note: Episodes here are for search results. We can sort them generally.
        formattedEpisodes.sort((a, b) => (a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1));
        setEpisodes(formattedEpisodes);
      }

    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSeries = series.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredMovies = movies.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredVideos = videos.filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredEpisodes = searchTerm ? episodes.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase())) : [];

  const hasResults = filteredSeries.length > 0 || filteredMovies.length > 0 || filteredVideos.length > 0 || filteredEpisodes.length > 0;

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
        {/* Search Bar */}
        <div className="px-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar séries, filmes ou clipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Banners Carousel */}
        {!searchTerm && videoBanners && videoBanners.length > 0 && (
          <section className="px-4">
            <div className="flex overflow-x-auto gap-4 snap-x hide-scrollbar rounded-2xl">
              {videoBanners.map((banner, idx) => (
                <div
                  key={banner.id || idx}
                  onClick={() => banner.link_url ? navigate(banner.link_url) : null}
                  className={`snap-center shrink-0 w-[85%] max-w-[320px] aspect-[21/9] rounded-2xl overflow-hidden relative shadow-lg ${banner.link_url ? 'cursor-pointer' : ''}`}
                >
                  <img
                    src={banner.image_url}
                    alt={`Banner ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
                </div>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fuchsia-500"></div>
          </div>
        ) : (
          <>
            {/* Séries Section */}
            {filteredSeries.length > 0 && (
              <section>
                <div className="px-4 flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-fuchsia-400" />
                  <h2 className="font-fredoka text-lg font-bold text-white">Séries de Animação</h2>
                </div>
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x hide-scrollbar">
                  {filteredSeries.map(s => (
                    <div key={s.id} className="snap-start shrink-0">
                      <CoverCard
                        id={s.id}
                        title={s.title}
                        coverUrl={s.coverUrl}
                        type="series"
                        forceLocked={s.isLocked}
                      />
                      <p className="mt-2 text-xs font-medium text-slate-300 truncate w-full max-w-[120px] sm:max-w-[140px]">{s.title}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Episódios Encontrados Section (Só aparece na busca) */}
            {filteredEpisodes.length > 0 && (
              <section>
                <div className="px-4 flex items-center gap-2 mb-3 mt-4">
                  <PlayCircle className="w-5 h-5 text-fuchsia-400" />
                  <h2 className="font-fredoka text-lg font-bold text-white">Episódios Encontrados</h2>
                </div>
                <div className="px-4 grid grid-cols-1 gap-4 pb-4">
                  {filteredEpisodes.map(ep => (
                    <div key={ep.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
                      <VideoCard
                        id={ep.id}
                        title={ep.title}
                        thumbnail={ep.thumbnail}
                        duration={ep.duration}
                        category="Episódio"
                        description={ep.description}
                        type="episode"
                        unlockDelayDays={ep.unlockDelayDays}
                        requiredMissionDay={ep.requiredMissionDay}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Filmes Section */}
            {filteredMovies.length > 0 && (
              <section>
                <div className="px-4 flex items-center gap-2 mb-3">
                  <Film className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-fredoka text-lg font-bold text-white">Filmes e Especiais</h2>
                </div>
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x hide-scrollbar">
                  {filteredMovies.map(m => (
                    <div key={m.id} className="snap-start shrink-0">
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
            {filteredVideos.length > 0 && (
              <section>
                <div className="px-4 flex items-center gap-2 mb-3">
                  <Music className="w-5 h-5 text-pink-400" />
                  <h2 className="font-fredoka text-lg font-bold text-white">Clipes e Músicas</h2>
                </div>
                <div className="px-4 grid grid-cols-1 gap-4">
                  {filteredVideos.map(video => (
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

            {!hasResults && (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg">Nenhum resultado encontrado.</p>
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
