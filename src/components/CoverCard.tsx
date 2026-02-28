import { Play, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';
import { cn } from '@/lib/utils';

interface CoverCardProps {
    id: string;
    title: string;
    coverUrl: string;
    type: 'movie' | 'series';
    unlockDelayDays?: number;
    requiredMissionDay?: number;
}

export function CoverCard({
    id,
    title,
    coverUrl,
    type,
    unlockDelayDays,
    requiredMissionDay
}: CoverCardProps) {
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

        if (type === 'movie') {
            navigate(`/video/${id}?type=movie`);
        } else {
            navigate(`/series/${id}`);
        }
    };

    const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.src = 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp';
    };

    const imageSrc = coverUrl || 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp';

    return (
        <>
            <div
                className={cn(
                    "group relative rounded-lg overflow-hidden shrink-0 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 w-[120px] sm:w-[140px]",
                    isLocked && "grayscale"
                )}
                onClick={handlePlay}
            >
                <div className={cn(
                    "aspect-[2/3] overflow-hidden bg-slate-200 relative",
                    !isImageFinal && "animate-pulse"
                )}>
                    <img
                        src={imageSrc}
                        alt={title}
                        onLoad={() => setIsImageFinal(true)}
                        className={cn(
                            "w-full h-full object-cover transition-opacity duration-500",
                            isImageFinal ? 'opacity-100' : 'opacity-0'
                        )}
                        onError={handleThumbnailError}
                    />

                    {!isLocked && (
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-lg">
                                <Play className="w-5 h-5 fill-current ml-1" />
                            </div>
                        </div>
                    )}

                    {isLocked && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
                            <Lock className="w-6 h-6 mb-2 opacity-80" />
                        </div>
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
