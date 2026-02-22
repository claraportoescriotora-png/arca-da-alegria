import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Lock, Clock, Trophy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DripLockModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    daysRemaining: number;
    requiredMissionDay?: number;
    unlockDelayDays?: number;
}

export function DripLockModal({
    isOpen,
    onOpenChange,
    daysRemaining,
    requiredMissionDay,
    unlockDelayDays
}: DripLockModalProps) {
    const navigate = useNavigate();

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white border-none rounded-3xl overflow-hidden p-0">
                <div className="bg-primary/10 p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <DialogTitle className="font-fredoka text-2xl text-slate-800">Conteúdo em Breve!</DialogTitle>
                    <DialogDescription className="text-slate-600 mt-2">
                        Este conteúdo especial será liberado em breve como parte da sua jornada!
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-4">
                    {unlockDelayDays !== undefined && unlockDelayDays > 0 && (
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

                    {requiredMissionDay !== undefined && requiredMissionDay > 0 && (
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
                            onOpenChange(false);
                            navigate('/missions');
                        }}
                    >
                        Ir para Missões
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
