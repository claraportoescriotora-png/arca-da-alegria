import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { SearchBar } from '@/components/SearchBar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { VideoCard } from '@/components/VideoCard';
import { supabase } from '@/lib/supabase';

interface Video {
  id: string;
  title: string;
  thumbnail: string; // Mapped from thumbnail_url
  duration: string;
  category: string;
}

const categories = ['Todos', 'Músicas', 'Histórias', 'Aprendizado'];

export default function Videos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*');

      if (error) throw error;

      const formattedVideos: Video[] = (data || []).map(v => ({
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800',
        duration: v.duration || '0:00',
        category: v.category || 'Músicas',
        videoUrl: v.video_url || '' // Map from DB
      }));

      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || video.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnail={video.thumbnail}
                duration={video.duration}
                category={video.category}
                videoUrl={video.videoUrl}
              />
            ))}
          </div>
        )}

        {!loading && filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum vídeo encontrado</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
