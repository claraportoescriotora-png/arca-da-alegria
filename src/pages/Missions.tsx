import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { BottomNav } from '@/components/BottomNav';
import { Trophy, Calendar, ArrowRight, Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Pagination } from '@/components/Pagination';

interface MissionPack {
    id: string;
    title: string;
    description: string;
    cover_url: string;
    total_days: number;
}

export default function Missions() {
    const navigate = useNavigate();
    const [packs, setPacks] = useState<MissionPack[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(packs.length / ITEMS_PER_PAGE);
    const currentPacks = packs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const [enrolledPackIds, setEnrolledPackIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchPacksAndEnrollments();
    }, []);

    const fetchPacksAndEnrollments = async () => {
        try {
            setLoading(true);
            const { data: packsData, error: packsError } = await supabase
                .from('mission_packs')
                .select('*')
                .eq('is_active', true);

            if (packsError) throw packsError;
            setPacks(packsData || []);

            const { data: user } = await supabase.auth.getUser();
            if (user.user) {
                const { data: enrollData, error: enrollError } = await supabase
                    .from('user_mission_enrollments')
                    .select('pack_id')
                    .eq('user_id', user.user.id);

                if (enrollError) throw enrollError;
                const enrolledSet = new Set(enrollData?.map(e => e.pack_id));
                setEnrolledPackIds(enrolledSet);
            }


        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="sticky top-0 z-40 glass border-b border-border">
                <div className="container max-w-md mx-auto px-4 py-4">
                    <div className="flex items-center gap-2">
                        <h1 className="font-fredoka text-xl font-bold text-foreground flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Missões
                        </h1>
                    </div>
                </div>
            </header>

            <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
                    <h2 className="font-fredoka text-2xl font-bold mb-2">Sua Jornada 🚀</h2>
                    <p className="text-white/90">Escolha uma missão e comece sua aventura diária!</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {currentPacks.map(pack => {
                            const isEnrolled = enrolledPackIds.has(pack.id);
                            return (
                                <div
                                    key={pack.id}
                                    onClick={() => navigate(`/missions/${pack.id}`)}
                                    className={cn(
                                        "group bg-card hover:bg-muted/50 transition-all duration-300 rounded-2xl p-4 border shadow-sm cursor-pointer active:scale-95",
                                        isEnrolled ? "border-primary/50 bg-primary/5" : "border-border"
                                    )}
                                >
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0 relative">
                                            <img
                                                src={pack.cover_url || 'https://images.unsplash.com/photo-1615714652285-d72b2576dd20?w=200'}
                                                alt={pack.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            {isEnrolled && (
                                                <div className="absolute bottom-0 w-full bg-green-500/90 text-white text-[10px] font-bold text-center py-0.5">
                                                    ATIVO
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-foreground mb-1 truncate">{pack.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                {pack.description}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs font-medium">
                                                <span className="flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md">
                                                    <Calendar className="w-3 h-3" />
                                                    {pack.total_days} Dias
                                                </span>
                                                <span className="flex items-center gap-1 text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded-md">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    Premium
                                                </span>
                                            </div>
                                        </div>
                                        <div className="self-center">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {packs.length === 0 && (
                            <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border">
                                <p className="text-muted-foreground">Nenhuma missão disponível no momento.</p>
                            </div>
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
