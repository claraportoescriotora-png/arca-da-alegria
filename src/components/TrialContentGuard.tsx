import React from 'react';
import { Lock, ShoppingCart } from 'lucide-react';
import { useTrialAccess } from '@/hooks/useTrialAccess';
import { useAuth } from '@/contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';

interface TrialContentGuardProps {
    contentType: string;
    contentId: string;
    children: React.ReactNode;
    productTitle?: string;
}

export function TrialContentGuard({ contentType, contentId, children, productTitle }: TrialContentGuardProps) {
    const { profile, isAdmin } = useAuth();
    const { isTrial, canAccess, isTrialExpired } = useTrialAccess();
    const navigate = useNavigate();

    // Admins have full access
    if (isAdmin) {
        return <>{children}</>;
    }

    // Active subscribers have full access
    if (profile?.subscription_status === 'active') {
        return <>{children}</>;
    }

    // Trial user: check if this specific content is allowed
    if (isTrial && !isTrialExpired && canAccess(contentType, contentId)) {
        return <>{children}</>;
    }

    // Locked: show upgrade overlay
    return (
        <div className="relative w-full h-full min-h-[200px] flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden">
            {/* Blurred background hint */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />

            {/* Lock overlay */}
            <div className="relative z-10 flex flex-col items-center text-center gap-4 p-6 max-w-xs">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-500/40">
                    <Lock className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg font-fredoka">Conteúdo Exclusivo</h3>
                    {productTitle ? (
                        <p className="text-slate-300 text-sm mt-1">
                            Este conteúdo faz parte do pacote <strong className="text-amber-400">{productTitle}</strong>.
                        </p>
                    ) : (
                        <p className="text-slate-300 text-sm mt-1">
                            {isTrial
                                ? 'Este conteúdo não está disponível no seu plano de teste gratuito.'
                                : 'Esta área é exclusiva para assinantes.'}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                    {productTitle && (
                        <button
                            onClick={() => navigate('/store')}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold transition-all active:scale-95 text-sm"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Ver na Loja
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/paywall')}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all active:scale-95 text-sm"
                    >
                        🌟 Assinar o App Completo
                    </button>
                </div>
            </div>
        </div>
    );
}
