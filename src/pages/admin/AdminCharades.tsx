import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Edit2, Trash2, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface CharadesCard {
    id: string;
    category: 'animals' | 'people' | 'objects' | 'fruits';
    text: string;
    is_special: boolean;
    special_action?: string;
    created_at: string;
}

const CATEGORIES = [
    { value: 'animals', label: 'Animais' },
    { value: 'people', label: 'Pessoas' },
    { value: 'objects', label: 'Objetos' },
    { value: 'fruits', label: 'Frutas' },
];

export function AdminCharades() {
    const [cards, setCards] = useState<CharadesCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CharadesCard | null>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<CharadesCard>>({
        category: 'animals',
        text: '',
        is_special: false,
        special_action: ''
    });

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('charades_cards')
            .select('*')
            .order('category')
            .order('text');

        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar cartas" });
        } else {
            setCards(data || []);
        }
        setLoading(false);
    };

    const handleOpenDialog = (card?: CharadesCard) => {
        if (card) {
            setEditingCard(card);
            setFormData({
                category: card.category,
                text: card.text,
                is_special: card.is_special,
                special_action: card.special_action || ''
            });
        } else {
            setEditingCard(null);
            setFormData({
                category: 'animals',
                text: '',
                is_special: false,
                special_action: ''
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.text || !formData.category) return;

        setSaving(true);
        try {
            const payload = {
                category: formData.category as 'animals' | 'people' | 'objects' | 'fruits',
                text: formData.text,
                is_special: formData.is_special,
                special_action: formData.is_special ? formData.special_action : null
            };

            if (editingCard) {
                const { error } = await supabase
                    .from('charades_cards')
                    .update(payload)
                    .eq('id', editingCard.id);
                if (error) throw error;
                toast({ title: "Carta atualizada com sucesso!" });
            } else {
                const { error } = await supabase
                    .from('charades_cards')
                    .insert(payload);
                if (error) throw error;
                toast({ title: "Carta adicionada com sucesso!" });
            }

            setIsDialogOpen(false);
            fetchCards();
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta palavra?')) return;

        try {
            const { error } = await supabase
                .from('charades_cards')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({ title: "Carta excluída!" });
            fetchCards();
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
        }
    };

    const filteredCards = cards.filter(card => {
        const matchesCategory = filterCategory === 'all' || card.category === filterCategory;
        const matchesSearch = card.text.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800">Opções do Jogo: Mímica</h2>
                    <p className="text-slate-500">Gerencie as palavras para o jogo "Quem Estou Imitando"</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Palavra
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar palavra..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="relative w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        className="w-full flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="all">Todas as Categorias</option>
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Palavra</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Especial?</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                </TableCell>
                            </TableRow>
                        ) : filteredCards.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                    Nenhuma palavra encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCards.map((card) => (
                                <TableRow key={card.id}>
                                    <TableCell>
                                        <span className="font-medium text-slate-700">{card.text}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                                            {CATEGORIES.find(c => c.value === card.category)?.label || card.category}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {card.is_special ? (
                                            <span className="text-xs font-semibold bg-rose-100 text-rose-600 px-2 py-1 rounded">Sim</span>
                                        ) : (
                                            <span className="text-xs text-slate-400">Não</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(card)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(card.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
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
                        <DialogTitle>{editingCard ? 'Editar Palavra' : 'Nova Palavra'}</DialogTitle>
                        <DialogDescription>
                            Configure a opção de imitação para o jogo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <select
                                className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Palavra para Imitar</Label>
                            <Input
                                placeholder="Ex: Maçã Verde"
                                value={formData.text}
                                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 mt-4">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Carta Especial (Desafio)?</Label>
                                <p className="text-xs text-slate-500">Se ativo, exibe um desafio extra ao acertar.</p>
                            </div>
                            <Switch
                                checked={formData.is_special || false}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_special: checked })}
                            />
                        </div>

                        {formData.is_special && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label>Qual é a ação/desafio especial?</Label>
                                <Input
                                    placeholder="Ex: Dê um abraço bem forte!"
                                    value={formData.special_action}
                                    onChange={(e) => setFormData({ ...formData, special_action: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving || !formData.text}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
