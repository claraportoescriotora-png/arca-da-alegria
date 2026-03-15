import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { differenceInDays, parseISO } from 'date-fns';

export interface TrialContentItem {
    type: 'video' | 'movie' | 'story' | 'episode' | 'series' | 'game';
    id: string;
}

interface TrialConfig {
    trial_days: number;
}

interface TrialAccess {
    isTrial: boolean;
    trialDaysLeft: number;
    trialDaysTotal: number;
    isTrialExpired: boolean;
    canAccess: () => boolean;
    loading: boolean;
}

let cachedConfig: TrialConfig | null = null;

export function useTrialAccess(): TrialAccess {
    const { profile, isAdmin } = useAuth();
    const [config, setConfig] = useState<TrialConfig | null>(cachedConfig);
    const [loading, setLoading] = useState(!cachedConfig);

    useEffect(() => {
        if (cachedConfig) return;
        const fetchConfig = async () => {
            try {
                const { data } = await supabase
                    .from('trial_config')
                    .select('trial_days, trial_content')
                    .limit(1)
                    .single();
                if (data) {
                    const cfg: TrialConfig = {
                        trial_days: data.trial_days,
                    };
                    cachedConfig = cfg;
                    setConfig(cfg);
                }
            } catch (e) {
                console.error('Error fetching trial config:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // Detect trial state from profile
    const isActiveSubscription = profile?.subscription_status === 'active';
    const isPending = profile?.subscription_status === 'pending';

    // Calculate days since registration
    const daysSinceReg = profile?.created_at
        ? differenceInDays(new Date(), parseISO(profile.created_at))
        : 0;

    const trialDaysTotal = config?.trial_days ?? 7;
    const trialDaysLeft = Math.max(0, trialDaysTotal - daysSinceReg);
    const isTrialExpired = daysSinceReg >= trialDaysTotal;
    const isTrial = isPending && !isActiveSubscription;

    const canAccess = (): boolean => {
        if (isAdmin) return true;
        if (isActiveSubscription) return true;
        if (!isTrial) return false;
        if (isTrialExpired) return false;
        return true;
    };

    return {
        isTrial,
        trialDaysLeft,
        trialDaysTotal,
        isTrialExpired,
        canAccess,
        loading,
    };
}
