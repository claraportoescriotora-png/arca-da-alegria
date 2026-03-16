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
import { useProductAccess } from '@/hooks/useProductAccess';
import { useTrialAccess } from '@/hooks/useTrialAccess';
import { DripLockModal } from '@/components/DripLockModal';
import { toast } from 'sonner';

interface MissionPack {
    id: string;
    title: string;
    description: string;
    cover_url: string;
    total_days: number;
    unlock_delay_days: number;
}

function MissionItem({
    pack,
    profile,
    isEnrolled,
    hasOtherActiveMission,
}: {
    pack: MissionPack;
    profile: any;
    isEnrolled: boolean;
    hasOtherActiveMission: boolean;
}) {
    const navigate = useNavigate();
    const { isProductGated, hasAccess: hasProductAccess, product } = useProductAccess('mission_pack', pack.id);
    const { isTrial, isTrialExpired } = useTrialAccess();
    const [isDripDialogOpen, setIsDripDialogOpen] = useState(false);

    const isActive = profile?.subscription_status === 'active';
    const canSeeReleaseInfo = isActive || (isTrial && !isTrialExpired);

    const isPremiumLocked = isProductGated && !hasProductAccess;
    const { isLocked: isDripLocked, daysRemaining } = isContentLocked(profile?.created_at, {
        unlockDelayDays: pack.unlock_delay_days
    });

    const isLocked = isDripLocked || isPremiumLocked;

    const handleClick = () => {
        if (isPremiumLocked) {
            if (product?.id) {
                navigate('/store', { state: { productId: product.id } });
            } else {
                navigate('/store');
            }
            return;
        }

        if (isDripLocked) {
            setIsDripDialogOpen(true);
            return;
        }

        navigate(`/missions/${pack.id}`);
    };

    return (
        <>
            <div
                onClick={handleClick}
                className={cn(
                    "group bg-card transition-all duration-300 rounded-2xl p-4 border shadow-sm cursor-pointer active:scale-95",
                    isEnrolled ? "border-primary/50 bg-primary/5" : "border-border",
                    !isPremiumLocked && isLocked && "grayscale opacity-80"
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
                                <div className="bg-white/90 p-2 rounded-full shadow-lg">
                                    {isPremiumLocked ? (
                                        <Lock className="w-5 h-5 text-amber-500" />
                                    ) : (
                                        <Lock className="w-5 h-5 text-slate-700" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground mb-1 truncate">{pack.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {pack.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                            <span className="flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md">
                                <Calendar className="w-3 h-3" />
                                {pack.total_days} Dias
                            </span>
                            {isPremiumLocked && (
                                <span className="flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2 py-1 rounded-md">
                                    <Star className="w-3 h-3 fill-current" />
                                    Premium
                                </span>
                            )}
                            {isDripLocked && (
                                <span className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-md",
                                    canSeeReleaseInfo ? "text-orange-600 bg-orange-500/10" : "text-slate-600 bg-slate-100"
                                )}>
                                    <Clock className="w-3 h-3" />
                                    {canSeeReleaseInfo ? `Libera em ${daysRemaining}d` : "Assinatura Necessária"}
                                </span>
                            )}
                            {hasOtherActiveMission && !isEnrolled && (
                                <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                    Outra Missão em Andamento
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="self-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {isLocked ? (
                                <Lock className={cn("w-4 h-4", isPremiumLocked ? "text-amber-500" : "text-slate-500")} />
                            ) : (
                                <ArrowRight className="w-4 h-4" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <DripLockModal
                isOpen={isDripDialogOpen}
                onOpenChange={setIsDripDialogOpen}
                daysRemaining={daysRemaining}
                unlockDelayDays={pack.unlock_delay_days}
            />
        </>
    );
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
                                const hasOtherActiveMission = enrolledPackIds.size > 0 && !isEnrolled;

                                return (
                                    <MissionItem
                                        key={pack.id}
                                        pack={pack}
                                        profile={profile}
                                        isEnrolled={isEnrolled}
                                        hasOtherActiveMission={hasOtherActiveMission}
                                    />
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
                        </>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
