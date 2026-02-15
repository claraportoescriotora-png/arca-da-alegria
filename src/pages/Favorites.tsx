import { ArrowLeft, Heart, BookmarkX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { StoryCard } from '@/components/StoryCard';
import { VideoCard } from '@/components/VideoCard';
import { useFavorites } from '@/contexts/FavoritesContext';
import { stories, videos } from '@/data/content';

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites } = useFavorites();

  const favoriteStories = stories.filter(s => favorites.includes(s.id));
  const favoriteVideos = videos.filter(v => favorites.includes(v.id));

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

        {isEmpty ? (
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
