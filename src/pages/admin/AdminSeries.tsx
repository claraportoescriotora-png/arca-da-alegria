import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Search, ChevronLeft, Layers, PlaySquare, ArrowLeft, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { DownloadCloud } from "lucide-react";

interface Series {
    id: string;
    title: string;
    description: string;
    cover_url: string;
    category: string;
    is_active: boolean;
}

interface Season {
    id: string;
    series_id: string;
    season_number: number;
    title: string;
}

interface Episode {
    id: string;
    season_id: string;
    episode_number: number;
    title: string;
    description: string;
    thumbnail_url: string;
    video_url: string;
    duration: string;
    is_active: boolean;
    unlock_delay_days: number;
    required_mission_day: number;
}

export function AdminSeries() {
    const { toast } = useToast();

    // States
    const [view, setView] = useState<'seriesList' | 'seriesDetail'>('seriesList');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [series, setSeries] = useState<Series[]>([]);
    const [activeSeries, setActiveSeries] = useState<Series | null>(null);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [episodes, setEpisodes] = useState<Record<string, Episode[]>>({}); // Keyed by season_id

    // Search
    const [searchTerm, setSearchTerm] = useState("");

    // Dialogs
    const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false);
    const [currentSeries, setCurrentSeries] = useState<Partial<Series>>({});

    const [isSeasonDialogOpen, setIsSeasonDialogOpen] = useState(false);
    const [currentSeason, setCurrentSeason] = useState<Partial<Season>>({});

    const [isEpisodeDialogOpen, setIsEpisodeDialogOpen] = useState(false);
    const [currentEpisode, setCurrentEpisode] = useState<Partial<Episode>>({});
    const [activeSeasonIdForEpisode, setActiveSeasonIdForEpisode] = useState<string | null>(null);

    // Import Bunny
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importCollectionId, setImportCollectionId] = useState("");
    const [importing, setImporting] = useState(false);

    // Configurações Locais Bunny
    const [bunnyApiKey, setBunnyApiKey] = useState(localStorage.getItem('bunny_api_key') || '');
    const [bunnyLibraryId, setBunnyLibraryId] = useState(localStorage.getItem('bunny_library_id') || '');
    const [bunnyCdnHostname, setBunnyCdnHostname] = useState(localStorage.getItem('bunny_cdn_hostname') || '');

    // Salva configurações locais automaticamente sempre que mudarem
    useEffect(() => {
        localStorage.setItem('bunny_api_key', bunnyApiKey);
        localStorage.setItem('bunny_library_id', bunnyLibraryId);
        localStorage.setItem('bunny_cdn_hostname', bunnyCdnHostname);
    }, [bunnyApiKey, bunnyLibraryId, bunnyCdnHostname]);

    useEffect(() => {
        if (view === 'seriesList') {
            fetchSeries();
        } else if (view === 'seriesDetail' && activeSeries) {
            fetchSeasonsAndEpisodes(activeSeries.id);
        }
    }, [view, activeSeries]);

    // ===== SERIES LOGIC =====
    const fetchSeries = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('series').select('*').order('created_at', { ascending: false });
        if (error) toast({ variant: "destructive", title: "Erro ao carregar séries" });
        else setSeries(data || []);
        setLoading(false);
    };

    const handleSaveSeries = async () => {
        if (!currentSeries.title) return toast({ variant: "destructive", title: "Título obrigatório" });
        setSubmitting(true);
        try {
            const seriesData = {
                title: currentSeries.title,
                description: currentSeries.description,
                cover_url: currentSeries.cover_url,
                category: currentSeries.category || 'Série',
                is_active: currentSeries.is_active !== undefined ? currentSeries.is_active : true,
            };

            if (currentSeries.id) {
                await supabase.from('series').update(seriesData).eq('id', currentSeries.id).throwOnError();
                toast({ title: "Série atualizada!" });
            } else {
                await supabase.from('series').insert([seriesData]).throwOnError();
                toast({ title: "Série criada!" });
            }
            setIsSeriesDialogOpen(false);
            fetchSeries();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao salvar série", description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSeries = async (id: string) => {
        if (!confirm("Tem certeza? Isso excluirá todas as temporadas e episódios desta série.")) return;
        try {
            await supabase.from('series').delete().eq('id', id).throwOnError();
            toast({ title: "Série excluída!" });
            fetchSeries();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
        }
    };

    // ===== SEASONS & EPISODES LOGIC =====
    const fetchSeasonsAndEpisodes = async (seriesId: string) => {
        setLoading(true);
        try {
            const { data: seasonsData, error: sError } = await supabase.from('seasons').select('*').eq('series_id', seriesId).order('season_number');
            if (sError) throw sError;
            setSeasons(seasonsData || []);

            if (seasonsData && seasonsData.length > 0) {
                const seasonIds = seasonsData.map(s => s.id);
                const { data: episodesData, error: eError } = await supabase.from('episodes').select('*').in('season_id', seasonIds).order('episode_number');
                if (eError) throw eError;

                const epMap: Record<string, Episode[]> = {};
                seasonsData.forEach(s => epMap[s.id] = []);
                (episodesData || []).forEach(ep => {
                    if (!epMap[ep.season_id]) epMap[ep.season_id] = [];
                    epMap[ep.season_id].push(ep);
                });
                setEpisodes(epMap);
            } else {
                setEpisodes({});
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao carregar temporadas", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSeason = async () => {
        if (!currentSeason.season_number) return toast({ variant: "destructive", title: "Número da temporada obrigatório" });
        setSubmitting(true);
        try {
            const seasonData = {
                series_id: activeSeries!.id,
                season_number: currentSeason.season_number,
                title: currentSeason.title,
            };

            if (currentSeason.id) {
                await supabase.from('seasons').update(seasonData).eq('id', currentSeason.id).throwOnError();
                toast({ title: "Temporada atualizada!" });
            } else {
                await supabase.from('seasons').insert([seasonData]).throwOnError();
                toast({ title: "Temporada criada!" });
            }
            setIsSeasonDialogOpen(false);
            fetchSeasonsAndEpisodes(activeSeries!.id);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao salvar temporada", description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSeason = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta temporada e todos os seus episódios?")) return;
        try {
            await supabase.from('seasons').delete().eq('id', id).throwOnError();
            toast({ title: "Temporada excluída!" });
            fetchSeasonsAndEpisodes(activeSeries!.id);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
        }
    }

    const handleSaveEpisode = async () => {
        if (!currentEpisode.title || !currentEpisode.episode_number) return toast({ variant: "destructive", title: "Título e número obrigatórios" });
        setSubmitting(true);
        try {
            const episodeData = {
                season_id: activeSeasonIdForEpisode!,
                episode_number: currentEpisode.episode_number,
                title: currentEpisode.title,
                description: currentEpisode.description,
                thumbnail_url: currentEpisode.thumbnail_url,
                video_url: currentEpisode.video_url,
                duration: currentEpisode.duration,
                unlock_delay_days: Number(currentEpisode.unlock_delay_days || 0),
                required_mission_day: Number(currentEpisode.required_mission_day || 0),
                is_active: currentEpisode.is_active !== undefined ? currentEpisode.is_active : true,
            };

            if (currentEpisode.id) {
                await supabase.from('episodes').update(episodeData).eq('id', currentEpisode.id).throwOnError();
                toast({ title: "Episódio atualizado!" });
            } else {
                await supabase.from('episodes').insert([episodeData]).throwOnError();
                toast({ title: "Episódio adicionado!" });
            }
            setIsEpisodeDialogOpen(false);
            fetchSeasonsAndEpisodes(activeSeries!.id);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao salvar episódio", description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteEpisode = async (id: string) => {
        if (!confirm("Excluir este episódio?")) return;
        try {
            await supabase.from('episodes').delete().eq('id', id).throwOnError();
            toast({ title: "Episódio excluído!" });
            fetchSeasonsAndEpisodes(activeSeries!.id);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
        }
    };

    const handleImportBunnyCollection = async () => {
        if (!importCollectionId.trim() || !activeSeasonIdForEpisode) {
            return toast({ variant: "destructive", title: "Informe o ID da Coleção" });
        }

        const libraryId = bunnyLibraryId.trim();
        const apiKey = bunnyApiKey.trim();
        const cdnHostname = bunnyCdnHostname.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

        if (!libraryId || !apiKey || !cdnHostname) {
            return toast({
                variant: "destructive",
                title: "Configurações Ausentes",
                description: "Preencha a API Key, Library ID e CDN Hostname nas opções abaixo antes de importar."
            });
        }

        setImporting(true);
        try {
            // 1. Obter vídeos da coleção no Bunny
            const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos?collection=${importCollectionId}&itemsPerPage=1000`, {
                headers: {
                    accept: 'application/json',
                    AccessKey: apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Erro na API do Bunny: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const bunnyVideos = data.items || [];

            if (bunnyVideos.length === 0) {
                toast({ title: "Nenhum vídeo encontrado", description: "Esta coleção parece estar vazia." });
                setImporting(false);
                return;
            }

            // 2. Obter episódios atuais da temporada para bater URLs e evitar repetição
            const currentSeasonEpisodes = episodes[activeSeasonIdForEpisode] || [];
            const existingUrls = currentSeasonEpisodes.map(ep => ep.video_url);

            // 3. Montar os inserts (só os não existentes)
            const getNextEpNum = () => currentSeasonEpisodes.length + newVideosToInsert.length + 1;
            const newVideosToInsert: any[] = [];

            for (const bv of bunnyVideos) {
                const videoUrl = `https://iframe.mediadelivery.net/play/${libraryId}/${bv.guid}`;

                // Evita criar se já existe esse vídeo URL na temporada
                if (!existingUrls.includes(videoUrl)) {
                    // Tenta formatar a duração em segundos
                    const totalSecs = Math.floor(bv.length || 0);
                    const mins = Math.floor(totalSecs / 60);
                    const secs = totalSecs % 60;
                    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

                    newVideosToInsert.push({
                        season_id: activeSeasonIdForEpisode,
                        episode_number: getNextEpNum(),
                        title: bv.title || "Novo Episódio",
                        description: "",
                        thumbnail_url: `https://${cdnHostname}/${bv.guid}/${bv.thumbnailFileName || 'thumbnail.webp'}`,
                        video_url: videoUrl,
                        duration: durationStr,
                        unlock_delay_days: 0,
                        required_mission_day: 0,
                        is_active: true
                    });
                }
            }

            // 4. Salvar no Supabase
            if (newVideosToInsert.length > 0) {
                // Ordenar por título? O Bunny.net pode vir ordenado ou não. Aqui importamos como chegam.
                await supabase.from('episodes').insert(newVideosToInsert.reverse()).throwOnError(); // Reverse pra manter a ordem (o bunny traz do mais novo pro mais antigo normalmente)
                toast({ title: `Importado com sucesso!`, description: `${newVideosToInsert.length} novos vídeos adicionados.` });
                setIsImportDialogOpen(false);
                setImportCollectionId("");
                fetchSeasonsAndEpisodes(activeSeries!.id);
            } else {
                toast({ title: "Nenhum arquivo novo", description: "Todos os vídeos desta coleção já foram importados para esta temporada." });
            }

        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro na Importação", description: error.message });
        } finally {
            setImporting(false);
        }
    };


    const filteredSeries = series.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            {view === 'seriesList' && (
                <>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold font-fredoka text-slate-800">Gerenciar Séries</h2>
                            <p className="text-slate-500">Agrupe vídeos usando a estrutura de Séries, Temporadas e Episódios.</p>
                        </div>
                        <Button onClick={() => { setCurrentSeries({ is_active: true, category: 'Série' }); setIsSeriesDialogOpen(true); }} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                            <Plus className="w-4 h-4 mr-2" /> Nova Série
                        </Button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar série..."
                                    className="pl-10 bg-white border-slate-200"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-[80px]">Capa</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && series.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-fuchsia-500" /></TableCell></TableRow>
                                ) : filteredSeries.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-500">Nenhuma série encontrada.</TableCell></TableRow>
                                ) : (
                                    filteredSeries.map(s => (
                                        <TableRow key={s.id} className="group hover:bg-slate-50 cursor-pointer" onClick={() => { setActiveSeries(s); setView('seriesDetail'); }}>
                                            <TableCell>
                                                <img src={s.cover_url || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200"} className="w-16 h-10 object-cover rounded bg-slate-200" />
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-800">{s.title}</TableCell>
                                            <TableCell>{s.category}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" onClick={() => { setCurrentSeries(s); setIsSeriesDialogOpen(true); }}>
                                                        <Pencil className="w-4 h-4 text-fuchsia-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSeries(s.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            {view === 'seriesDetail' && activeSeries && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="outline" size="icon" onClick={() => { setView('seriesList'); setActiveSeries(null); }}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold font-fredoka text-slate-800 flex items-center gap-2">
                                <Layers className="text-fuchsia-500" /> {activeSeries.title}
                            </h2>
                            <p className="text-slate-500">Gerencie as Temporadas e os Episódios</p>
                        </div>
                    </div>

                    <div className="mb-6 flex justify-end">
                        <Button onClick={() => {
                            setCurrentSeason({ season_number: seasons.length + 1 });
                            setIsSeasonDialogOpen(true);
                        }} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Temporada
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" /></div>
                    ) : seasons.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                            <p className="text-slate-500">Nenhuma temporada cadastrada.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {seasons.map(season => (
                                <div key={season.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                            Temporada {season.season_number}
                                            {season.title && <span className="font-normal text-sm text-slate-500">- {season.title}</span>}
                                        </h3>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => { setCurrentSeason(season); setIsSeasonDialogOpen(true); }}>
                                                Editar Temporada
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteSeason(season.id)}>
                                                Excluir Temporada
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => {
                                                setActiveSeasonIdForEpisode(season.id);
                                                setImportCollectionId("");
                                                setIsImportDialogOpen(true);
                                            }} className="border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50">
                                                <DownloadCloud className="w-4 h-4 mr-2" /> Importar do Bunny
                                            </Button>
                                            <Button size="sm" onClick={() => {
                                                setActiveSeasonIdForEpisode(season.id);
                                                setCurrentEpisode({ episode_number: (episodes[season.id]?.length || 0) + 1, is_active: true });
                                                setIsEpisodeDialogOpen(true);
                                            }} className="bg-slate-800 text-white hover:bg-slate-700">
                                                <PlaySquare className="w-4 h-4 mr-2" /> Add Episódio
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        {episodes[season.id]?.length === 0 ? (
                                            <p className="text-sm text-slate-500 text-center py-4">Nenhum episódio nesta temporada.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {episodes[season.id]?.map(ep => (
                                                    <div key={ep.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm shrink-0">
                                                            {ep.episode_number}
                                                        </div>
                                                        <img src={ep.thumbnail_url || "https://images.unsplash.com/photo-1574267432553-4b4628081524?w=200"} className="w-16 h-10 object-cover rounded bg-slate-200 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-slate-800 truncate">{ep.title}</h4>
                                                            <p className="text-xs text-slate-500 line-clamp-1">{ep.description || <span className="italic">Sem descrição</span>}</p>
                                                        </div>
                                                        <div className="text-sm text-slate-500 shrink-0 tabular-nums">
                                                            <Clock className="w-3 h-3 inline mr-1" />{ep.duration || '--'}
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <Button variant="ghost" size="icon" onClick={() => {
                                                                setActiveSeasonIdForEpisode(season.id);
                                                                setCurrentEpisode(ep);
                                                                setIsEpisodeDialogOpen(true);
                                                            }}>
                                                                <Pencil className="w-4 h-4 text-slate-500" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteEpisode(ep.id)}>
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Dialog Series */}
            <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentSeries.id ? 'Editar Série' : 'Nova Série'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título da Série</Label>
                            <Input value={currentSeries.title || ''} onChange={e => setCurrentSeries({ ...currentSeries, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input value={currentSeries.description || ''} onChange={e => setCurrentSeries({ ...currentSeries, description: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Capa (URL)</Label>
                            <Input value={currentSeries.cover_url || ''} onChange={e => setCurrentSeries({ ...currentSeries, cover_url: e.target.value })} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <Label>Ativo?</Label>
                            <Switch checked={currentSeries.is_active !== false} onCheckedChange={checked => setCurrentSeries({ ...currentSeries, is_active: checked })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSeriesDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveSeries} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Season */}
            <Dialog open={isSeasonDialogOpen} onOpenChange={setIsSeasonDialogOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentSeason.id ? 'Editar Temporada' : 'Nova Temporada'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Número da Temporada</Label>
                            <Input type="number" value={currentSeason.season_number || ''} onChange={e => setCurrentSeason({ ...currentSeason, season_number: parseInt(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Título (Opcional)</Label>
                            <Input placeholder="Ex: Saga do Deserto" value={currentSeason.title || ''} onChange={e => setCurrentSeason({ ...currentSeason, title: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSeasonDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveSeason} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Episode */}
            <Dialog open={isEpisodeDialogOpen} onOpenChange={setIsEpisodeDialogOpen}>
                <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentEpisode.id ? 'Editar Episódio' : 'Novo Episódio'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label>Número</Label>
                                <Input type="number" value={currentEpisode.episode_number || ''} onChange={e => setCurrentEpisode({ ...currentEpisode, episode_number: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-2 col-span-3">
                                <Label>Título</Label>
                                <Input value={currentEpisode.title || ''} onChange={e => setCurrentEpisode({ ...currentEpisode, title: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input value={currentEpisode.description || ''} onChange={e => setCurrentEpisode({ ...currentEpisode, description: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Thumbnail URL (Bunny.net ou Imagem Web)</Label>
                            <Input value={currentEpisode.thumbnail_url || ''} onChange={e => setCurrentEpisode({ ...currentEpisode, thumbnail_url: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>URL do Episódio (Bunny Stream Direct/Embed)</Label>
                            <Input value={currentEpisode.video_url || ''} onChange={e => setCurrentEpisode({ ...currentEpisode, video_url: e.target.value })} placeholder="https://iframe.mediadelivery.net/play/..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duração</Label>
                                <Input value={currentEpisode.duration || ''} onChange={e => setCurrentEpisode({ ...currentEpisode, duration: e.target.value })} placeholder="Ex: 22m" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <Label>Ativo?</Label>
                            <Switch checked={currentEpisode.is_active !== false} onCheckedChange={checked => setCurrentEpisode({ ...currentEpisode, is_active: checked })} />
                        </div>

                        {/* Content Drip Settings */}
                        <div className="space-y-4 p-4 bg-fuchsia-50/50 rounded-xl border border-fuchsia-100">
                            <h4 className="font-bold text-sm text-fuchsia-800 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Configurações de Gotejamento (Drip)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Dias para Liberar</Label>
                                    <Input type="number" min="0" value={currentEpisode.unlock_delay_days || 0} onChange={e => setCurrentEpisode({ ...currentEpisode, unlock_delay_days: parseInt(e.target.value) || 0 })} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Missão (Dia)</Label>
                                    <Input type="number" min="0" value={currentEpisode.required_mission_day || 0} onChange={e => setCurrentEpisode({ ...currentEpisode, required_mission_day: parseInt(e.target.value) || 0 })} className="bg-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEpisodeDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveEpisode} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de Importação do Bunny */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Importar Coleção Bunny.net</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-200">
                            <strong>Como funciona:</strong> Cole abaixo o ID da sua Coleção no Bunny.net. O sistema vai puxar todos os vídeos que estiverem lá, criar a Thumbnail, pegar o Título e o Link, e transformar tudo em Episódios desta temporada na ordem original! (Novos episódios sem afetar os antigos).
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-600">Video Library ID</Label>
                                    <Input
                                        type="text"
                                        placeholder="Ex: 608121"
                                        value={bunnyLibraryId}
                                        onChange={e => setBunnyLibraryId(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600">CDN Hostname</Label>
                                    <Input
                                        type="text"
                                        placeholder="Ex: vz-xxxxxxxx.b-cdn.net"
                                        value={bunnyCdnHostname}
                                        onChange={e => setBunnyCdnHostname(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">API Key (Access Key)</Label>
                                <Input
                                    type="password"
                                    placeholder="Cole a chave da API aqui..."
                                    value={bunnyApiKey}
                                    onChange={e => setBunnyApiKey(e.target.value)}
                                />
                                <p className="text-xs text-slate-400">Suas chaves ficam salvas em segurança somente neste navegador.</p>
                            </div>
                        </div>

                        <hr className="my-4 border-slate-100" />

                        <div className="space-y-2">
                            <Label>Bunny Collection ID para Importar</Label>
                            <Input
                                placeholder="ex: 3e104b26-b0d3-4b09-aeaf-067bb32d64ad"
                                value={importCollectionId}
                                onChange={e => setImportCollectionId(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleImportBunnyCollection} disabled={importing} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DownloadCloud className="w-4 h-4 mr-2" />}
                            Importar Vídeos
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
