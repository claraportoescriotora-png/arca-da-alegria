import { Play, Lock, Clock, Trophy, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

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
    } else {
      navigate(`/game/${id}`);
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

      {/* Drip Locked Info Modal */}
      <Dialog open={isDripDialogOpen} onOpenChange={setIsDripDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none rounded-3xl overflow-hidden p-0">
          <div className="bg-primary/10 p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <DialogTitle className="font-fredoka text-2xl text-slate-800">Jogo em Breve!</DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              Este jogo faz parte do nosso conteúdo especial e será liberado em breve!
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
