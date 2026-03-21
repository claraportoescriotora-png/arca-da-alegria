import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { SearchBar } from '@/components/SearchBar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { StoryCard } from '@/components/StoryCard';
import { Pagination } from '@/components/Pagination';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { checkIsItemLocked } from '@/hooks/useProductAccess';

interface Story {
  id: string;
  title: string;
  image: string; // Mapped from cover_url
  category: string;
  duration: string;
  progress?: number;
  unlock_delay_days?: number;
  required_mission_day?: number;
  isLocked?: boolean;
}

const categories = ['Todas', 'Favoritas', 'Antigo Testamento', 'Parábolas', 'Novo Testamento'];

import { useFavorites } from '@/contexts/FavoritesContext';

export default function Stories() {
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const { isFavorite } = useFavorites();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchStories();
  }, [user, currentPage, search, activeCategory]);

  const fetchStories = async () => {
    try {
      setLoading(true);

      // 1. Build Query
      let query = supabase.from('stories').select('*');

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      if (activeCategory !== 'Todas' && activeCategory !== 'Favoritas') {
        query = query.eq('category', activeCategory);
      }

      // Fetch all to allow client-side sorting
      const { data: storiesData, error: storiesError } = await query;

      if (storiesError) throw storiesError;

      let progressMap: Record<string, number> = {};
      if (user && storiesData && storiesData.length > 0) {
        const storyIds = storiesData.map(s => s.id);
        const { data: progressData } = await supabase
          .from('story_progress')
          .select('story_id, progress')
          .eq('user_id', user.id)
          .in('story_id', storyIds);

        progressData?.forEach(p => {
          progressMap[p.story_id] = p.progress;
        });
      }

      // 3. Map to Component State and Evaluate Locks
      const formattedStories: Story[] = await Promise.all((storiesData || []).map(async s => {
        const isLocked = await checkIsItemLocked('story', s.id, user, profile, isAdmin, {
          unlockDelayDays: s.unlock_delay_days,
          requiredMissionDay: s.required_mission_day
        });
        
        return {
          id: s.id,
          title: s.title,
          image: s.cover_url || 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=800',
          category: s.category || 'Outros',
          duration: s.duration || '5 min',
          progress: progressMap[s.id] || 0,
          unlock_delay_days: s.unlock_delay_days || 0,
          required_mission_day: s.required_mission_day || 0,
          isLocked
        };
      }));

      // Sort: unlocked first
      formattedStories.sort((a, b) => (a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1));

      setStories(formattedStories);

    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map categories and filter
  let displayStories = activeCategory === 'Favoritas'
    ? stories.filter(s => isFavorite(s.id))
    : stories;

  // Apply Client-Side Pagination
  const currentTotalItems = displayStories.length;
  // Use sliced displayStories for rendering
  const paginatedStories = displayStories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-card rounded-2xl p-3 border border-border shadow-sm space-y-3">
                <div className="w-full aspect-video bg-muted animate-pulse rounded-xl" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded-md" />
              </div>
            ))
          ) : (
            <>
              {paginatedStories.map(story => (
                <StoryCard
                  key={story.id}
                  id={story.id}
                  title={story.title}
                  image={story.image || "https://minha-zona-amiguito.b-cdn.net/Hist%C3%B3rias/historias%20biblicas.webp"}
                  category={story.category}
                  duration={story.duration}
                  progress={story.progress}
                  unlockDelayDays={story.unlock_delay_days}
                  requiredMissionDay={story.required_mission_day}
                />
              ))}
            </>
          )}
        </div>

        {!loading && (
          <>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(currentTotalItems / ITEMS_PER_PAGE)}
              onPageChange={setCurrentPage}
            />
            {paginatedStories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma história encontrada</p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
