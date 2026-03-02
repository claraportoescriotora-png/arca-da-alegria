
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Target, ChevronRight, ArrowLeft, Trophy, Calendar, Pencil, Trash2, Clock, Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface MissionPack {
    id: string;
    title: string;
    description: string;
    cover_url: string;
    total_days: number;
    is_active: boolean;
    unlock_delay_days?: number;
}

interface Mission {
    id: string;
    pack_id: string;
    day_number: number;
    title: string;
    description: string;
    xp_reward: number;
    icon: string;
    linked_content_type?: 'story' | 'video' | 'game' | 'movie' | 'series' | null;
    linked_content_id?: string | null;
}

interface MissionTask {
    id: string;
    mission_id: string;
    description: string;
    xp_reward: number;
    order_index: number;
    linked_content_type?: 'story' | 'video' | 'game' | 'movie' | 'series' | null;
    linked_content_id?: string | null;
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
    const [isMissionComboboxOpen, setIsMissionComboboxOpen] = useState(false);

    // Task Level
    const [tasks, setTasks] = useState<MissionTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [selectedTasksMission, setSelectedTasksMission] = useState<Mission | null>(null);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [taskFormData, setTaskFormData] = useState<Partial<MissionTask>>({});
    const [isTaskComboboxOpen, setIsTaskComboboxOpen] = useState(false);

    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // Content for linking
    const [availableContent, setAvailableContent] = useState<{
        stories: { id: string, title: string }[];
        videos: { id: string, title: string }[];
        games: { id: string, title: string }[];
        movies: { id: string, title: string }[];
        series: { id: string, title: string }[];
    }>({ stories: [], videos: [], games: [], movies: [], series: [] });

    useEffect(() => {
        fetchPacks();
    }, []);

    useEffect(() => {
        if (selectedPack) {
            fetchMissions(selectedPack.id);
        }
    }, [selectedPack]);

    useEffect(() => {
        if (isMissionDialogOpen || isTaskDialogOpen) {
            fetchAvailableContent();
        }
    }, [isMissionDialogOpen, isTaskDialogOpen]);

    useEffect(() => {
        if (selectedTasksMission) {
            fetchTasks(selectedTasksMission.id);
        }
    }, [selectedTasksMission]);

    const fetchAvailableContent = async () => {
        const [storiesRes, videosRes, gamesRes, moviesRes, seriesRes] = await Promise.all([
            supabase.from('stories').select('id, title').order('title'),
            supabase.from('videos').select('id, title').order('title'),
            supabase.from('games').select('id, title').order('title'),
            supabase.from('movies').select('id, title').order('title'),
            supabase.from('series').select('id, title').order('title')
        ]);

        setAvailableContent({
            stories: storiesRes.data || [],
            videos: videosRes.data || [],
            games: gamesRes.data || [],
            movies: moviesRes.data || [],
            series: seriesRes.data || []
        });
    };

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
                cover_url: packFormData.cover_url,
                total_days: packFormData.total_days || 30,
                unlock_delay_days: Number(packFormData.unlock_delay_days || 0),
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
                icon: missionFormData.icon || 'star',
                linked_content_type: missionFormData.linked_content_type || null,
                linked_content_id: missionFormData.linked_content_id || null
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

