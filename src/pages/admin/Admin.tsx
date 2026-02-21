import { useState, useEffect } from 'react';
// Force TS Re-check
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminStories } from '@/pages/admin/AdminStories';
import { AdminVideos } from '@/pages/admin/AdminVideos';
import { AdminGames } from '@/pages/admin/AdminGames';
import { AdminMissions } from '@/pages/admin/AdminMissions';
import { AdminDownloads } from '@/pages/admin/AdminDownloads';
import { AdminAgent } from '@/pages/admin/AdminAgent';
import { AdminTestSuite } from '@/pages/admin/AdminTestSuite';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function Admin() {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        checkAdminStatus();
    }, [user]);

    const checkAdminStatus = async () => {
        if (!user) {
            setIsAdmin(false);
            return;
        }

        try {
            const { data, error } = await supabase.rpc('is_admin');

            if (error) throw error;

            if (data) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
                toast({
                    variant: "destructive",
                    title: "Acesso Negado",
                    description: "Você não tem permissão para acessar esta área.",
                });
                navigate('/home');
            }
        } catch (error) {
            console.error('Error checking admin:', error);
            setIsAdmin(false);
            navigate('/home');
        }
    };

    if (isAdmin === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-y-auto max-h-screen">
                <Routes>
                    <Route path="/" element={<Navigate to="stories" replace />} />
                    <Route path="stories" element={<AdminStories />} />
                    <Route path="videos" element={<AdminVideos />} />
                    <Route path="games" element={<AdminGames />} />
                    <Route path="missions" element={<AdminMissions />} />
                    <Route path="downloads" element={<AdminDownloads />} />
                    <Route path="agent" element={<AdminAgent />} />
                    <Route path="test-suite" element={<AdminTestSuite />} />
                </Routes>
            </main>
        </div>
    );
}
