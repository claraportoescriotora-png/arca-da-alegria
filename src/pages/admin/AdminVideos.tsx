import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Search, Youtube, Download, X, ChevronLeft, ChevronRight, CheckSquare, Settings2, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

interface Video {
    id: string;
    title: string;
    thumbnail_url: string;
    video_url: string;
    duration: string;
    category: string;
    is_active: boolean;
    is_duplicate?: boolean;
    unlock_delay_days?: number;
    required_mission_day?: number;
}

export function AdminVideos() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    // Calculate derived categories from existing videos
    const uniqueCategories = Array.from(new Set([
        'Músicas', 'Histórias', 'Aprendizado',
        ...videos.map(v => v.category)
    ])).sort();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Selection State
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<Partial<Video>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isCustomEditCategory, setIsCustomEditCategory] = useState(false);

    // Bulk Edit State
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [bulkCategory, setBulkCategory] = useState("Músicas");
    const [isBulkCustomCategory, setIsBulkCustomCategory] = useState(false);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    // Import State
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [apiKey, setApiKey] = useState(localStorage.getItem("yt_api_key") || "");
    const [importCategory, setImportCategory] = useState("Músicas");
    const [isCustomImportCategory, setIsCustomImportCategory] = useState(false);
    const [autoTranslate, setAutoTranslate] = useState(true);
    const [importing, setImporting] = useState(false);
    const [previewVideos, setPreviewVideos] = useState<Partial<Video>[]>([]);

    useEffect(() => {
        fetchVideos();
    }, []);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
        setSelectedVideos(new Set());
    }, [searchTerm]);

    const fetchVideos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('title', { ascending: true });

        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar vídeos" });
        } else {
            setVideos(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            const videoData = {
                title: currentVideo.title,
                thumbnail_url: currentVideo.thumbnail_url,
                video_url: currentVideo.video_url,
                duration: currentVideo.duration,
                category: currentVideo.category,
                is_active: currentVideo.is_active !== undefined ? currentVideo.is_active : true,
                unlock_delay_days: Number(currentVideo.unlock_delay_days || 0),
                required_mission_day: Number(currentVideo.required_mission_day || 0)
            };

            if (isEditing && currentVideo.id) {
                const { error } = await supabase
                    .from('videos')
                    .update(videoData)
                    .eq('id', currentVideo.id);
                if (error) throw error;
                toast({ title: "Vídeo atualizado com sucesso!" });
            } else {
                const { error } = await supabase
                    .from('videos')
                    .insert([videoData]);
                if (error) throw error;
                toast({ title: "Vídeo criado com sucesso!" });
            }
            setIsDialogOpen(false);
            fetchVideos();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este vídeo?")) return;

        try {
            const { error } = await supabase.from('videos').delete().eq('id', id);
            if (error) throw error;
            toast({ title: "Vídeo excluído" });
            fetchVideos();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
        }
    };

    // --- Bulk Actions ---
    const toggleSelectAll = () => {
        if (selectedVideos.size === filteredVideos.length) {
            setSelectedVideos(new Set());
        } else {
            setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
        }
    };

    const toggleSelectVideo = (id: string) => {
        const newSelected = new Set(selectedVideos);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedVideos(newSelected);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Tem certeza que deseja excluir permanentemente ${selectedVideos.size} vídeos?`)) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('videos').delete().in('id', Array.from(selectedVideos));
            if (error) throw error;
            toast({ title: "Vídeos excluídos com sucesso!" });
            setSelectedVideos(new Set());
            fetchVideos();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
            setLoading(false);
        }
    };

    const handleBulkCategoryUpdate = async () => {
        if (!bulkCategory) return;
        setBulkSubmitting(true);
        try {
            const { error } = await supabase
                .from('videos')
                .update({ category: bulkCategory })
                .in('id', Array.from(selectedVideos));

            if (error) throw error;
            toast({ title: "Categorias atualizadas com sucesso!" });
            setIsBulkDialogOpen(false);
            setSelectedVideos(new Set());
            fetchVideos();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
        } finally {
            setBulkSubmitting(false);
        }
    };

    const openNew = () => {
        setCurrentVideo({ category: 'Músicas', is_active: true });
        setIsEditing(false);
        setIsCustomEditCategory(false);
        setIsDialogOpen(true);
    };

    const openEdit = (video: Video) => {
        setCurrentVideo(video);
        setIsEditing(true);
        setIsCustomEditCategory(!['Músicas', 'Histórias', 'Aprendizado'].includes(video.category));
        setIsDialogOpen(true);
    };

    // --- Import Logic ---

    const extractVideoId = (url: string) => {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        return match ? match[1] : null;
    };

    const parseDuration = (isoDuration: string) => {
        const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return "00:00";

        const hours = (match[1] || '').replace('H', '');
        const minutes = (match[2] || '').replace('M', '');
        const seconds = (match[3] || '').replace('S', '');

        let result = "";
        if (hours) result += `${hours}:`;
        result += `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;

        return result.startsWith("0") && result.length > 5 ? result.substring(1) : result; // Cleanup
    };

    const translateTitle = async (text: string) => {
        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|pt`);
            const data = await res.json();
            return data.responseData.translatedText || text;
        } catch (e) {
            console.error("Translation failed", e);
            return text;
        }
    };

    const handleFetchPlaylist = async () => {
        if (!apiKey) {
            toast({ variant: "destructive", title: "API Key Necessária", description: "Por favor, insira uma chave de API do YouTube válida." });
            return;
        }

        const listIdMatch = playlistUrl.match(/list=([a-zA-Z0-9_-]+)/);
        const listId = listIdMatch ? listIdMatch[1] : playlistUrl;

        if (!listId) {
            toast({ variant: "destructive", title: "URL Inválida", description: "Não consegui identificar o ID da playlist." });
            return;
        }

        localStorage.setItem("yt_api_key", apiKey);
        setImporting(true);
        setPreviewVideos([]);

        try {
            // 1. Get Playlist Items (IDs) - Loop for pagination
            let allVideoIds: string[] = [];
            let nextPageToken: string | undefined = undefined;

            do {
                const url: string = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${listId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
                const plRes = await fetch(url);
                const plData = await plRes.json();

                if (plData.error) throw new Error(plData.error.message);

                const ids = plData.items.map((item: any) => item.snippet.resourceId.videoId);
                allVideoIds = [...allVideoIds, ...ids];
                nextPageToken = plData.nextPageToken;

            } while (nextPageToken);

            // 2. Fetch all existing video URLs from DB
            const { data: dbVideos } = await supabase.from('videos').select('video_url');
            const existingIds = new Set((dbVideos || []).map(v => extractVideoId(v.video_url)).filter(Boolean));

            // 3. Get Video Details (Duration) - Loop for chunks (max 50 IDs per call)
            const chunkArray = (arr: string[], size: number) => {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) {
                    chunks.push(arr.slice(i, i + size));
                }
                return chunks;
            };

            const idChunks = chunkArray(allVideoIds, 50);
            let allVideoDetails: any[] = [];

            for (const chunk of idChunks) {
                const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${chunk.join(',')}&key=${apiKey}`);
                const vidData = await vidRes.json();
                if (vidData.items) {
                    allVideoDetails = [...allVideoDetails, ...vidData.items];
                }
            }

            const mappedVideos = await Promise.all(allVideoDetails.map(async (item: any) => {
                let title = item.snippet.title;
                if (autoTranslate && /^[A-Za-z0-9\s.,!?'"-]+$/.test(title)) { // Simple check if mainly english/latin
                    title = await translateTitle(title);
                }

                const id = extractVideoId(`https://www.youtube.com/watch?v=${item.id}`);
                const isDuplicate = id ? existingIds.has(id) : false;

                return {
                    title: title,
                    thumbnail_url: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
                    video_url: `https://www.youtube.com/watch?v=${item.id}`,
                    duration: parseDuration(item.contentDetails.duration),
                    category: importCategory,
                    is_active: true,
                    is_duplicate: isDuplicate
                };
            }));

            // Show all videos, but mark duplicates
            setPreviewVideos(mappedVideos);

            const newCount = mappedVideos.filter(v => !v.is_duplicate).length;
            const duplicateCount = mappedVideos.length - newCount;

            if (duplicateCount > 0) {
                toast({
                    title: "Resultado da Busca",
                    description: `Encontrados: ${mappedVideos.length}. Novos: ${newCount}. Já Existem: ${duplicateCount}.`,
                });
            } else {
                toast({
                    title: "Resultado da Busca",
                    description: `Encontrados: ${mappedVideos.length}. Todos são novos.`
                });
            }

        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro na Importação", description: error.message });
        } finally {
            setImporting(false);
        }
    };

    const confirmImport = async () => {
        setImporting(true);
        try {
            // Only insert non-duplicates
            const videosToInsert = previewVideos.filter(v => !v.is_duplicate).map(v => {
                const { is_duplicate, ...rest } = v;
                return rest;
            });

            if (videosToInsert.length === 0) {
                toast({ variant: "destructive", title: "Nada para importar", description: "Todos os vídeos já existem." });
                setImporting(false);
                return;
            }

            const { error } = await supabase.from('videos').insert(videosToInsert);
            if (error) throw error;
            toast({ title: `Sucesso!`, description: `${videosToInsert.length} vídeos importados.` });
            setIsImportOpen(false);
            setPreviewVideos([]);
            fetchVideos();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setImporting(false);
        }
    }

    const filteredVideos = videos.filter(v =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtered & Paginated
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVideos = filteredVideos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800">Gerenciar Vídeos</h2>
                    <p className="text-slate-500">Adicione vídeos do YouTube ou importe playlists.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportOpen(true)} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                        <Download className="w-4 h-4 mr-2" />
                        Importar Playlist
                    </Button>
                    <Button onClick={openNew} className="bg-green-500 hover:bg-green-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Vídeo
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-2 justify-between items-center bg-slate-50/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar vídeo..."
                            className="pl-10 bg-white border-slate-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Bulk Actions Bar */}
                    {selectedVideos.size > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                                {selectedVideos.size} selecionados
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsBulkDialogOpen(true)}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            >
                                <Settings2 className="w-4 h-4 mr-2" />
                                Mudar Categoria
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                            </Button>
                        </div>
                    )}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={filteredVideos.length > 0 && selectedVideos.size === filteredVideos.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-[100px]">Thumbnail</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                </TableCell>
                            </TableRow>
                        ) : filteredVideos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    Nenhum vídeo encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentVideos.map((video) => (
                                <TableRow key={video.id} className={selectedVideos.has(video.id) ? "bg-blue-50/50" : ""}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedVideos.has(video.id)}
                                            onCheckedChange={() => toggleSelectVideo(video.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <img src={video.thumbnail_url} alt="" className="w-16 h-10 rounded object-cover bg-slate-100" />
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700 max-w-md truncate" title={video.title}>{video.title}</TableCell>
                                    <TableCell>
                                        <span className="capitalize px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                            {video.category === 'music' ? 'Músicas' :
                                                video.category === 'stories' ? 'Histórias' :
                                                    video.category === 'learning' ? 'Aprendizado' : video.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{video.duration}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(video)}>
                                                <Pencil className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(video.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                {filteredVideos.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>Itens por página:</span>
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(val) => {
                                    setItemsPerPage(Number(val));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[70px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="ml-2">
                                {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredVideos.length)} de {filteredVideos.length}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center px-2 text-sm font-medium">
                                Página {currentPage} de {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Vídeo' : 'Novo Vídeo'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                                value={currentVideo.title || ''}
                                onChange={e => setCurrentVideo({ ...currentVideo, title: e.target.value })}
                                placeholder="Ex: 3 Palavrinhas - Volume 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL Thumbnail (Imagem)</Label>
                            <Input
                                value={currentVideo.thumbnail_url || ''}
                                onChange={e => setCurrentVideo({ ...currentVideo, thumbnail_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL do Vídeo (Bunny Stream/YouTube/MP4)</Label>
                            <Input
                                value={currentVideo.video_url || ''}
                                onChange={e => setCurrentVideo({ ...currentVideo, video_url: e.target.value })}
                                placeholder="https://iframe.mediadelivery.net/play/..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duração</Label>
                                <Input
                                    value={currentVideo.duration || ''}
                                    onChange={e => setCurrentVideo({ ...currentVideo, duration: e.target.value })}
                                    placeholder="Ex: 3 min"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                {isCustomEditCategory ? (
                                    <div className="flex gap-2">
                                        <Input
                                            value={currentVideo.category}
                                            onChange={e => setCurrentVideo({ ...currentVideo, category: e.target.value })}
                                            placeholder="Digite a categoria..."
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => setIsCustomEditCategory(false)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Select
                                        value={currentVideo.category}
                                        onValueChange={(val) => {
                                            if (val === 'new_custom') {
                                                setIsCustomEditCategory(true);
                                                setCurrentVideo({ ...currentVideo, category: '' });
                                            } else {
                                                setCurrentVideo({ ...currentVideo, category: val });
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {uniqueCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                            <SelectItem value="new_custom" className="text-blue-600 font-bold">
                                                + Nova Categoria
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <Label>Ativo?</Label>
                            <Switch
                                checked={currentVideo.is_active !== false} // Default true
                                onCheckedChange={checked => setCurrentVideo({ ...currentVideo, is_active: checked })}
                            />
                        </div>

                        {/* Content Drip Settings */}
                        <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-sm text-blue-800 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Configurações de Gotejamento (Drip)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Dias para Liberar</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={currentVideo.unlock_delay_days || 0}
                                        onChange={e => setCurrentVideo({ ...currentVideo, unlock_delay_days: parseInt(e.target.value) || 0 })}
                                        className="bg-white"
                                    />
                                    <p className="text-[10px] text-slate-500">0 = Liberado imediatamente</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Missão Reabilitadora (Dia)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={currentVideo.required_mission_day || 0}
                                        onChange={e => setCurrentVideo({ ...currentVideo, required_mission_day: parseInt(e.target.value) || 0 })}
                                        className="bg-white"
                                    />
                                    <p className="text-[10px] text-slate-500">Obrigatório concluir até o dia X</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={submitting}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Update Category Dialog */}
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Alterar Categoria em Massa</DialogTitle>
                        <DialogDescription>
                            Isso atualizará a categoria de {selectedVideos.size} vídeos selecionados.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Nova Categoria</Label>
                        <div className="mt-2">
                            {isBulkCustomCategory ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={bulkCategory}
                                        onChange={e => setBulkCategory(e.target.value)}
                                        placeholder="Digite a categoria..."
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => setIsBulkCustomCategory(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Select
                                    value={bulkCategory}
                                    onValueChange={(val) => {
                                        if (val === 'new_custom') {
                                            setIsBulkCustomCategory(true);
                                            setBulkCategory('');
                                        } else {
                                            setBulkCategory(val);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uniqueCategories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                        <SelectItem value="new_custom" className="text-blue-600 font-bold">
                                            + Nova Categoria
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleBulkCategoryUpdate} disabled={bulkSubmitting}>
                            {bulkSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Atualizar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Youtube className="text-red-600" />
                            Importar Playlist do YouTube
                        </DialogTitle>
                        <DialogDescription>
                            Cole o link de uma playlist para importar todos os vídeos automaticamente para uma categoria.
                            <br />
                            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-blue-500 hover:underline text-xs">
                                Precisa de uma API Key do YouTube (Data API v3).
                            </a>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>YouTube API Key</Label>
                                <Input
                                    type="password"
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria Destino</Label>
                                {isCustomImportCategory ? (
                                    <div className="flex gap-2">
                                        <Input
                                            value={importCategory}
                                            onChange={e => setImportCategory(e.target.value)}
                                            placeholder="Digite a categoria..."
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => setIsCustomImportCategory(false)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Select
                                        value={importCategory}
                                        onValueChange={(val) => {
                                            if (val === 'new_custom') {
                                                setIsCustomImportCategory(true);
                                                setImportCategory('');
                                            } else {
                                                setImportCategory(val);
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {uniqueCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                            <SelectItem value="new_custom" className="text-blue-600 font-bold">
                                                + Nova Categoria
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Link da Playlist</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={playlistUrl}
                                    onChange={e => setPlaylistUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/playlist?list=..."
                                />
                                <Button onClick={handleFetchPlaylist} disabled={importing || !apiKey}>
                                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-100">
                            <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} />
                            <Label className="text-sm text-blue-800">Traduzir títulos automaticamente (Inglês para Português)</Label>
                        </div>

                        {previewVideos.length > 0 && (
                            <div className="border rounded-lg overflow-hidden grid max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 sticky top-0">
                                            <TableHead>Vídeo Encontrado ({previewVideos.length})</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Duração</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewVideos.map((v, i) => (
                                            <TableRow key={i} className={v.is_duplicate ? "opacity-50 bg-slate-50" : ""}>
                                                <TableCell className="text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <img src={v.thumbnail_url} className="w-8 h-8 rounded object-cover" />
                                                        <span className={v.is_duplicate ? "line-through text-slate-500" : ""}>
                                                            {v.title}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {v.is_duplicate ? (
                                                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Já Existe</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Novo</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">{v.duration}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={confirmImport}
                            disabled={previewVideos.length === 0 || importing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirmar Importação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
