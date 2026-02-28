import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Search, X, ChevronLeft, ChevronRight, Settings2, Clock, DownloadCloud } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

interface Movie {
    id: string;
    title: string;
    description: string;
    cover_url: string;
    video_url: string;
    duration: string;
    category: string;
    is_active: boolean;
    unlock_delay_days?: number;
    required_mission_day?: number;
}

export function AdminMovies() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const uniqueCategories = Array.from(new Set([
        'Filme', 'Curta', 'Especial',
        ...movies.map(v => v.category || 'Filme')
    ])).sort();

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set());

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentMovie, setCurrentMovie] = useState<Partial<Movie>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isCustomEditCategory, setIsCustomEditCategory] = useState(false);

    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [bulkCategory, setBulkCategory] = useState("Filme");
    const [isBulkCustomCategory, setIsBulkCustomCategory] = useState(false);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

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
        fetchMovies();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedMovies(new Set());
    }, [searchTerm]);

    const fetchMovies = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('movies')
            .select('*')
            .order('title', { ascending: true });

        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar filmes" });
        } else {
            setMovies(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!currentMovie.title) {
            toast({ variant: "destructive", title: "O título é obrigatório" });
            return;
        }

        setSubmitting(true);
        try {
            const movieData = {
                title: currentMovie.title,
                description: currentMovie.description,
                cover_url: currentMovie.cover_url,
                video_url: currentMovie.video_url,
                duration: currentMovie.duration,
                category: currentMovie.category || 'Filme',
                is_active: currentMovie.is_active !== undefined ? currentMovie.is_active : true,
                unlock_delay_days: Number(currentMovie.unlock_delay_days || 0),
                required_mission_day: Number(currentMovie.required_mission_day || 0)
            };

            if (isEditing && currentMovie.id) {
                const { error } = await supabase
                    .from('movies')
                    .update(movieData)
                    .eq('id', currentMovie.id);
                if (error) throw error;
                toast({ title: "Filme atualizado com sucesso!" });
            } else {
                const { error } = await supabase
                    .from('movies')
                    .insert([movieData]);
                if (error) throw error;
                toast({ title: "Filme criado com sucesso!" });
            }
            setIsDialogOpen(false);
            fetchMovies();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este filme?")) return;

        try {
            const { error } = await supabase.from('movies').delete().eq('id', id);
            if (error) throw error;
            toast({ title: "Filme excluído" });
            fetchMovies();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
        }
    };

    const toggleSelectAll = () => {
        if (selectedMovies.size === filteredMovies.length) {
            setSelectedMovies(new Set());
        } else {
            setSelectedMovies(new Set(filteredMovies.map(v => v.id)));
        }
    };

    const toggleSelectMovie = (id: string) => {
        const newSelected = new Set(selectedMovies);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedMovies(newSelected);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Tem certeza que deseja excluir permanentemente ${selectedMovies.size} filmes?`)) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('movies').delete().in('id', Array.from(selectedMovies));
            if (error) throw error;
            toast({ title: "Filmes excluídos com sucesso!" });
            setSelectedMovies(new Set());
            fetchMovies();
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
                .from('movies')
                .update({ category: bulkCategory })
                .in('id', Array.from(selectedMovies));

            if (error) throw error;
            toast({ title: "Categorias atualizadas com sucesso!" });
            setIsBulkDialogOpen(false);
            setSelectedMovies(new Set());
            fetchMovies();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
        } finally {
            setBulkSubmitting(false);
        }
    };

    const handleImportBunnyCollection = async () => {
        if (!importCollectionId.trim()) {
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

            // 2. Obter filmes atuais para evitar repetição (bater URLs)
            const existingUrls = movies.map(m => m.video_url);

            // 3. Montar os inserts (só os não existentes)
            const newVideosToInsert: any[] = [];

            for (const bv of bunnyVideos) {
                const videoUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${bv.guid}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;

                // Evita criar se já existe esse vídeo URL no app
                if (!existingUrls.includes(videoUrl)) {
                    // Tenta formatar a duração em segundos
                    const totalSecs = Math.floor(bv.length || 0);
                    const mins = Math.floor(totalSecs / 60);
                    const secs = totalSecs % 60;
                    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

                    newVideosToInsert.push({
                        title: bv.title || "Novo Filme",
                        description: "",
                        thumbnail_url: `https://${cdnHostname}/${bv.guid}/${bv.thumbnailFileName || 'thumbnail.webp'}`,
                        cover_url: `https://${cdnHostname}/${bv.guid}/${bv.thumbnailFileName || 'thumbnail.webp'}`,
                        video_url: videoUrl,
                        duration: durationStr,
                        category: "Filme",
                        unlock_delay_days: 0,
                        required_mission_day: 0,
                        is_active: true
                    });
                }
            }

            // 4. Salvar no Supabase
            if (newVideosToInsert.length > 0) {
                await supabase.from('movies').insert(newVideosToInsert.reverse()).throwOnError(); // Reverse pra manter a ordem original
                toast({ title: `Importado com sucesso!`, description: `${newVideosToInsert.length} novos filmes adicionados.` });
                setIsImportDialogOpen(false);
                setImportCollectionId("");
                fetchMovies();
            } else {
                toast({ title: "Nenhum arquivo novo", description: "Todos os filmes desta coleção já foram importados." });
            }

        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro na Importação", description: error.message });
        } finally {
            setImporting(false);
        }
    };

    const openNew = () => {
        setCurrentMovie({ category: 'Filme', is_active: true });
        setIsEditing(false);
        setIsCustomEditCategory(false);
        setIsDialogOpen(true);
    };

    const openEdit = (movie: Movie) => {
        setCurrentMovie(movie);
        setIsEditing(true);
        setIsCustomEditCategory(!['Filme', 'Curta', 'Especial'].includes(movie.category));
        setIsDialogOpen(true);
    };

    const filteredMovies = movies.filter(v =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMovies = filteredMovies.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800">Gerenciar Filmes</h2>
                    <p className="text-slate-500">Adicione filmes únicos longas metragens ou curtas (Bunny.net).</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="text-slate-700 bg-white">
                        <DownloadCloud className="w-4 h-4 mr-2" />
                        Importar do Bunny
                    </Button>
                    <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Filme
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-2 justify-between items-center bg-slate-50/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar filme..."
                            className="pl-10 bg-white border-slate-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {selectedMovies.size > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                                {selectedMovies.size} selecionados
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsBulkDialogOpen(true)}
                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
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
                                    checked={filteredMovies.length > 0 && selectedMovies.size === filteredMovies.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-[80px]">Capa</TableHead>
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
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                                </TableCell>
                            </TableRow>
                        ) : filteredMovies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    Nenhum filme encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentMovies.map((movie) => (
                                <TableRow key={movie.id} className={selectedMovies.has(movie.id) ? "bg-indigo-50/50" : ""}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedMovies.has(movie.id)}
                                            onCheckedChange={() => toggleSelectMovie(movie.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <img src={movie.cover_url || "https://images.unsplash.com/photo-1574267432553-4b4628081524?w=200"} alt="" className="w-10 h-14 rounded object-cover bg-slate-100" />
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700 max-w-md truncate" title={movie.title}>{movie.title}</TableCell>
                                    <TableCell>
                                        <span className="capitalize px-2 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                                            {movie.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{movie.duration}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(movie)}>
                                                <Pencil className="w-4 h-4 text-indigo-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(movie.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {filteredMovies.length > 0 && (
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
                                {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMovies.length)} de {filteredMovies.length}
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Filme' : 'Novo Filme'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                        <div className="space-y-2">
                            <Label>Título do Filme</Label>
                            <Input
                                value={currentMovie.title || ''}
                                onChange={e => setCurrentMovie({ ...currentMovie, title: e.target.value })}
                                placeholder="Ex: A Grande Aventura"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                                value={currentMovie.description || ''}
                                onChange={e => setCurrentMovie({ ...currentMovie, description: e.target.value })}
                                placeholder="Sobre o que é este filme..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL da Capa (Vertical tipo DVD)</Label>
                            <Input
                                value={currentMovie.cover_url || ''}
                                onChange={e => setCurrentMovie({ ...currentMovie, cover_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL do Filme (Bunny Stream Direct/Embed)</Label>
                            <Input
                                value={currentMovie.video_url || ''}
                                onChange={e => setCurrentMovie({ ...currentMovie, video_url: e.target.value })}
                                placeholder="https://iframe.mediadelivery.net/play/..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duração</Label>
                                <Input
                                    value={currentMovie.duration || ''}
                                    onChange={e => setCurrentMovie({ ...currentMovie, duration: e.target.value })}
                                    placeholder="Ex: 1h 30m"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                {isCustomEditCategory ? (
                                    <div className="flex gap-2">
                                        <Input
                                            value={currentMovie.category}
                                            onChange={e => setCurrentMovie({ ...currentMovie, category: e.target.value })}
                                            placeholder="Digite a categoria..."
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => setIsCustomEditCategory(false)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Select
                                        value={currentMovie.category}
                                        onValueChange={(val) => {
                                            if (val === 'new_custom') {
                                                setIsCustomEditCategory(true);
                                                setCurrentMovie({ ...currentMovie, category: '' });
                                            } else {
                                                setCurrentMovie({ ...currentMovie, category: val });
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
                                            <SelectItem value="new_custom" className="text-indigo-600 font-bold">
                                                + Nova Categoria
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <Label>Disponível do Aplicativo?</Label>
                            <Switch
                                checked={currentMovie.is_active !== false}
                                onCheckedChange={checked => setCurrentMovie({ ...currentMovie, is_active: checked })}
                            />
                        </div>

                        <div className="space-y-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                            <h4 className="font-bold text-sm text-indigo-800 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Configurações de Gotejamento (Drip)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Dias para Liberar</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={currentMovie.unlock_delay_days || 0}
                                        onChange={e => setCurrentMovie({ ...currentMovie, unlock_delay_days: parseInt(e.target.value) || 0 })}
                                        className="bg-white"
                                    />
                                    <p className="text-[10px] text-slate-500">0 = Liberado imediatamente</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Missão Reabilitadora (Dia)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={currentMovie.required_mission_day || 0}
                                        onChange={e => setCurrentMovie({ ...currentMovie, required_mission_day: parseInt(e.target.value) || 0 })}
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

            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Alterar Categoria em Massa</DialogTitle>
                        <DialogDescription>
                            Isso atualizará a categoria de {selectedMovies.size} filmes selecionados.
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
                                        <SelectItem value="new_custom" className="text-indigo-600 font-bold">
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

            {/* Dialog de Importação do Bunny */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Importar Coleção Bunny.net</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-200">
                            <strong>Como funciona:</strong> Cole abaixo o ID da sua Coleção no Bunny.net. O sistema vai puxar todos os vídeos que estiverem lá, criar a Thumbnail, pegar o Título e o Link, e transformar tudo em Filmes individuais na galeria! (Sem afetar filmes antigos).
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
