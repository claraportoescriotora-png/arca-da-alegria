
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Target, ChevronRight, ArrowLeft, Trophy, Calendar, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface MissionPack {
    id: string;
    title: string;
    description: string;
    cover_url: string;
    total_days: number;
    is_active: boolean;
}

interface Mission {
    id: string;
    pack_id: string;
    day_number: number;
    title: string;
    description: string;
    xp_reward: number;
    icon: string;
}

export function AdminMissions() {
    // Top Level: Packs
    const [packs, setPacks] = useState<MissionPack[]>([]);
    const [loadingPacks, setLoadingPacks] = useState(true);
    const [selectedPack, setSelectedPack] = useState<MissionPack | null>(null);

    // Detail Level: Missions (Days)
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loadingMissions, setLoadingMissions] = useState(false);

    // Dialogs
    const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);
    const [packFormData, setPackFormData] = useState<Partial<MissionPack>>({});

    const [isMissionDialogOpen, setIsMissionDialogOpen] = useState(false);
    const [missionFormData, setMissionFormData] = useState<Partial<Mission>>({});

    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchPacks();
    }, []);

    useEffect(() => {
        if (selectedPack) {
            fetchMissions(selectedPack.id);
        }
    }, [selectedPack]);

    // --- Packs Logic ---

    const fetchPacks = async () => {
        setLoadingPacks(true);
        const { data, error } = await supabase
            .from('mission_packs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar pacotes" });
        } else {
            setPacks(data || []);
        }
        setLoadingPacks(false);
    };

    const handleSavePack = async () => {
        setSaving(true);
        try {
            const dataToSave = {
                title: packFormData.title,
                description: packFormData.description,
                image_url: packFormData.cover_url, // Note: SQL uses cover_url but content_expansion uses cover_url? Let's check schema. using cover_url based on missions_expansion.sql
                cover_url: packFormData.cover_url,
                total_days: packFormData.total_days || 30,
                is_active: packFormData.is_active ?? true
            };

            let error;
            if (packFormData.id) {
                const { error: err } = await supabase.from('mission_packs').update(dataToSave).eq('id', packFormData.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('mission_packs').insert(dataToSave);
                error = err;
            }

            if (error) throw error;

            toast({ title: "Pacote salvo com sucesso!" });
            setIsPackDialogOpen(false);
            fetchPacks();
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePack = async (id: string) => {
        if (!confirm("Tem certeza? Todas as missões deste pacote serão apagadas.")) return;

        const { error } = await supabase.from('mission_packs').delete().eq('id', id);
        if (error) {
            toast({ variant: "destructive", title: "Erro ao deletar", description: error.message });
        } else {
            toast({ title: "Pacote removido" });
            fetchPacks();
            if (selectedPack?.id === id) setSelectedPack(null);
        }
    };

    // --- Missions Logic ---

    const fetchMissions = async (packId: string) => {
        setLoadingMissions(true);
        const { data, error } = await supabase
            .from('missions')
            .select('*')
            .eq('pack_id', packId)
            .order('day_number', { ascending: true });

        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar missões" });
        } else {
            setMissions(data || []);
        }
        setLoadingMissions(false);
    };

    const handleSaveMission = async () => {
        if (!selectedPack) return;
        setSaving(true);
        try {
            const dataToSave = {
                pack_id: selectedPack.id,
                day_number: missionFormData.day_number,
                title: missionFormData.title,
                description: missionFormData.description,
                xp_reward: missionFormData.xp_reward || 50,
                icon: missionFormData.icon || 'star'
            };

            let error;
            if (missionFormData.id) {
                const { error: err } = await supabase.from('missions').update(dataToSave).eq('id', missionFormData.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('missions').insert(dataToSave);
                error = err;
            }

            if (error) throw error;

            toast({ title: "Missão salva com sucesso!" });
            setIsMissionDialogOpen(false);
            fetchMissions(selectedPack.id);
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMission = async (id: string) => {
        if (!confirm("Tem certeza que deseja apagar esta missão?")) return;
        const { error } = await supabase.from('missions').delete().eq('id', id);
        if (error) {
            toast({ variant: "destructive", title: "Erro ao deletar" });
        } else {
            if (selectedPack) fetchMissions(selectedPack.id);
        }
    };

    // --- Render ---

    if (selectedPack) {
        return (
            <div>
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedPack(null)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold font-fredoka text-slate-800 flex items-center gap-2">
                            <Target className="w-6 h-6 text-blue-500" />
                            {selectedPack.title}
                        </h2>
                        <p className="text-slate-500">Gerenciando missões diárias deste pacote.</p>
                    </div>
                    <Button onClick={() => {
                        setMissionFormData({ day_number: (missions.length || 0) + 1, xp_reward: 50 });
                        setIsMissionDialogOpen(true);
                    }} className="ml-auto bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Missão (Dia)
                    </Button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-20">Dia</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>XP</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingMissions ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                missions.map((mission) => (
                                    <TableRow key={mission.id}>
                                        <TableCell className="font-bold text-center bg-slate-50">#{mission.day_number}</TableCell>
                                        <TableCell className="font-medium">{mission.title}</TableCell>
                                        <TableCell className="text-slate-500 truncate max-w-xs">{mission.description}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-bold">
                                                <Trophy className="w-3 h-3 mr-1" />
                                                {mission.xp_reward} XP
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setMissionFormData(mission);
                                                    setIsMissionDialogOpen(true);
                                                }}>
                                                    <Pencil className="w-4 h-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteMission(mission.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!loadingMissions && missions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        Nenhuma missão cadastrada neste pacote.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mission Dialog */}
                <Dialog open={isMissionDialogOpen} onOpenChange={setIsMissionDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{missionFormData.id ? 'Editar Missão' : 'Nova Missão'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1 space-y-2">
                                    <Label>Dia #</Label>
                                    <Input
                                        type="number"
                                        value={missionFormData.day_number || ''}
                                        onChange={(e) => setMissionFormData({ ...missionFormData, day_number: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <Label>Título</Label>
                                    <Input
                                        value={missionFormData.title || ''}
                                        onChange={(e) => setMissionFormData({ ...missionFormData, title: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                    value={missionFormData.description || ''}
                                    onChange={(e) => setMissionFormData({ ...missionFormData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>XP Recompensa</Label>
                                    <Input
                                        type="number"
                                        value={missionFormData.xp_reward || 50}
                                        onChange={(e) => setMissionFormData({ ...missionFormData, xp_reward: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ícone (Lucide Name)</Label>
                                    <Input
                                        value={missionFormData.icon || 'star'}
                                        onChange={(e) => setMissionFormData({ ...missionFormData, icon: e.target.value })}
                                        placeholder="Ex: star, heart, book"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsMissionDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveMission} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Default View: List Packs
    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800">Gerenciar Missões</h2>
                    <p className="text-slate-500">Crie pacotes de missões e desafios diários.</p>
                </div>
                <Button onClick={() => {
                    setPackFormData({});
                    setIsPackDialogOpen(true);
                }} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Pacote
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packs.map((pack) => (
                    <div key={pack.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative">
                        <div className="aspect-video bg-slate-100 relative">
                            {pack.cover_url ? (
                                <img src={pack.cover_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300">
                                    <Target className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${pack.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {pack.is_active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            <h3 className="font-bold text-lg text-slate-800 mb-1">{pack.title}</h3>
                            <p className="text-slate-500 text-sm mb-4 line-clamp-2">{pack.description}</p>

                            <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {pack.total_days} Dias
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button className="flex-1 w-full" variant="outline" onClick={() => {
                                    setPackFormData(pack);
                                    setIsPackDialogOpen(true);
                                }}>
                                    Editar
                                </Button>
                                <Button className="flex-1 w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200" onClick={() => setSelectedPack(pack)}>
                                    Missões
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>

                            <button
                                onClick={() => handleDeletePack(pack.id)}
                                className="absolute top-2 left-2 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pack Dialog */}
            <Dialog open={isPackDialogOpen} onOpenChange={setIsPackDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{packFormData.id ? 'Editar Pacote' : 'Novo Pacote de Missões'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                                value={packFormData.title || ''}
                                onChange={(e) => setPackFormData({ ...packFormData, title: e.target.value })}
                                placeholder="Ex: Mês da Vitória"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                                value={packFormData.description || ''}
                                onChange={(e) => setPackFormData({ ...packFormData, description: e.target.value })}
                                placeholder="Descrição do desafio..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL da Capa</Label>
                            <Input
                                value={packFormData.cover_url || ''}
                                onChange={(e) => setPackFormData({ ...packFormData, cover_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Total de Dias</Label>
                                <Input
                                    type="number"
                                    value={packFormData.total_days || 30}
                                    onChange={(e) => setPackFormData({ ...packFormData, total_days: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Switch
                                    checked={packFormData.is_active ?? true}
                                    onCheckedChange={(checked) => setPackFormData({ ...packFormData, is_active: checked })}
                                />
                                <Label>Ativo</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPackDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSavePack} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
