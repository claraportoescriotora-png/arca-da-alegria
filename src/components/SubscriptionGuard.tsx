import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useTrialAccess } from '@/hooks/useTrialAccess';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
    const { profile, loading } = useAuth();
    const { isTrial, isTrialExpired, loading: trialLoading } = useTrialAccess();

    if (loading || trialLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>;
    }

    // Active subscribers → full access
    if (profile?.subscription_status === 'active') {
        return <>{children}</>;
    }

    // Pending users within trial window → access with trial restrictions
    if (isTrial && !isTrialExpired) {
        return <>{children}</>;
    }

    // Canceled or expired trial → paywall
    return <Navigate to="/paywall" replace />;
};

export default SubscriptionGuard;