    // --- Tasks Logic ---
    const fetchTasks = async (missionId: string) => {
        setLoadingTasks(true);
        const { data, error } = await supabase
            .from('mission_tasks')
            .select('*')
            .eq('mission_id', missionId)
            .order('order_index', { ascending: true });

        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar tarefas" });
        } else {
            setTasks(data || []);
        }
        setLoadingTasks(false);
    };

    const handleSaveTask = async () => {
        if (!selectedTasksMission) return;
        setSaving(true);
        try {
            const dataToSave = {
                mission_id: selectedTasksMission.id,
                description: taskFormData.description,
                xp_reward: taskFormData.xp_reward || 10,
                order_index: taskFormData.order_index || (tasks.length + 1),
                linked_content_type: taskFormData.linked_content_type || null,
                linked_content_id: taskFormData.linked_content_id || null
            };

            let error;
            if (taskFormData.id) {
                const { error: err } = await supabase.from('mission_tasks').update(dataToSave).eq('id', taskFormData.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('mission_tasks').insert(dataToSave);
                error = err;
            }

            if (error) throw error;

            toast({ title: "Tarefa salva!" });
            setTaskFormData({});
            fetchTasks(selectedTasksMission.id);
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm("Excluir esta tarefa permanentemente?")) return;
        const { error } = await supabase.from('mission_tasks').delete().eq('id', id);
        if (error) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
        } else {
            if (selectedTasksMission) fetchTasks(selectedTasksMission.id);
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
                                                <Button variant="outline" size="sm" onClick={() => {
                                                    setSelectedTasksMission(mission);
                                                    setIsTaskDialogOpen(true);
                                                }}>
                                                    Tarefas
                                                </Button>
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

                            <hr className="border-slate-100" />

                            <div className="space-y-4">
                                <Label className="text-slate-900 font-bold block mb-2">Linkar Conteúdo Interno (Opcional)</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tipo de Conteúdo</Label>
                                        <Select
                                            value={missionFormData.linked_content_type || 'none'}
                                            onValueChange={(val) => setMissionFormData({
                                                ...missionFormData,
                                                linked_content_type: val === 'none' ? null : val as any,
                                                linked_content_id: null
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum (Apenas Texto)</SelectItem>
                                                <SelectItem value="story">História</SelectItem>
                                                <SelectItem value="video">Vídeo</SelectItem>
                                                <SelectItem value="game">Jogo</SelectItem>
                                                <SelectItem value="movie">Filme</SelectItem>
                                                <SelectItem value="series">Série</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {missionFormData.linked_content_type && (
                                        <div className="space-y-2">
                                            <Label>Selecionar Item</Label>
                                            {(() => {
                                                const getOptions = () => {
                                                    switch (missionFormData.linked_content_type) {
                                                        case 'story': return availableContent.stories;
                                                        case 'video': return availableContent.videos;
                                                        case 'game': return availableContent.games;
                                                        case 'movie': return availableContent.movies;
                                                        case 'series': return availableContent.series;
                                                        default: return [];
                                                    }
                                                };
                                                const options = getOptions();
                                                const selectedOption = options.find(opt => opt.id === missionFormData.linked_content_id);

                                                return (
                                                    <Popover open={isMissionComboboxOpen} onOpenChange={setIsMissionComboboxOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={isMissionComboboxOpen}
                                                                className="w-full justify-between font-normal"
                                                            >
                                                                <span className="truncate">
                                                                    {selectedOption ? selectedOption.title : "Escolha o conteúdo..."}
                                                                </span>
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[400px] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Pesquisar..." />
                                                                <CommandList>
                                                                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {options.map((item) => (
                                                                            <CommandItem
                                                                                key={item.id}
                                                                                value={item.title}
                                                                                onSelect={() => {
                                                                                    setMissionFormData({ ...missionFormData, linked_content_id: item.id });
                                                                                    setIsMissionComboboxOpen(false);
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4 shrink-0",
                                                                                        missionFormData.linked_content_id === item.id ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {item.title}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400">Ao linkar um conteúdo, o app exibirá um botão de ação direta para o usuário.</p>
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

                {/* Sub-Tasks Dialog */}
                <Dialog open={isTaskDialogOpen} onOpenChange={(open) => {
                    if (!open) setSelectedTasksMission(null);
                    setIsTaskDialogOpen(open);
                }}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Gerenciar Tarefas - {selectedTasksMission?.title}</DialogTitle>
                            <DialogDescription>Tarefas que os usuários precisam fazer para completar esta missão (Dia).</DialogDescription>
                        </DialogHeader>

                        {/* Create/Edit Task Form */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4">
                            <h4 className="font-bold text-slate-700">{taskFormData.id ? 'Editar Tarefa' : 'Adicionar Nova Tarefa'}</h4>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Ordem</Label>
                                    <Input
                                        type="number"
                                        value={taskFormData.order_index || ''}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, order_index: parseInt(e.target.value) })}
                                        placeholder="Ex: 1"
                                    />
                                </div>
                                <div className="col-span-8 space-y-1">
                                    <Label className="text-xs">Descrição da Tarefa</Label>
                                    <Input
                                        value={taskFormData.description || ''}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                                        placeholder="Ex: Fazer uma oração de agradecimento"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Recompensa (XP)</Label>
                                    <Input
                                        type="number"
                                        value={taskFormData.xp_reward || ''}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, xp_reward: parseInt(e.target.value) })}
                                        placeholder="Ex: 20"
                                    />
                                </div>
                            </div>

                            {/* Linked Content for Tasks */}
                            <div className="pt-2 border-t border-slate-200">
                                <Label className="text-xs font-bold text-slate-700 block mb-2">Ação Especial (Opcional)</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Tipo de Conteúdo</Label>
                                        <Select
                                            value={taskFormData.linked_content_type || 'none'}
                                            onValueChange={(val) => setTaskFormData({
                                                ...taskFormData,
                                                linked_content_type: val === 'none' ? null : val as any,
                                                linked_content_id: null
                                            })}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum (Apenas Texto)</SelectItem>
                                                <SelectItem value="story">História Bíblica</SelectItem>
                                                <SelectItem value="video">Vídeo Musical</SelectItem>
                                                <SelectItem value="game">Mini-Jogo</SelectItem>
                                                <SelectItem value="movie">Filme</SelectItem>
                                                <SelectItem value="series">Série</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {taskFormData.linked_content_type && (
                                        <div className="space-y-1">
                                            <Label className="text-xs">Selecionar Item</Label>
                                            {(() => {
                                                const getOptions = () => {
                                                    switch (taskFormData.linked_content_type) {
                                                        case 'story': return availableContent.stories;
                                                        case 'video': return availableContent.videos;
                                                        case 'game': return availableContent.games;
                                                        case 'movie': return availableContent.movies;
                                                        case 'series': return availableContent.series;
                                                        default: return [];
                                                    }
                                                };
                                                const options = getOptions();
                                                const selectedOption = options.find(opt => opt.id === taskFormData.linked_content_id);

                                                return (
                                                    <Popover open={isTaskComboboxOpen} onOpenChange={setIsTaskComboboxOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={isTaskComboboxOpen}
                                                                className="w-full justify-between h-8 text-xs font-normal"
                                                            >
                                                                <span className="truncate">
                                                                    {selectedOption ? selectedOption.title : "Escolha..."}
                                                                </span>
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[300px] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Pesquisar..." className="text-xs h-8" />
                                                                <CommandList>
                                                                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {options.map((item) => (
                                                                            <CommandItem
                                                                                key={item.id}
                                                                                value={item.title}
                                                                                onSelect={() => {
                                                                                    setTaskFormData({ ...taskFormData, linked_content_id: item.id });
                                                                                    setIsTaskComboboxOpen(false);
                                                                                }}
                                                                                className="text-xs"
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-3 w-3 shrink-0",
                                                                                        taskFormData.linked_content_id === item.id ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {item.title}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {taskFormData.id && (
                                    <Button variant="ghost" onClick={() => setTaskFormData({})} size="sm">Cancelar Edição</Button>
                                )}
                                <Button onClick={handleSaveTask} disabled={saving || !taskFormData.description} size="sm">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {taskFormData.id ? 'Atualizar Tarefa' : 'Adicionar Tarefa'}
                                </Button>
                            </div>
                        </div>

                        {/* Tasks List */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-100">
                                    <TableRow>
                                        <TableHead className="w-16">Ordem</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>XP</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingTasks ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-20 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" /></TableCell>
                                        </TableRow>
                                    ) : tasks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-20 text-center text-slate-500 text-sm">Nenhuma tarefa criada para este dia ainda.</TableCell>
                                        </TableRow>
                                    ) : (
                                        tasks.map(task => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-bold text-slate-500 text-center">{task.order_index}</TableCell>
                                                <TableCell>{task.description}</TableCell>
                                                <TableCell><span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full text-xs font-bold">+{task.xp_reward}XP</span></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setTaskFormData(task)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
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
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={packFormData.is_active ?? true}
                                    onCheckedChange={(checked) => setPackFormData({ ...packFormData, is_active: checked })}
                                />
                                <Label>Ativo</Label>
                            </div>
                        </div>

                        <div className="space-y-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <Label className="text-blue-800 font-bold flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Dias para Liberar (Gotejamento)
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                value={packFormData.unlock_delay_days || 0}
                                onChange={(e) => setPackFormData({ ...packFormData, unlock_delay_days: parseInt(e.target.value) || 0 })}
                                placeholder="0 = Imediato"
                                className="bg-white"
                            />
                            <p className="text-[10px] text-slate-500">Número de dias após o cadastro do usuário para liberar esta jornada.</p>
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
