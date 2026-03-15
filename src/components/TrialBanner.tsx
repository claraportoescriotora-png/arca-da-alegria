import { Clock, X, ShoppingCart } from 'lucide-react';
import { useTrialAccess } from '@/hooks/useTrialAccess';
import { useAuth } from '@/contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function TrialBanner() {
    const { profile } = useAuth();
    const { isTrial, trialDaysLeft, isTrialExpired } = useTrialAccess();
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(false);

    if (!isTrial || dismissed) return null;

    if (isTrialExpired) {
        return (
            <div className="w-full sticky top-0 z-[100] bg-red-600 text-white flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4 py-2 text-sm shadow-lg text-center">
                <div className="flex items-center gap-2 justify-center">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold">Seu período de teste terminou.</span>
                </div>
                <button
                    onClick={() => navigate('/paywall')}
                    className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-50 transition-colors flex-shrink-0"
                >
                    Assinar agora
                </button>
            </div>
        );
    }

    return (
        <div className="w-full sticky top-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white flex flex-col flex-wrap sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4 py-2 text-sm shadow-lg text-center">
            <div className="flex items-center gap-2 justify-center">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                    <span className="font-bold">{trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}</span> de acesso gratuito restante{trialDaysLeft !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={() => navigate('/paywall')}
                    className="bg-white text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-orange-50 transition-colors flex-shrink-0 flex items-center gap-1 shadow-sm"
                >
                    <ShoppingCart className="w-3 h-3" />
                    Assinar
                </button>
                <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
