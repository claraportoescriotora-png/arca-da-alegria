/**
 * ContentAccessGuard
 *
 * Unified guard for individual pieces of content. Handles:
 * 1. Product-gated content: shows buy CTA for the specific product
 * 2. Trial-restricted content: shows upgrade to full subscription CTA
 *
 * Priority: product gate > trial gate
 */
import React from 'react';
import { Lock, ShoppingCart, Star } from 'lucide-react';
import { useTrialAccess } from '@/hooks/useTrialAccess';
import { useProductAccess } from '@/hooks/useProductAccess';
import { useAuth } from '@/contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';

interface ContentAccessGuardProps {
    contentType: string;
    contentId: string;
    children: React.ReactNode;
}

export function ContentAccessGuard({ contentType, contentId, children }: ContentAccessGuardProps) {
    const { profile } = useAuth();
    const { isTrial, canAccess, isTrialExpired } = useTrialAccess();
    const { loading: productLoading, isProductGated, hasAccess: hasProductAccess, product } = useProductAccess(contentType, contentId);
    const navigate = useNavigate();

    // While checking product access, show nothing (or let children show loading)
    if (productLoading) return <>{children}</>;

    // 1. PRODUCT GATE — this content belongs to a specific product
    //    Even active subscribers must purchase the product
    if (isProductGated && !hasProductAccess) {
        return (
            <LockedOverlay
                reason="product"
                productTitle={product?.title}
                productPrice={product?.price_label}
                productPaymentUrl={product?.payment_url}
                onGoToStore={() => navigate('/store')}
            />
        );
    }

    // 2. Full active subscribers get everything else
    if (profile?.subscription_status === 'active') {
        return <>{children}</>;
    }

    // 3. TRIAL GATE — non-paying user, check if this content is in their trial
    if (isTrial && !isTrialExpired && canAccess(contentType, contentId)) {
        return <>{children}</>;
    }

    // 4. Expired trial or content not in trial → paywall
    if (isTrial || profile?.subscription_status === 'pending') {
        return (
            <LockedOverlay
                reason="trial"
                onGoToPaywall={() => navigate('/paywall')}
            />
        );
    }

    // 5. Otherwise render normally (fallback)
    return <>{children}</>;
}

// ─── Locked Overlay UI ────────────────────────────────────────────────────────

interface LockedOverlayProps {
    reason: 'product' | 'trial';
    productTitle?: string | null;
    productPrice?: string | null;
    productPaymentUrl?: string | null;
    onGoToStore?: () => void;
    onGoToPaywall?: () => void;
}

function LockedOverlay({ reason, productTitle, productPrice, productPaymentUrl, onGoToStore, onGoToPaywall }: LockedOverlayProps) {
    return (
        <div className="relative w-full min-h-[260px] flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950" />

            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/5 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col items-center text-center gap-4 p-6 max-w-xs">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${reason === 'product'
                        ? 'bg-amber-500/15 border-amber-500/40'
                        : 'bg-blue-500/15 border-blue-500/40'
                    }`}>
                    <Lock className={`w-7 h-7 ${reason === 'product' ? 'text-amber-400' : 'text-blue-400'}`} />
                </div>

                {/* Text */}
                {reason === 'product' ? (
                    <div>
                        <h3 className="text-white font-bold text-lg font-fredoka">Conteúdo Exclusivo</h3>
                        <p className="text-slate-300 text-sm mt-1">
                            Este conteúdo faz parte do pacote{' '}
                            <strong className="text-amber-400">{productTitle ?? 'premium'}</strong>.
                        </p>
                        {productPrice && (
                            <div className="mt-2 inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                <Star className="w-3 h-3 text-amber-400" />
                                <span className="text-amber-300 text-xs font-bold">{productPrice}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <h3 className="text-white font-bold text-lg font-fredoka">Conteúdo não incluído no trial</h3>
                        <p className="text-slate-300 text-sm mt-1">
                            Assine o plano completo para ter acesso a todos os conteúdos da plataforma.
                        </p>
                    </div>
                )}

                {/* CTAs */}
                <div className="flex flex-col gap-2 w-full">
                    {reason === 'product' && productPaymentUrl && (
                        <button
                            onClick={() => { window.open(productPaymentUrl, '_blank'); onGoToStore?.(); }}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold transition-all active:scale-95 text-sm shadow-lg shadow-amber-500/20"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {productPrice ? `Comprar por ${productPrice}` : 'Comprar Pacote'}
                        </button>
                    )}
                    {reason === 'product' && (
                        <button
                            onClick={onGoToStore}
                            className="px-4 py-2 text-amber-400 text-sm hover:text-amber-300 transition-colors"
                        >
                            Ver na Loja →
                        </button>
                    )}
                    {reason === 'trial' && (
                        <button
                            onClick={onGoToPaywall}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all active:scale-95 text-sm"
                        >
                            🌟 Assinar o App Completo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
