import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GameCardProps {
  id: string;
  title: string;
  image: string;
  difficulty: string;
  duration: string;
  onClick?: () => void;
}

export function GameCard({ id, title, image, difficulty, duration, onClick }: GameCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/game/${id}`);
    }
  };

  return (
    <div 
      className="flex gap-4 p-4 bg-card rounded-2xl shadow-md card-hover cursor-pointer"
      onClick={handleClick}
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-fredoka font-semibold text-foreground line-clamp-1">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {difficulty} • {duration}
        </p>
      </div>
      
      <button className="flex-shrink-0 w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow">
        <Play className="w-5 h-5 fill-current" />
      </button>
    </div>
  );
}
