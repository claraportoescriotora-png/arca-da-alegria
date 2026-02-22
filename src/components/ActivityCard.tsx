import { Download, Printer, Lock, Clock, Trophy, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ActivityCardProps {
  id: string;
  title: string;
  image: string;
  type: string;
  unlockDelayDays?: number;
  requiredMissionDay?: number;
}

export function ActivityCard({ id, title, image, type, unlockDelayDays, requiredMissionDay }: ActivityCardProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isDripDialogOpen, setIsDripDialogOpen] = useState(false);

  // Check locking
  const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
    unlockDelayDays,
    requiredMissionDay
  });

  const handleAction = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      setIsDripDialogOpen(true);
    }
  };

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
              onClick={handleAction}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${isLocked ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              Baixar
            </button>
            <button
              onClick={handleAction}
              className={`p-2 rounded-xl transition-colors ${isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Drip Locked Info Modal */}
      <Dialog open={isDripDialogOpen} onOpenChange={setIsDripDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none rounded-3xl overflow-hidden p-0">
          <div className="bg-primary/10 p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <DialogTitle className="font-fredoka text-2xl text-slate-800">Atividade em Breve!</DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              Esta atividade faz parte do nosso conteúdo especial e será liberada em breve!
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
