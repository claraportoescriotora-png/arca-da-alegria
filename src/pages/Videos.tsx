import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { SearchBar } from '@/components/SearchBar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { VideoCard } from '@/components/VideoCard';
import { videos } from '@/data/content';

const categories = ['Todos', 'Músicas', 'Histórias', 'Aprendizado'];

export default function Videos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

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

        <div className="grid grid-cols-1 gap-4">
          {filteredVideos.map(video => (
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

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum vídeo encontrado</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
