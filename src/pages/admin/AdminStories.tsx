import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Search, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Story {
    id: string;
    title: string;
    cover_url: string;
    audio_url: string;
    duration: string;
    category: string;
    content: string;
    created_at: string;
    unlock_delay_days?: number;
    required_mission_day?: number;
}

export function AdminStories() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalStories, setTotalStories] = useState(0);
    const [pageSize] = useState(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { toast } = useToast();

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentStory, setCurrentStory] = useState<Partial<Story>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStories();
    }, [page]);

    // Simple debounce for search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) fetchStories();
            else setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchStories = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('stories')
                .select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.ilike('title', `%${searchTerm}%`);
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            setStories(data || []);
            setTotalStories(count || 0);
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar histórias" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            if (isEditing && currentStory.id) {
                const { error } = await supabase
                    .from('stories')
                    .update({
                        title: currentStory.title,
                        content: currentStory.content,
                        cover_url: currentStory.cover_url,
                        audio_url: currentStory.audio_url,
                        duration: currentStory.duration,
                        category: currentStory.category,
                        unlock_delay_days: Number(currentStory.unlock_delay_days || 0),
                        required_mission_day: Number(currentStory.required_mission_day || 0)
                    })
                    .eq('id', currentStory.id);
                if (error) throw error;
                toast({ title: "História atualizada com sucesso!" });
            } else {
                const { error } = await supabase
                    .from('stories')
                    .insert([{
                        title: currentStory.title,
                        content: currentStory.content || '',
                        cover_url: currentStory.cover_url,
                        audio_url: currentStory.audio_url,
                        duration: currentStory.duration,
                        category: currentStory.category,
                        unlock_delay_days: Number(currentStory.unlock_delay_days || 0),
                        required_mission_day: Number(currentStory.required_mission_day || 0)
                    }]);
                if (error) throw error;
                toast({ title: "História criada com sucesso!" });
            }
            setIsDialogOpen(false);
            fetchStories();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta história?")) return;

        try {
            const { error } = await supabase.from('stories').delete().eq('id', id);
            if (error) throw error;
            toast({ title: "História excluída" });
            fetchStories();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} histórias?`)) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('stories').delete().in('id', selectedIds);
            if (error) throw error;
            toast({ title: `${selectedIds.length} histórias excluídas com sucesso!` });
            setSelectedIds([]);
            fetchStories();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro na exclusão em massa", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === stories.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(stories.map(s => s.id));
        }
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const openNew = () => {
        setCurrentStory({
            category: 'biblical',
            content: '',
            cover_url: "https://minha-zona-amiguito.b-cdn.net/Hist%C3%B3rias/historias%20biblicas.webp",
            // is_premium: false // This property is not defined in the Story interface
        });
        setIsEditing(false);
        setIsDialogOpen(true);
    };

    const openEdit = (story: Story) => {
        setCurrentStory(story);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const filteredStories = stories.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800">Gerenciar Histórias</h2>
                    <p className="text-slate-500">Adicione e edite as histórias do app.</p>
                </div>
                <Button onClick={openNew} className="bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova História
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar história pelo título..."
                            className="pl-10 bg-white border-slate-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                            <span className="text-sm font-medium text-slate-600">
                                {selectedIds.length} selecionadas
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="h-9"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir em Massa
                            </Button>
                        </div>
                    )}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedIds.length === stories.length && stories.length > 0}
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
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                </TableCell>
                            </TableRow>
                        ) : filteredStories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    Nenhuma história encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            stories.map((story) => (
                                <TableRow key={story.id} className={selectedIds.includes(story.id) ? "bg-blue-50/30" : ""}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(story.id)}
                                            onCheckedChange={() => toggleSelectOne(story.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <img
                                            src={story.cover_url || "https://minha-zona-amiguito.b-cdn.net/Hist%C3%B3rias/historias%20biblicas.webp"}
                                            alt={story.title}
                                            className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700">{story.title}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                            {story.category === 'biblical' ? 'Bíblica' : 'Moral'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{story.duration}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(story)}>
                                                <Pencil className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(story.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <p className="text-sm text-slate-500">
                        Mostrando <b>{stories.length}</b> de <b>{totalStories}</b> histórias
                    </p>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            <PaginationItem>
                                <span className="text-sm px-4">Página {page}</span>
                            </PaginationItem>

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setPage(p => p + 1)}
                                    className={page * pageSize >= totalStories ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar História' : 'Nova História'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                                value={currentStory.title || ''}
                                onChange={e => setCurrentStory({ ...currentStory, title: e.target.value })}
                                placeholder="Ex: Daniel na Cova dos Leões"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL da Capa (Imagem)</Label>
                            <Input
                                value={currentStory.cover_url || ''}
                                onChange={e => setCurrentStory({ ...currentStory, cover_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL do Áudio (MP3)</Label>
                            <Input
                                value={currentStory.audio_url || ''}
                                onChange={e => setCurrentStory({ ...currentStory, audio_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duração</Label>
                                <Input
                                    value={currentStory.duration || ''}
                                    onChange={e => setCurrentStory({ ...currentStory, duration: e.target.value })}
                                    placeholder="Ex: 5 min"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select
                                    value={currentStory.category}
                                    onValueChange={(val) => setCurrentStory({ ...currentStory, category: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="biblical">Bíblica</SelectItem>
                                        <SelectItem value="moral">Moral / Educativa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Conteúdo da História</Label>
                            <Textarea
                                value={currentStory.content || ''}
                                onChange={e => setCurrentStory({ ...currentStory, content: e.target.value })}
                                placeholder="Era uma vez..."
                                className="min-h-[200px] font-sans"
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
                                        value={currentStory.unlock_delay_days || 0}
                                        onChange={e => setCurrentStory({ ...currentStory, unlock_delay_days: parseInt(e.target.value) || 0 })}
                                        className="bg-white"
                                    />
                                    <p className="text-[10px] text-slate-500">0 = Liberado imediatamente</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Missão Obrigatória (Dia)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={currentStory.required_mission_day || 0}
                                        onChange={e => setCurrentStory({ ...currentStory, required_mission_day: parseInt(e.target.value) || 0 })}
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
        </div>
    );
}
