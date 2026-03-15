import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useTrialAccess } from '@/hooks/useTrialAccess';
import { TrialBanner } from '@/components/TrialBanner';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
    const { profile, loading, isAdmin } = useAuth();
    const { isTrial, isTrialExpired, loading: trialLoading } = useTrialAccess();

    if (loading || trialLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>;
    }

    // Admins → full access everywhere
    if (isAdmin) {
        return <>{children}</>;
    }

    // Active subscribers → full access
    if (profile?.subscription_status === 'active') {
        return <>{children}</>;
    }

    // Pending users within trial window → access with trial restrictions
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

    // Canceled or expired trial → paywall
    return <Navigate to="/paywall" replace />;
};

export default SubscriptionGuard;
