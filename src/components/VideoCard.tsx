import { Play, Heart, X } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Lock, Clock, Trophy, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { Button } from '@/components/ui/button';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  category?: string;
  videoUrl?: string;
  unlockDelayDays?: number;
  requiredMissionDay?: number;
}

export function VideoCard({ id, title, thumbnail, duration, category, videoUrl, unlockDelayDays, requiredMissionDay }: VideoCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const favorite = isFavorite(id);
  const [isOpen, setIsOpen] = useState(false);
  const [isDripDialogOpen, setIsDripDialogOpen] = useState(false);

  // Check locking
  const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
    unlockDelayDays,
    requiredMissionDay
  });

  // Robust YouTube ID extraction
  const getYouTubeId = (url: string) => {
    if (!url) return '';
    try {
      // Support for standard, embed, shorts, youtu.be, and playlist links
      const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = (match && match[1].length === 11) ? match[1] : '';
      return id;
    } catch (e) {
      console.error('Error extracting YouTube ID:', e);
      return '';
    }
  };

  const videoId = getYouTubeId(videoUrl || '');

  // Helper to get embed URL from YouTube link
  const getEmbedUrl = (url: string) => {
    const id = getYouTubeId(url);
    if (!id) return '';
    return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`;
  };

  // PRIORITY: Always use YouTube's own thumbnails for videos to keep the app light.
  const [imageSrc, setImageSrc] = useState(videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : (thumbnail || ''));
  const [isImageFinal, setIsImageFinal] = useState(false);

  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (!videoId) return;

    // Progressive fallback: hqdefault -> mqdefault -> sddefault -> default
    if (target.src.includes('hqdefault')) {
      setImageSrc(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
    } else if (target.src.includes('mqdefault')) {
      setImageSrc(`https://img.youtube.com/vi/${videoId}/sddefault.jpg`);
    } else if (target.src.includes('sddefault')) {
      setImageSrc(`https://img.youtube.com/vi/${videoId}/default.jpg`);
    } else {
      if (videoId) {
        setImageSrc("");
      } else {
        setImageSrc('https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp');
      }
    }
  };

  return (
    <>
      <div className="relative group">
        <div
          onClick={() => isLocked ? setIsDripDialogOpen(true) : setIsOpen(true)}
          className={`relative bg-card rounded-2xl overflow-hidden shadow-md transition-all duration-300 cursor-pointer ${isLocked ? 'grayscale opacity-80' : 'card-hover'}`}
        >
          <div className="aspect-video overflow-hidden relative bg-muted animate-pulse">
            <img
              src={imageSrc}
              alt={title}
              onLoad={() => setIsImageFinal(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isImageFinal ? 'opacity-100' : 'opacity-0'}`}
              onError={handleThumbnailError}
            />

            {isLocked ? (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
                <Lock className="w-10 h-10 mb-2 opacity-80" />
                {unlockDelayDays && unlockDelayDays > 0 && (
                  <p className="text-xs font-medium bg-black/60 px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Liberado em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                  </p>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary fill-current" />
                </div>
              </div>
            )}

            <span className="absolute bottom-2 right-2 px-2 py-1 text-xs font-medium bg-black/70 text-white rounded-md">
              {duration}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(id, 'video');
            }}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${favorite
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
      </div>

      {/* Main Video Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl p-0 bg-black border-none overflow-hidden rounded-xl aspect-video">
          <div className="relative w-full h-full">
            <DialogClose className="absolute top-2 right-2 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
              <X className="w-4 h-4" />
            </DialogClose>
            {isOpen && videoUrl && (
              <iframe
                width="100%"
                height="100%"
                src={getEmbedUrl(videoUrl)}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            )}
            {!videoUrl && (
              <div className="flex items-center justify-center h-full text-white">
                <p>Vídeo indisponível</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Drip Locked Info Modal */}
      <Dialog open={isDripDialogOpen} onOpenChange={setIsDripDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none rounded-3xl overflow-hidden p-0">
          <div className="bg-primary/10 p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <DialogTitle className="font-fredoka text-2xl text-slate-800">Conteúdo em Breve!</DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              Estamos preparando o melhor conteúdo para você. Este conteúdo será liberado em breve!
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            {unlockDelayDays && unlockDelayDays > 0 && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl text-blue-700">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm">Tempo de Espera</p>
                  <p className="text-xs opacity-80">Liberado em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}.</p>
                </div>
              </div>
            )}

            {requiredMissionDay && requiredMissionDay > 0 && (
              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl text-orange-700">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm">Requisito de Missão</p>
                  <p className="text-xs opacity-80">Conclua as missões diárias até o Dia {requiredMissionDay}.</p>
                </div>
              </div>
            )}

            <Button
              className="w-full h-12 rounded-full font-bold text-lg"
              onClick={() => {
                setIsDripDialogOpen(false);
                navigate('/missions');
              }}
            >
              Ir para Missões
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
