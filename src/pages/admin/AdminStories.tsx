import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Story {
    id: string;
    title: string;
    cover_url: string;
    audio_url: string;
    duration: string;
    category: string;
    is_premium: boolean;
    created_at: string;
}

export function AdminStories() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentStory, setCurrentStory] = useState<Partial<Story>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar histórias" });
        } else {
            setStories(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            if (isEditing && currentStory.id) {
                const { error } = await supabase
                    .from('stories')
                    .update({
                        title: currentStory.title,
                        cover_url: currentStory.cover_url,
                        audio_url: currentStory.audio_url,
                        duration: currentStory.duration,
                        category: currentStory.category,
                        is_premium: currentStory.is_premium
                    })
                    .eq('id', currentStory.id);
                if (error) throw error;
                toast({ title: "História atualizada com sucesso!" });
            } else {
                const { error } = await supabase
                    .from('stories')
                    .insert([{
                        title: currentStory.title,
                        cover_url: currentStory.cover_url,
                        audio_url: currentStory.audio_url,
                        duration: currentStory.duration,
                        category: currentStory.category,
                        is_premium: currentStory.is_premium || false
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

    const openNew = () => {
        setCurrentStory({ category: 'biblical', is_premium: false });
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
                <div className="p-4 border-b border-slate-100 flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar história..."
                            className="pl-10 bg-slate-50 border-slate-200"
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
                            <TableHead>Duração</TableHead>
                            <TableHead>Premium</TableHead>
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
                            filteredStories.map((story) => (
                                <TableRow key={story.id}>
                                    <TableCell>
                                        <img src={story.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700">{story.title}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                            {story.category === 'biblical' ? 'Bíblica' : 'Moral'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{story.duration}</TableCell>
                                    <TableCell>
                                        {story.is_premium ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Premium</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Grátis</span>
                                        )}
                                    </TableCell>
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
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <Label>Conteúdo Premium (Cadeado)?</Label>
                            <Switch
                                checked={currentStory.is_premium || false}
                                onCheckedChange={checked => setCurrentStory({ ...currentStory, is_premium: checked })}
                            />
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
