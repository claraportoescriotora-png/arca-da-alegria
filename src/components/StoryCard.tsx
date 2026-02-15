import { Heart } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useNavigate } from 'react-router-dom';

interface StoryCardProps {
  id: string;
  title: string;
  image: string;
  progress?: number;
  duration?: string;
  category?: string;
}

export function StoryCard({ id, title, image, progress, duration, category }: StoryCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const favorite = isFavorite(id);

  return (
    <div 
      className="relative bg-card rounded-2xl overflow-hidden shadow-md card-hover cursor-pointer group"
      onClick={() => navigate(`/story/${id}`)}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(id);
        }}
        className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
          favorite 
            ? 'bg-danger text-danger-foreground' 
            : 'bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-danger'
        }`}
      >
        <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
      </button>
      
      {category && (
        <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
          {category}
        </span>
      )}
      
      <div className="p-4">
        <h3 className="font-fredoka font-semibold text-foreground line-clamp-1">{title}</h3>
        
        {progress !== undefined && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {duration && (
          <p className="mt-2 text-sm text-muted-foreground">{duration}</p>
        )}
      </div>
    </div>
  );
}
