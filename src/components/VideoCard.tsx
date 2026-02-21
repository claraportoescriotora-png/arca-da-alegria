import { Play, Heart, X } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  category?: string;
  videoUrl?: string; // New prop
}

export function VideoCard({ id, title, thumbnail, duration, category, videoUrl }: VideoCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const favorite = isFavorite(id);
  const [isOpen, setIsOpen] = useState(false);

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
  // We ignore the 'thumbnail' prop if it's a video and we have a videoId.
  // IMPROVEMENT: If videoId exists, we generate the YouTube URL immediately to avoid flashes.
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
      // Last resort: standard biblically themed fallback
      setImageSrc('https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div
          className="relative bg-card rounded-2xl overflow-hidden shadow-md card-hover cursor-pointer group"
        >
          <div className="aspect-video overflow-hidden relative bg-muted animate-pulse">
            <img
              src={imageSrc}
              alt={title}
              onLoad={() => setIsImageFinal(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isImageFinal ? 'opacity-100' : 'opacity-0'}`}
              onError={handleThumbnailError}
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
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl p-0 bg-black border-none overflow-hidden rounded-xl aspect-video">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Assistir ao vídeo: {title}</DialogDescription>
        </DialogHeader>
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
  );
}
