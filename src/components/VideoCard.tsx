import { Play, Heart } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  category?: string;
}

export function VideoCard({ id, title, thumbnail, duration, category }: VideoCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const { toast } = useToast();
  const favorite = isFavorite(id);

  const handleClick = () => {
    toast({
      title: "Em breve",
      description: "Logo você poderá assistir a este vídeo!",
    });
    // navigate(`/video/${id}`) // Desativado temporariamente
  };

  return (
    <div 
      className="relative bg-card rounded-2xl overflow-hidden shadow-md card-hover cursor-pointer group"
      onClick={handleClick}
    >
      <div className="aspect-video overflow-hidden relative">
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-primary fill-current" />
          </div>
        </div>
        
        <span className="absolute bottom-2 right-2 px-2 py-1 text-xs font-medium bg-black/70 text-white rounded-md">
          {duration}
        </span>
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
        <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-full">
          {category}
        </span>
      )}
      
      <div className="p-4">
        <h3 className="font-fredoka font-semibold text-foreground line-clamp-2">{title}</h3>
      </div>
    </div>
  );
}
