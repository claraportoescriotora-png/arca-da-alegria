import { Play, Heart, Lock } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';

interface StoryCardProps {
  id: string;
  title: string;
  image: string;
  progress?: number;
  duration?: string;
  category?: string;
  unlockDelayDays?: number;
  requiredMissionDay?: number;
}

export function StoryCard({
  id, title, image, progress, duration, category,
  unlockDelayDays, requiredMissionDay
}: StoryCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { profile } = useAuth();
  const [isDripDialogOpen, setIsDripDialogOpen] = useState(false);
  const navigate = useNavigate();
  const favorite = isFavorite(id);

  const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
    unlockDelayDays,
    requiredMissionDay
  });

  const handleClick = () => {
    if (isLocked) {
      setIsDripDialogOpen(true);
    } else {
      navigate(`/story/${id}`);
    }
  };

  return (
    <>
      <div
        className={`relative bg-card rounded-2xl overflow-hidden shadow-md transition-all duration-300 cursor-pointer group ${isLocked ? 'grayscale opacity-80' : 'card-hover'
          }`}
        onClick={handleClick}
      >
        <div className="aspect-[4/3] overflow-hidden relative">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isLocked ? (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-white/90 p-3 rounded-full shadow-lg">
                <Lock className="w-6 h-6 text-slate-700" />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-5 h-5 text-primary fill-current ml-0.5" />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(id, 'story');
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${favorite
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

      <DripLockModal
        isOpen={isDripDialogOpen}
        onOpenChange={setIsDripDialogOpen}
        daysRemaining={daysRemaining}
        unlockDelayDays={unlockDelayDays}
        requiredMissionDay={requiredMissionDay}
      />
    </>
  );
}
