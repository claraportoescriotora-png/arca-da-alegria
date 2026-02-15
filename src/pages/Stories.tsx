import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { SearchBar } from '@/components/SearchBar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { StoryCard } from '@/components/StoryCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

interface Story {
  id: string;
  title: string;
  image: string; // Mapped from cover_url
  category: string;
  duration: string;
  progress?: number;
}

const categories = ['Todas', 'Favoritas', 'Antigo Testamento', 'Parábolas', 'Novo Testamento'];

import { useFavorites } from '@/contexts/FavoritesContext';

export default function Stories() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite } = useFavorites();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, [user]);

  const fetchStories = async () => {
    try {
      setLoading(true);

      // 1. Fetch Stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*');

      if (storiesError) throw storiesError;

      // 2. Fetch Progress (if user is logged in)
      let progressMap: Record<string, number> = {};
      if (user) {
        const { data: progressData } = await supabase
          .from('story_progress')
          .select('story_id, progress')
          .eq('user_id', user.id);

        progressData?.forEach(p => {
          progressMap[p.story_id] = p.progress;
        });
      }

      // 3. Map to Component State
      const formattedStories: Story[] = (storiesData || []).map(s => ({
        id: s.id,
        title: s.title,
        image: s.cover_url || 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=800', // Fallback
        category: s.category || 'Outros',
        duration: s.duration || '5 min',
        progress: progressMap[s.id] || 0
      }));

      setStories(formattedStories);

    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todas'
      ? true
      : activeCategory === 'Favoritas'
        ? isFavorite(story.id)
        : story.category === activeCategory;

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
            <h1 className="font-fredoka text-xl font-bold text-foreground">Histórias Bíblicas</h1>
          </div>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar histórias..."
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
          <div className="grid grid-cols-2 gap-4">
            {filteredStories.map(story => (
              <StoryCard
                key={story.id}
                id={story.id}
                title={story.title}
                image={story.image}
                category={story.category}
                duration={story.duration}
                progress={story.progress}
              />
            ))}
          </div>
        )}

        {!loading && filteredStories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma história encontrada</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
