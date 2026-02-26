import { Play, Lock, Clock, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  duration: string;
  description: string;
  unlockDelayDays?: number;
  requiredMissionDay?: number;
}

export function VideoCard({
  id,
  title,
  thumbnail,
  category,
  duration,
  description,
  unlockDelayDays,
  requiredMissionDay
}: VideoCardProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isDripDialogOpen, setIsDripDialogOpen] = useState(false);
  const [isImageFinal, setIsImageFinal] = useState(false);

  const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
    unlockDelayDays,
    requiredMissionDay
  });

  const handlePlay = () => {
    if (isLocked) {
      setIsDripDialogOpen(true);
      return;
    }
    navigate(`/video/${id}`);
  };

  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp';
  };

  const imageSrc = thumbnail || 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp';

  return (
    <>
      <div
        className={cn(
          "group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-border/50",
          isLocked && "grayscale"
        )}
        onClick={handlePlay}
      >
        <div className="relative">
          <div className={cn(
            "aspect-video overflow-hidden relative bg-muted",
            !isImageFinal && "animate-pulse"
          )}>
            <img
              src={imageSrc}
              alt={title}
              onLoad={() => setIsImageFinal(true)}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-500 group-hover:scale-105",
                isImageFinal ? 'opacity-100' : 'opacity-0'
              )}
              onError={handleThumbnailError}
            />

            {!isLocked && (
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-6 h-6 fill-current ml-1" />
                </div>
              </div>
            )}

            {isLocked && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
                <Lock className="w-8 h-8 mb-2 opacity-80" />
              </div>
            )}

            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded text-[10px] font-bold text-white flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {duration}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-wider">
              {category}
            </span>
          </div>
          <h3 className="font-fredoka font-bold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
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
