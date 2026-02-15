import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { SearchBar } from '@/components/SearchBar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { StoryCard } from '@/components/StoryCard';
import { stories } from '@/data/content';

const categories = ['Todas', 'Favoritas', 'Antigo Testamento', 'Parábolas', 'Novo Testamento'];

export default function Stories() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Todas' || story.category === activeCategory;
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

        {filteredStories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma história encontrada</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
