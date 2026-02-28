import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Loader2, Layers, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';

interface Series {
    id: string;
    title: string;
    description: string;
    cover_url: string;
    category: string;
}

interface Season {
    id: string;
    season_number: number;
    title: string;
}

interface Episode {
    id: string;
    episode_number: number;
    title: string;
    description: string;
    thumbnail_url: string;
    duration: string;
    unlock_delay_days: number;
    required_mission_day: number;
}

export default function SeriesDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [series, setSeries] = useState<Series | null>(null);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [activeSeasonId, setActiveSeasonId] = useState<string>('');
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);

    const [dripModalState, setDripModalState] = useState<{ isOpen: boolean; daysRemaining: number; unlockDelayDays?: number; requiredMissionDay?: number }>({
        isOpen: false,
        daysRemaining: 0,
    });

    useEffect(() => {
        if (id) {
            fetchSeriesData();
        }
    }, [id]);

    const fetchSeriesData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Series
            const { data: seriesData, error: sError } = await supabase
                .from('series')
                .select('*')
                .eq('id', id)
                .single();

            if (sError) throw sError;
            setSeries(seriesData);

            // 2. Fetch Seasons
            const { data: seasonsData, error: seaError } = await supabase
                .from('seasons')
                .select('*')
                .eq('series_id', id)
                .order('season_number', { ascending: true });

            if (seaError) throw seaError;
            setSeasons(seasonsData || []);

            // 3. Select first season and fetch its episodes
            if (seasonsData && seasonsData.length > 0) {
                const firstSeasonId = seasonsData[0].id;
                setActiveSeasonId(firstSeasonId);
                await fetchEpisodes(firstSeasonId);
            } else {
                setEpisodes([]);
            }

        } catch (error) {
            console.error('Error fetching series data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEpisodes = async (seasonId: string) => {
        try {
            const { data: episodesData, error: epError } = await supabase
                .from('episodes')
                .select('*')
                .eq('season_id', seasonId)
                .eq('is_active', true)
                .order('episode_number', { ascending: true });

            if (epError) throw epError;
            setEpisodes(episodesData || []);
        } catch (error) {
            console.error('Error fetching episodes:', error);
        }
    };

    const handleSeasonChange = (val: string) => {
        setActiveSeasonId(val);
        fetchEpisodes(val);
    };

    const handlePlayEpisode = (episode: Episode) => {
        const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
            unlockDelayDays: episode.unlock_delay_days,
            requiredMissionDay: episode.required_mission_day
        });

        if (isLocked) {
            setDripModalState({
                isOpen: true,
                daysRemaining,
                unlockDelayDays: episode.unlock_delay_days,
                requiredMissionDay: episode.required_mission_day
            });
            return;
        }

        navigate(`/video/${episode.id}?type=episode`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
            </div>
        );
    }

    if (!series) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <p className="text-white mb-4">Série não encontrada.</p>
                <Button onClick={() => navigate('/videos')}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 pb-24">

            {/* Hero Banner (Poster) */}
            <div className="relative h-[40vh] min-h-[300px] w-full bg-black">
                <img
                    src={series.cover_url || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800"}
                    alt={series.title}
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                {/* Top Navbar overlapping banner */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Series Info overlapping banner bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h1 className="text-4xl font-fredoka font-bold text-white mb-2 drop-shadow-md">{series.title}</h1>
                    <p className="text-sm text-slate-300 line-clamp-2 max-w-sm drop-shadow-md">
                        {series.description || "Acompanhe todos os episódios desta série incrível!"}
                    </p>
                </div>
            </div>

            <div className="container max-w-md mx-auto px-4 py-8 space-y-6">

                {/* Season Selector */}
                {seasons.length > 0 && (
                    <div className="flex items-center gap-4 border-b border-slate-700 pb-4">
                        <Select value={activeSeasonId} onValueChange={handleSeasonChange}>
                            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white focus:ring-0 focus:ring-offset-0">
                                <SelectValue placeholder="Selecione a Temporada" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                {seasons.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="focus:bg-slate-700 focus:text-white">
                                        Temporada {s.season_number} {s.title ? `- ${s.title}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Episode List */}
                <div className="space-y-4">
                    {episodes.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Nenhum episódio disponível nesta temporada.</p>
                        </div>
                    ) : (
                        episodes.map(ep => {
                            const { isLocked } = isContentLocked(profile?.created_at, {
                                unlockDelayDays: ep.unlock_delay_days,
                                requiredMissionDay: ep.required_mission_day
                            });

                            return (
                                <div
                                    key={ep.id}
                                    onClick={() => handlePlayEpisode(ep)}
                                    className={`flex gap-4 p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/50 ${isLocked ? 'opacity-70 grayscale' : ''}`}
                                >
                                    <div className="relative w-32 shrink-0 aspect-video rounded-xl overflow-hidden bg-slate-700">
                                        <img
                                            src={ep.thumbnail_url || "https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400"}
                                            alt={ep.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <PlayCircle className="w-8 h-8 text-white/90 drop-shadow-lg" />
                                        </div>
                                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-bold text-white">
                                            {ep.duration || '0:00'}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                                        <h3 className="font-bold text-sm text-slate-100 line-clamp-2 leading-tight">
                                            <span className="text-fuchsia-400 mr-1">{ep.episode_number}.</span>
                                            {ep.title}
                                        </h3>
                                        {ep.description && (
                                            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-tight">
                                                {ep.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>

            <DripLockModal
                isOpen={dripModalState.isOpen}
                onOpenChange={(isOpen) => setDripModalState(prev => ({ ...prev, isOpen }))}
                daysRemaining={dripModalState.daysRemaining}
                unlockDelayDays={dripModalState.unlockDelayDays}
                requiredMissionDay={dripModalState.requiredMissionDay}
            />
        </div>
    );
}
