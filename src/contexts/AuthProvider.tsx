
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface Profile {
    id: string;
    full_name: string | null;
    subscription_status: 'active' | 'pending' | 'canceled';
    permissions: string[];
    xp: number;
    coins: number;
    level: number;
    streak: number;
    avatar_url?: string;
    created_at?: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        // NEW: Listen for Realtime changes on profiles table (e.g. Webhook updates subscription)
        const profileSubscription = supabase
            .channel('public:profiles')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles' },
                (payload) => {
                    if (payload.new.id === session?.user.id) {
                        setProfile(payload.new as Profile);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
            // Wrap removal in try-catch to avoid unhandled errors if connection is already closed
            try {
                supabase.removeChannel(profileSubscription);
            } catch (e) {
                // Ignore cleanup error
            }
        };
    }, [session?.user.id]); // Add dependency to re-subscribe if user changes

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data as Profile);
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) toast.error('Erro ao sair: ' + error.message);
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
