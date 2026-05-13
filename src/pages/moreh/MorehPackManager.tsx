import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Target, ArrowLeft, Trophy, Pencil, Trash2, Check, ChevronRight, Clock, Camera, Star, Link } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface Child { id: string; name: string; }
interface MissionPack {
  id: string; title: string; description: string; cover_url: string;
  total_days: number; is_active: boolean; start_date: string | null; child_id: string | null;
}
interface Mission {
  id: string; pack_id: string; day_number: number; title: string;
  description: string; xp_reward: number; icon: string;
  linked_content_type?: string | null; linked_content_id?: string | null;
}
interface MissionTask {
  id: string; mission_id: string; description: string;
  xp_reward: number; order_index: number;
  requires_photo: boolean; is_mandatory: boolean; schedule_time?: string | null;
  linked_content_type?: string | null; linked_content_id?: string | null;
}
type ContentType = 'story' | 'video' | 'game' | 'movie' | 'series';
interface ContentItem { id: string; title: string; is_premium?: boolean; }

export default function MorehPackManager() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const { toast } = useToast();
  const userId = session?.user?.id ?? null;
  const isPremium = profile?.plan_type === 'family_pass' || profile?.subscription_status === 'active';

  const [children, setChildren] = useState<Child[]>([]);
  const [packs, setPacks] = useState<MissionPack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [selectedPack, setSelectedPack] = useState<MissionPack | null>(null);

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [selectedTasksMission, setSelectedTasksMission] = useState<Mission | null>(null);
  const [tasks, setTasks] = useState<MissionTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);
  const [packForm, setPackForm] = useState<Partial<MissionPack>>({});
  const [isMissionDialogOpen, setIsMissionDialogOpen] = useState(false);
  const [missionForm, setMissionForm] = useState<Partial<Mission>>({});
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<Partial<MissionTask>>({ requires_photo: false, is_mandatory: true });
  const [saving, setSaving] = useState(false);
  const [contentCategory, setContentCategory] = useState<ContentType>('video');
  const [availableContent, setAvailableContent] = useState<Record<ContentType, ContentItem[]>>({
    story: [], video: [], game: [], movie: [], series: []
  });
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => { if (userId) { fetchChildren(); fetchPacks(); } }, [userId]);
  useEffect(() => { if (selectedPack) fetchMissions(selectedPack.id); }, [selectedPack]);
  useEffect(() => { if (selectedTasksMission) { fetchTasks(selectedTasksMission.id); fetchContent(); } }, [selectedTasksMission]);
  useEffect(() => { fetchContent(); }, [contentCategory]);

  const fetchChildren = async () => {
    const { data } = await supabase.from('children').select('id, name').order('created_at');
    setChildren(data || []);
  };

  const fetchPacks = async () => {
    if (!userId) return;
    setLoadingPacks(true);
    const { data, error } = await supabase
      .from('mission_packs').select('*')
      .eq('user_id', userId) // Only parent's own packs
      .order('created_at', { ascending: false });
    if (error) toast({ variant: "destructive", title: "Erro ao carregar trilhas" });
    else setPacks(data || []);
    setLoadingPacks(false);
  };

  const fetchMissions = async (packId: string) => {
    setLoadingMissions(true);
    const { data } = await supabase.from('missions').select('*').eq('pack_id', packId).order('day_number');
    setMissions(data || []);
    setLoadingMissions(false);
  };

  const fetchTasks = async (missionId: string) => {
    setLoadingTasks(true);
    const { data } = await supabase.from('mission_tasks').select('*').eq('mission_id', missionId).order('order_index');
    setTasks(data || []);
    setLoadingTasks(false);
  };

  const fetchContent = async () => {
    setLoadingContent(true);
    const tableMap: Record<ContentType, string> = { story: 'stories', video: 'videos', game: 'games', movie: 'movies', series: 'series' };
    const table = tableMap[contentCategory];
    const { data } = await supabase.from(table).select('id, title, is_premium').order('title');
    setAvailableContent(prev => ({ ...prev, [contentCategory]: data || [] }));
    setLoadingContent(false);
  };

  // --- Pack CRUD ---
  const handleSavePack = async () => {
    if (!userId || !packForm.title?.trim()) {
      toast({ variant: "destructive", title: "Preencha o título da trilha." }); return;
    }
    setSaving(true);
    try {
      const payload = {
        title: packForm.title, description: packForm.description || '',
        cover_url: packForm.cover_url || '', total_days: packForm.total_days || 1,
        is_active: packForm.is_active ?? true,
        start_date: packForm.start_date || null,
        child_id: packForm.child_id || null,
        user_id: userId, // Always set owner
      };
      if (packForm.id) {
        const { error } = await supabase.from('mission_packs').update(payload).eq('id', packForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mission_packs').insert(payload);
        if (error) throw error;
      }
      toast({ title: "Trilha salva!" });
      setIsPackDialogOpen(false);
      fetchPacks();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: e.message });
    } finally { setSaving(false); }
  };

  const handleDeletePack = async (id: string) => {
    if (!confirm("Apagar esta trilha e todos os seus dias e tarefas?")) return;
    const { error } = await supabase.from('mission_packs').delete().eq('id', id);
    if (error) toast({ variant: "destructive", title: "Erro ao deletar" });
    else { fetchPacks(); if (selectedPack?.id === id) setSelectedPack(null); }
  };

  // --- Mission (Day) CRUD ---
  const handleSaveMission = async () => {
    if (!selectedPack) return;
    setSaving(true);
    try {
      const payload = {
        pack_id: selectedPack.id, day_number: missionForm.day_number || 1,
        title: missionForm.title || '', description: missionForm.description || '',
        xp_reward: missionForm.xp_reward || 50, icon: missionForm.icon || 'star',
        linked_content_type: missionForm.linked_content_type || null,
        linked_content_id: missionForm.linked_content_id || null,
      };
      if (missionForm.id) {
        await supabase.from('missions').update(payload).eq('id', missionForm.id);
      } else {
        await supabase.from('missions').insert(payload);
      }
      toast({ title: "Dia salvo!" });
      setIsMissionDialogOpen(false);
      fetchMissions(selectedPack.id);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    } finally { setSaving(false); }
  };

  const handleDeleteMission = async (id: string) => {
    if (!confirm("Apagar este dia e suas tarefas?")) return;
    await supabase.from('missions').delete().eq('id', id);
    if (selectedPack) fetchMissions(selectedPack.id);
  };

  // --- Task CRUD ---
  const handleSaveTask = async () => {
    if (!selectedTasksMission || !taskForm.description?.trim()) return;
    setSaving(true);
    try {
      const payload = {
        mission_id: selectedTasksMission.id,
        description: taskForm.description,
        xp_reward: taskForm.xp_reward || 10,
        order_index: taskForm.order_index || (tasks.length + 1),
        requires_photo: taskForm.requires_photo ?? false,
        is_mandatory: taskForm.is_mandatory ?? true,
        schedule_time: taskForm.schedule_time || null,
        linked_content_type: taskForm.linked_content_type || null,
        linked_content_id: taskForm.linked_content_id || null,
      };
      if (taskForm.id) {
        await supabase.from('mission_tasks').update(payload).eq('id', taskForm.id);
      } else {
        await supabase.from('mission_tasks').insert(payload);
      }
      toast({ title: "Tarefa salva!" });
      setTaskForm({ requires_photo: false, is_mandatory: true });
      fetchTasks(selectedTasksMission.id);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    } finally { setSaving(false); }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    await supabase.from('mission_tasks').delete().eq('id', id);
    if (selectedTasksMission) fetchTasks(selectedTasksMission.id);
  };

  // ===================== RENDER =====================

  // VIEW: Task list for a day
  if (selectedTasksMission) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
          <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedTasksMission(null)}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="font-fredoka text-xl font-bold">Tarefas — Dia {selectedTasksMission.day_number}</h1>
              <p className="text-sm text-muted-foreground">{selectedTasksMission.title}</p>
            </div>
          </div>
        </header>
        <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Add/Edit Task Form */}
          <div className="bg-card p-4 rounded-2xl border border-border space-y-4">
            <h3 className="font-bold">{taskForm.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>

            {/* Basic fields */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Ordem</Label>
                <Input type="number" value={taskForm.order_index || ''} onChange={e => setTaskForm({ ...taskForm, order_index: +e.target.value })} placeholder="1" />
              </div>
              <div className="col-span-7 space-y-1">
                <Label className="text-xs">Descrição da Tarefa *</Label>
                <Input value={taskForm.description || ''} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Ex: Orar de manhã" />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">XP</Label>
                <Input type="number" value={taskForm.xp_reward || ''} onChange={e => setTaskForm({ ...taskForm, xp_reward: +e.target.value })} placeholder="10" />
              </div>
            </div>

            {/* Toggles row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> Exige Foto/Vídeo</p>
                  <p className="text-xs text-muted-foreground">Abre câmera no check-in</p>
                </div>
                <Switch checked={taskForm.requires_photo ?? false} onCheckedChange={v => setTaskForm({ ...taskForm, requires_photo: v })} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Essencial</p>
                  <p className="text-xs text-muted-foreground">Conta para a meta diária</p>
                </div>
                <Switch checked={taskForm.is_mandatory ?? true} onCheckedChange={v => setTaskForm({ ...taskForm, is_mandatory: v })} />
              </div>
            </div>

            {/* Schedule time */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Horário do Lembrete (opcional)</Label>
              <Input type="time" value={taskForm.schedule_time || ''} onChange={e => setTaskForm({ ...taskForm, schedule_time: e.target.value || null })} className="w-48" />
            </div>

            {/* Content link */}
            <div className="space-y-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <Label className="text-xs font-semibold flex items-center gap-1"><Link className="w-3.5 h-3.5" /> Conectar Conteúdo Nativo (opcional)</Label>
              <p className="text-xs text-muted-foreground">O filho verá um botão de atalho direto para o conteúdo.</p>
              <div className="flex gap-2 flex-wrap">
                {(['video','story','game','movie','series'] as ContentType[]).map(cat => (
                  <button key={cat} onClick={() => setContentCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                      contentCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                    }`}>
                    {{ video: '🎬 Vídeos', story: '📖 Histórias', game: '🎮 Games', movie: '🎥 Filmes', series: '📺 Séries' }[cat]}
                  </button>
                ))}
              </div>
              <Select
                value={taskForm.linked_content_type === contentCategory ? (taskForm.linked_content_id || '') : ''}
                onValueChange={v => setTaskForm({ ...taskForm, linked_content_type: v ? contentCategory : null, linked_content_id: v || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingContent ? 'Carregando...' : 'Selecionar conteúdo...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {(availableContent[contentCategory] || []).map(item => (
                    <SelectItem key={item.id} value={item.id} disabled={item.is_premium && !isPremium}>
                      {item.title}{item.is_premium && !isPremium ? ' 🔒' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {taskForm.linked_content_id && (
                <p className="text-xs text-green-600 font-semibold">✅ Conteúdo vinculado!</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              {taskForm.id && <Button variant="ghost" size="sm" onClick={() => setTaskForm({ requires_photo: false, is_mandatory: true })}>Cancelar</Button>}
              <Button size="sm" onClick={handleSaveTask} disabled={saving || !taskForm.description}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {taskForm.id ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </div>
          {/* Task List */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="w-16">Ordem</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>XP</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loadingTasks ? (
                  <TableRow><TableCell colSpan={4} className="h-20 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">Nenhuma tarefa ainda.</TableCell></TableRow>
                ) : tasks.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold text-center text-muted-foreground">{t.order_index}</TableCell>
                    <TableCell>
                      <div>{t.description}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {t.requires_photo && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">📷 Foto</span>}
                        {t.is_mandatory && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">⭐ Essencial</span>}
                        {t.schedule_time && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">⏰ {t.schedule_time.slice(0,5)}</span>}
                        {t.linked_content_type && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">🔗 {t.linked_content_type}</span>}
                      </div>
                    </TableCell>
                    <TableCell><span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full text-xs font-bold">+{t.xp_reward}XP</span></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setTaskForm(t)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(t.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    );
  }

  // VIEW: Mission days for a pack
  if (selectedPack) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
          <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedPack(null)}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex-1">
              <h1 className="font-fredoka text-xl font-bold">{selectedPack.title}</h1>
              <p className="text-sm text-muted-foreground">Gerenciando dias desta trilha</p>
            </div>
            <Button onClick={() => { setMissionForm({ day_number: (missions.length || 0) + 1, xp_reward: 50 }); setIsMissionDialogOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Novo Dia
            </Button>
          </div>
        </header>
        <main className="container max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="w-20">Dia</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>XP</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loadingMissions ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : missions.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Nenhum dia criado. Clique em "Novo Dia".</TableCell></TableRow>
                ) : missions.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-bold text-center bg-slate-50">#{m.day_number}</TableCell>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell><span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-bold"><Trophy className="w-3 h-3 mr-1" />{m.xp_reward} XP</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedTasksMission(m)}>Tarefas <ChevronRight className="w-3 h-3 ml-1" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setMissionForm(m); setIsMissionDialogOpen(true); }}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMission(m.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </main>

        {/* Mission (Day) Dialog */}
        <Dialog open={isMissionDialogOpen} onOpenChange={setIsMissionDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{missionForm.id ? 'Editar Dia' : 'Novo Dia'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label>Dia #</Label>
                  <Input type="number" value={missionForm.day_number || ''} onChange={e => setMissionForm({ ...missionForm, day_number: +e.target.value })} />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label>Título</Label>
                  <Input value={missionForm.title || ''} onChange={e => setMissionForm({ ...missionForm, title: e.target.value })} placeholder="Ex: Dia 1 — Começo da Jornada" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={missionForm.description || ''} onChange={e => setMissionForm({ ...missionForm, description: e.target.value })} placeholder="O que a criança vai aprender ou fazer neste dia?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>XP Recompensa</Label>
                  <Input type="number" value={missionForm.xp_reward || 50} onChange={e => setMissionForm({ ...missionForm, xp_reward: +e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Ícone (nome Lucide)</Label>
                  <Input value={missionForm.icon || 'star'} onChange={e => setMissionForm({ ...missionForm, icon: e.target.value })} placeholder="star, heart, book..." />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMissionDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveMission} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // VIEW: Pack list
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/moreh')}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="font-fredoka text-xl font-bold">Minhas Trilhas</h1>
            <p className="text-sm text-muted-foreground">Crie e gerencie missões para seus filhos</p>
          </div>
          <Button onClick={() => { setPackForm({ is_active: true, total_days: 7 }); setIsPackDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Nova Trilha
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6">
        {loadingPacks ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : packs.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border space-y-4">
            <Target className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
            <div>
              <p className="font-bold text-foreground">Nenhuma trilha criada ainda</p>
              <p className="text-sm text-muted-foreground mt-1">Crie a primeira trilha para seus filhos!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packs.map(pack => (
              <div key={pack.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video bg-slate-100 relative">
                  {pack.cover_url ? (
                    <img src={pack.cover_url} className="w-full h-full object-cover" alt={pack.title} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300"><Target className="w-12 h-12" /></div>
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${pack.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {pack.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg">{pack.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{pack.description}</p>
                  <div className="text-xs text-muted-foreground mb-4 space-y-1">
                    <div>{pack.total_days} dias</div>
                    {pack.start_date && <div>Início: {pack.start_date}</div>}
                    {pack.child_id && <div>Para: {children.find(c => c.id === pack.child_id)?.name ?? 'Filho'}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => setSelectedPack(pack)}>Gerenciar Dias</Button>
                    <Button variant="ghost" size="icon" onClick={() => { setPackForm(pack); setIsPackDialogOpen(true); }}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePack(pack.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Pack Dialog */}
      <Dialog open={isPackDialogOpen} onOpenChange={setIsPackDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{packForm.id ? 'Editar Trilha' : 'Nova Trilha'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título da Trilha *</Label>
              <Input value={packForm.title || ''} onChange={e => setPackForm({ ...packForm, title: e.target.value })} placeholder="Ex: 7 Dias de Gratidão" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={packForm.description || ''} onChange={e => setPackForm({ ...packForm, description: e.target.value })} placeholder="O que a criança vai aprender nesta trilha?" />
            </div>
            <div className="space-y-2">
              <Label>URL da Capa (imagem)</Label>
              <Input value={packForm.cover_url || ''} onChange={e => setPackForm({ ...packForm, cover_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total de Dias</Label>
                <Input type="number" min={1} value={packForm.total_days || 1} onChange={e => setPackForm({ ...packForm, total_days: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input type="date" value={packForm.start_date || ''} onChange={e => setPackForm({ ...packForm, start_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Para qual filho?</Label>
              <Select value={packForm.child_id || 'all'} onValueChange={v => setPackForm({ ...packForm, child_id: v === 'all' ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Todos os filhos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os filhos</SelectItem>
                  {children.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <div>
                <p className="font-semibold text-sm">Trilha Ativa</p>
                <p className="text-xs text-muted-foreground">Aparece na tela de Missões</p>
              </div>
              <Switch checked={packForm.is_active ?? true} onCheckedChange={v => setPackForm({ ...packForm, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPackDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePack} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
