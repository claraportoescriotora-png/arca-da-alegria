import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useTrialAccess } from '@/hooks/useTrialAccess';
import { TrialBanner } from '@/components/TrialBanner';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
    const { profile, loading, isAdmin, user } = useAuth();
    const { isTrial, isTrialExpired, loading: trialLoading } = useTrialAccess();
    const [hasProducts, setHasProducts] = useState(false);
    const [productsLoading, setProductsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setProductsLoading(false);
            return;
        }

        const checkProducts = async () => {
            const { count } = await supabase
                .from('user_products')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            setHasProducts(!!(count && count > 0));
            setProductsLoading(false);
        };

        checkProducts();
    }, [user]);

    if (loading || trialLoading || productsLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>;
    }

    // 1. Admins → full access everywhere
    if (isAdmin) {
        return <>{children}</>;
    }

    // 2. Blocked users → absolute block (redirect to paywall with info)
    if (profile?.subscription_status === 'blocked') {
        return <Navigate to="/paywall?reason=blocked" replace />;
    }

    // 2. Pending users within trial window → access with trial banner (platform trial)
    // We show the banner even if they have products, so they know platform-wide access is temporary
    if (isTrial && !isTrialExpired) {
        return (
            <div className="flex flex-col min-h-screen">
                <TrialBanner />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        );
    }

    // 3. Active subscribers OR Product owners (Trial expired) → access to the shell
    // If trial is expired, they don't see the banner anymore, but get into the shell
    // ContentAccessGuard inside pages will handle individual piece locking
    if (profile?.subscription_status === 'active' || profile?.subscription_status === 'partner' || hasProducts) {
        return <>{children}</>;
    }

    // 4. Default: No subscription, no products, and expired/no trial → absolute paywall
    return <Navigate to="/paywall" replace />;
};

export default SubscriptionGuard;
