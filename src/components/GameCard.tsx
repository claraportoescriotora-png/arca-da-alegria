import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';
import { Play, Lock } from 'lucide-react';
import { useState } from 'react';

interface GameCardProps {
  id: string;
  title: string;
  image: string;
  difficulty: string;
  duration: string;
  unlockDelayDays?: number;
  requiredMissionDay?: number;
  onClick?: () => void;
}

export function GameCard({ id, title, image, difficulty, duration, unlockDelayDays, requiredMissionDay, onClick }: GameCardProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isDripDialogOpen, setIsDripDialogOpen] = useState(false);

  // Check locking
  const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
    unlockDelayDays,
    requiredMissionDay
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      setIsDripDialogOpen(true);
      return;
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <div
        className={`flex gap-4 p-4 bg-card rounded-2xl shadow-md transition-all duration-300 ${isLocked ? 'grayscale opacity-80 cursor-default' : 'card-hover cursor-pointer'}`}
        onClick={handleClick}
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 shadow-inner relative">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800';
            }}
          />
          {isLocked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white opacity-80" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-fredoka font-semibold text-foreground line-clamp-1">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {difficulty} • {duration}
          </p>
        </div>

        <button
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all ${isLocked ? 'bg-slate-300' : 'gradient-primary hover:shadow-lg'}`}
        >
          {isLocked ? <Lock className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
        </button>
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
