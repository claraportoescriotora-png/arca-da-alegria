import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, BookmarkX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { StoryCard } from '@/components/StoryCard';
import { VideoCard } from '@/components/VideoCard';
import { useFavorites } from '@/contexts/FavoritesContext';
import { supabase } from '@/lib/supabase';

interface Story {
  id: string;
  title: string;
  image: string;
  category: string;
  duration: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  category: string;
  videoUrl: string;
}

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites } = useFavorites();

  const [favoriteStories, setFavoriteStories] = useState<Story[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (favorites.length > 0) {
      fetchFavoriteContent();
    } else {
      setFavoriteStories([]);
      setFavoriteVideos([]);
    }
  }, [favorites]);

  const fetchFavoriteContent = async () => {
    try {
      setLoading(true);

      // Fetch Stories
      const { data: storiesData } = await supabase
        .from('stories')
        .select('*')
        .in('id', favorites);

      if (storiesData) {
        setFavoriteStories(storiesData.map(s => ({
          id: s.id,
          title: s.title,
          image: s.cover_url || 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=800',
          category: s.category || 'Geral',
          duration: s.duration || '5 min'
        })));
      }

      // Fetch Videos
      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .in('id', favorites);

      if (videosData) {
        setFavoriteVideos(videosData.map(v => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800',
          duration: v.duration || '0:00',
          category: v.category || 'Geral',
          videoUrl: v.video_url || '' // Map from DB
        })));
      }

    } catch (error) {
      console.error('Error fetching favorite content:', error);
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = favoriteStories.length === 0 && favoriteVideos.length === 0;

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
            <h1 className="font-fredoka text-xl font-bold text-foreground">Meus Favoritos</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header Card */}
        <div className="flex items-center gap-4 p-4 bg-danger/10 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-danger flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <p className="font-fredoka font-semibold text-foreground">
              {favorites.length} {favorites.length === 1 ? 'favorito' : 'favoritos'}
            </p>
            <p className="text-sm text-muted-foreground">Seus conteúdos preferidos</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookmarkX className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-fredoka text-lg font-semibold text-foreground mb-2">
              Nenhum favorito ainda
            </h3>
            <p className="text-muted-foreground text-sm max-w-[250px]">
              Toque no coração ❤️ em qualquer história ou vídeo para salvar aqui!
            </p>
            <button
              onClick={() => navigate('/stories')}
              className="mt-6 px-6 py-3 gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Explorar Histórias
            </button>
          </div>
        ) : (
          <>
            {favoriteStories.length > 0 && (
              <section>
                <h2 className="font-fredoka text-lg font-semibold text-foreground mb-4">
                  Histórias Favoritas
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {favoriteStories.map(story => (
                    <StoryCard
                      key={story.id}
                      id={story.id}
                      title={story.title}
                      image={story.image}
                      category={story.category}
                      duration={story.duration}
                    />
                  ))}
                </div>
              </section>
            )}

            {favoriteVideos.length > 0 && (
              <section>
                <h2 className="font-fredoka text-lg font-semibold text-foreground mb-4">
                  Vídeos Favoritos
                </h2>
                <div className="space-y-4">
                  {favoriteVideos.map(video => (
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
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
