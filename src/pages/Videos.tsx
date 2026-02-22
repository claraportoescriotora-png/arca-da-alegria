import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { SearchBar } from '@/components/SearchBar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { VideoCard } from '@/components/VideoCard';
import { Pagination } from '@/components/Pagination';
import { supabase } from '@/lib/supabase';

interface Video {
  id: string;
  title: string;
  thumbnail: string; // Mapped from thumbnail_url
  duration: string;
  category: string;
  videoUrl: string;
  unlock_delay_days: number;
  required_mission_day: number;
}

const categories = ['Todos', 'Músicas', 'Histórias', 'Aprendizado'];

export default function Videos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchVideos();
  }, [currentPage, search, activeCategory]);

  const fetchVideos = async () => {
    try {
      setLoading(true);

      // 1. Build Query
      let query = supabase.from('videos').select('*', { count: 'exact' });

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      if (activeCategory !== 'Todos') {
        query = query.eq('category', activeCategory);
      }

      // Add Range
      query = query.range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      if (count !== null) setTotalItems(count);

      const formattedVideos: Video[] = (data || []).map(v => ({
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800',
        duration: v.duration || '0:00',
        category: v.category || 'Músicas',
        videoUrl: v.video_url || '',
        unlock_delay_days: v.unlock_delay_days || 0,
        required_mission_day: v.required_mission_day || 0
      }));

      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-card hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-fredoka text-xl font-bold text-foreground">Vídeos</h1>
          </div>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar vídeos..."
          />
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm flex flex-col">
                <div className="w-full aspect-video bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-3/4 bg-muted animate-pulse rounded-md" />
                  <div className="h-4 w-1/4 bg-muted animate-pulse rounded-md" />
                </div>
              </div>
            ))
          ) : (
            <>
              {videos.map(video => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  title={video.title}
                  thumbnail={video.thumbnail}
                  duration={video.duration}
                  category={video.category}
                  videoUrl={video.videoUrl}
                  unlockDelayDays={video.unlock_delay_days}
                  requiredMissionDay={video.required_mission_day}
                />
              ))}
            </>
          )}
        </div>

        {!loading && (
          <>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
              onPageChange={setCurrentPage}
            />

            {videos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum vídeo encontrado</p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
