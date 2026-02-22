import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { BottomNav } from '@/components/BottomNav';
import { TROPHY_XP } from '@/lib/xp';
import { isContentLocked } from '@/lib/drip';
import { useAuth } from '@/contexts/AuthProvider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Lock, Clock, Trophy, Calendar, ArrowRight, Star, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Pagination } from '@/components/Pagination';

interface MissionPack {
    id: string;
    title: string;
    description: string;
    cover_url: string;
    total_days: number;
    unlock_delay_days: number;
}

export default function Missions() {
    const navigate = useNavigate();
    const [packs, setPacks] = useState<MissionPack[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const [enrolledPackIds, setEnrolledPackIds] = useState<Set<string>>(new Set());
    const { profile } = useAuth();
    const [isDripDialogOpen, setIsDripDialogOpen] = useState(false);
    const [selectedLockedPack, setSelectedLockedPack] = useState<MissionPack | null>(null);

    useEffect(() => {
        fetchPacksAndEnrollments();
    }, [currentPage]);

    const fetchPacksAndEnrollments = async () => {
        try {
            setLoading(true);
            const { data: packsData, error: packsError, count } = await supabase
                .from('mission_packs')
                .select('*', { count: 'exact' })
                .eq('is_active', true)
                .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

            if (packsError) throw packsError;
            setPacks(packsData || []);
            if (count !== null) setTotalItems(count);

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

                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex gap-4">
                                <div className="w-20 h-20 rounded-xl bg-muted animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-6 w-3/4 bg-muted animate-pulse rounded-md" />
                                    <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
                                    <div className="flex gap-2">
                                        <div className="h-6 w-16 bg-muted animate-pulse rounded-md" />
                                        <div className="h-6 w-16 bg-muted animate-pulse rounded-md" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <>
                            {packs.map(pack => {
                                const isEnrolled = enrolledPackIds.has(pack.id);
                                const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
                                    unlockDelayDays: pack.unlock_delay_days
                                });

                                return (
                                    <div
                                        key={pack.id}
                                        onClick={() => {
                                            if (isLocked) {
                                                setSelectedLockedPack(pack);
                                                setIsDripDialogOpen(true);
                                            } else {
                                                navigate(`/missions/${pack.id}`);
                                            }
                                        }}
                                        className={cn(
                                            "group bg-card transition-all duration-300 rounded-2xl p-4 border shadow-sm cursor-pointer active:scale-95",
                                            isEnrolled ? "border-primary/50 bg-primary/5" : "border-border",
                                            isLocked && "grayscale opacity-80"
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
                                                {isLocked && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <Lock className="w-6 h-6 text-white" />
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
                                                    {isLocked ? (
                                                        <span className="flex items-center gap-1 text-orange-600 bg-orange-500/10 px-2 py-1 rounded-md">
                                                            <Clock className="w-3 h-3" />
                                                            Libera em {daysRemaining}d
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded-md">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            Premium
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="self-center">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    {isLocked ? <Lock className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Drip Locked Info Modal */}
                            <Dialog open={isDripDialogOpen} onOpenChange={setIsDripDialogOpen}>
                                <DialogContent className="sm:max-w-md bg-white border-none rounded-3xl overflow-hidden p-0">
                                    <div className="bg-primary/10 p-8 flex flex-col items-center text-center">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                                            <Lock className="w-10 h-10 text-primary" />
                                        </div>
                                        <DialogTitle className="font-fredoka text-2xl text-slate-800">Caminho Bloqueado!</DialogTitle>
                                        <DialogDescription className="text-slate-600 mt-2">
                                            Esta jornada "{selectedLockedPack?.title}" será liberada em breve para você!
                                        </DialogDescription>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl text-blue-700">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                                <Clock className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">Tempo de Preparação</p>
                                                <p className="text-xs opacity-80">
                                                    O conteúdo está sendo preparado. Continue entrando todos os dias para desbloquear!
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full h-12 rounded-full font-bold text-lg"
                                            onClick={() => setIsDripDialogOpen(false)}
                                        >
                                            Entendi
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

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
                        </>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
