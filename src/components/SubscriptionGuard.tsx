
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
    const { profile, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>;
    }

    // If no profile (error fetching) or pending/canceled status, redirect to Paywall
    console.log('SubscriptionGuard Check:', {
        hasProfile: !!profile,
        status: profile?.subscription_status,
        profileId: profile?.id
    });

    if (!profile || profile.subscription_status !== 'active') {
        return <Navigate to="/paywall" replace />;
    }

    return <>{children}</>;
};

export default SubscriptionGuard;
