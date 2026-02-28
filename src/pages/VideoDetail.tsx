import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, CheckCircle, Trophy } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useUser } from '@/contexts/UserContext';
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';
import { cn } from '@/lib/utils';
import { VideoCard } from '@/components/VideoCard';
import ReactPlayer from 'react-player';

interface Video {
    id: string;
    title: string;
    thumbnail_url?: string;
    cover_url?: string;
    description: string;
    category?: string;
    duration: string;
    video_url: string;
    season_id?: string;
    unlock_delay_days?: number;
    required_mission_day?: number;
}

export default function VideoDetail() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'video'; // 'video', 'movie', 'episode'

    const navigate = useNavigate();
    const { profile } = useAuth();
    const { toggleFavorite, isFavorite } = useFavorites();
    const { addXp } = useUser();
    const { toast } = useToast();

    const [video, setVideo] = useState<Video | null>(null);
    const [recommendations, setRecommendations] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    const [isDripLocked, setIsDripLocked] = useState(false);
    const [dripDaysRemaining, setDripDaysRemaining] = useState(0);
    const [unlockDelayDays, setUnlockDelayDays] = useState(0);
    const [requiredMissionDay, setRequiredMissionDay] = useState(0);

    useEffect(() => {
        fetchVideoAndRecommendations();
    }, [id, type]);

    useEffect(() => {
        if (!video || !profile) return;

        const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
            unlockDelayDays: video.unlock_delay_days,
            requiredMissionDay: video.required_mission_day
        });

        setIsDripLocked(isLocked);
        setDripDaysRemaining(daysRemaining);
        setUnlockDelayDays(video.unlock_delay_days || 0);
        setRequiredMissionDay(video.required_mission_day || 0);
    }, [video, profile]);

    const fetchVideoAndRecommendations = async () => {
        if (!id) return;
        try {
            setLoading(true);

            let tableName = 'videos';
            if (type === 'movie') tableName = 'movies';
            if (type === 'episode') tableName = 'episodes';

            // Fetch current video
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) setVideo(data);

            // Fetch 4 recommendations
            let recQuery = supabase.from(tableName).select('*').neq('id', id).limit(4);

            if (type === 'episode' && data?.season_id) {
                // For episodes, show other episodes from the same season
                recQuery = recQuery.eq('season_id', data.season_id);
            }

            const { data: recData, error: recError } = await recQuery;

            if (!recError && recData) {
                setRecommendations(recData);
            }

        } catch (error) {
            console.error('Error fetching video:', error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar o conteúdo.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        if (isDripLocked) return;
        addXp(30);
        toast({
            title: "Parabéns! 🌟",
            description: "Você ganhou 30 XP por assistir!",
            className: "bg-green-500 text-white border-none"
        });
    };

    const favorite = video ? isFavorite(video.id) : false;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
            </div>
        );
    }

    if (!video) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
                <p className="text-slate-400 text-lg">Conteúdo não encontrado</p>
                <button onClick={() => navigate('/videos')} className="text-fuchsia-500 font-bold">Voltar para Catálogo</button>
            </div>
        );
    }

    const titlePrefix = type === 'episode' ? '' : ''; // You can add 'Episódio:' if you like
    const displayCategory = video.category || (type === 'movie' ? 'Filme' : type === 'episode' ? 'Série' : 'Vídeo');

    return (
        <div className="min-h-screen bg-slate-900 pb-24 text-slate-100">
            {/* Header (Top Nav) */}
            <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
                <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>

                    <div className="flex gap-2">
                        <button className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-all active:scale-95">
                            <Share2 className="w-5 h-5 text-white" />
                        </button>
                        <button
                            onClick={() => toggleFavorite(video.id, type as any)}
                            className={cn(
                                "p-2 rounded-full transition-all active:scale-95 shadow-sm border",
                                favorite
                                    ? "bg-pink-500 text-white border-pink-500"
                                    : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                            )}
                        >
                            <Heart className={cn("w-5 h-5", favorite && "fill-current")} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container max-w-md mx-auto relative z-10">

                {/* Video Player Area */}
                <div className="w-full bg-black aspect-video relative flex items-center justify-center">
                    {isDripLocked ? (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4 text-center z-10">
                            <p className="font-bold text-lg mb-2">Conteúdo Bloqueado</p>
                            <p className="text-sm text-gray-300">Continue suas missões para desbloquear!</p>
                        </div>
                    ) : (
                        video.video_url && (video.video_url.includes('mediadelivery.net') || video.video_url.includes('b-cdn.net') || video.video_url.includes('bunny.net')) ? (
                            <iframe
                                src={video.video_url}
                                loading="lazy"
                                style={{ border: 'none', position: 'absolute', top: 0, height: '100%', width: '100%' }}
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                allowFullScreen={true}
                            ></iframe>
                        ) : (
                            <ReactPlayer
                                url={video.video_url}
                                width="100%"
                                height="100%"
                                controls={true}
                                playing={false}
                                config={{
                                    youtube: {
                                        playerVars: {
                                            origin: 'https://www.youtube.com'
                                        }
                                    }
                                }}
                                fallback={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500"></div>}
                            />
                        )
                    )}
                </div>

                {/* Video Info Card */}
                <div className="p-5">
                    <div className="mb-4">
                        <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-400 rounded-full mb-3">
                            {displayCategory}
                        </span>
                        <h1 className="font-fredoka text-2xl font-bold text-white mb-2 leading-tight">
                            {titlePrefix} {video.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                            <span>⏱️ {video.duration || '0:00'} de duração</span>
                        </div>
                    </div>

                    <div className="prose prose-sm max-w-none mb-8 bg-slate-800 rounded-2xl p-4 border border-slate-700/50">
                        <p className="text-slate-200 leading-relaxed">
                            {video.description || 'Nenhuma descrição fornecida para este conteúdo.'}
                        </p>
                    </div>

                    {/* XP Action Button */}
                    <button
                        onClick={handleFinish}
                        disabled={isDripLocked}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-all hover:shadow-lg active:scale-95 mb-8",
                            isDripLocked && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <CheckCircle className="w-5 h-5" />
                        Terminei de Assistir! (+30 XP)
                    </button>

                    <hr className="border-slate-800 my-8" />

                    {/* Recommendations Section */}
                    {recommendations.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="font-fredoka text-xl font-bold text-white">
                                    {type === 'episode' ? 'Mais Episódios' : 'Continue Assistindo'}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {recommendations.map(rec => (
                                    <div
                                        key={rec.id}
                                        onClick={() => navigate(`/video/${rec.id}?type=${type}`)}
                                        className="cursor-pointer"
                                    >
                                        <VideoCard
                                            id={rec.id}
                                            title={rec.title}
                                            thumbnail={rec.thumbnail_url || rec.cover_url || ''}
                                            duration={rec.duration}
                                            description={rec.description}
                                            category={rec.category || displayCategory}
                                            unlockDelayDays={rec.unlock_delay_days}
                                            requiredMissionDay={rec.required_mission_day}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <DripLockModal
                isOpen={isDripLocked}
                onOpenChange={(open) => {
                    setIsDripLocked(open);
                    if (!open) navigate(-1);
                }}
                daysRemaining={dripDaysRemaining}
                unlockDelayDays={unlockDelayDays}
                requiredMissionDay={requiredMissionDay}
            />

            <div className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNav />
            </div>

        </div>
    );
}
