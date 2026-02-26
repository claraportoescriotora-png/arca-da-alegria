import { Download, Printer, Lock } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';

interface ActivityCardProps {
  id: string;
  title: string;
  image: string;
  type: string;
  pdfUrl?: string;
  unlockDelayDays?: number;
  requiredMissionDay?: number;
}

export function ActivityCard({ id, title, image, type, pdfUrl, unlockDelayDays, requiredMissionDay }: ActivityCardProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isDripDialogOpen, setIsDripDialogOpen] = useState(false);

  // Check locking
  const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
    unlockDelayDays,
    requiredMissionDay
  });

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl, title]);

  const handlePrint = useCallback(() => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
  }, [pdfUrl]);

  const handleAction = useCallback((e: React.MouseEvent, action: 'download' | 'print') => {
    e.preventDefault();
    e.stopPropagation();

    if (isLocked) {
      setIsDripDialogOpen(true);
      return;
    }

    if (action === 'download') {
      handleDownload();
    } else {
      handlePrint();
    }
  }, [isLocked, handleDownload, handlePrint]);

  return (
    <>
      <div
        className={`bg-card rounded-2xl overflow-hidden shadow-md transition-all duration-300 ${isLocked ? 'grayscale opacity-80' : 'card-hover'}`}
        onClick={() => isLocked && setIsDripDialogOpen(true)}
      >
        <div className="aspect-[4/3] overflow-hidden relative">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
          {isLocked && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
              <Lock className="w-8 h-8 mb-2 opacity-80" />
            </div>
          )}
        </div>

        <div className="p-4">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full mb-2">
            {type}
          </span>
          <h3 className="font-fredoka font-semibold text-foreground line-clamp-1">{title}</h3>

          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => handleAction(e, 'download')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${isLocked ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              Baixar
            </button>
            <button
              onClick={(e) => handleAction(e, 'print')}
              className={`p-2 rounded-xl transition-colors ${isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
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
