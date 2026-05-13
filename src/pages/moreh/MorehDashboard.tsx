import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, CheckSquare, Settings, Target, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

// ── Audit Panel ──────────────────────────────────────────────────────────────
function AuditPanel() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');

  const fetchAuditTasks = async () => {
    setLoading(true);
    const statuses = tab === 'pending'
      ? ['completed_pending_review', 'failed']
      : ['approved', 'grace_approved'];

    const { data } = await supabase
      .from("daily_tasks")
      .select(`*, template:routine_templates(title, child_id), child:routine_templates(child:children(name))`)
      .in('status', statuses)
      .order('completed_at', { ascending: false })
      .limit(30);

    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAuditTasks(); }, [tab]);

  const handleAction = async (taskId: string, status: string, points: number, childId: string) => {
    await supabase.from("daily_tasks").update({ status }).eq('id', taskId);
    if (points > 0) {
      const { data: childData } = await supabase.from('children').select('talent_points').eq('id', childId).single();
      if (childData) await supabase.from('children').update({ talent_points: (childData.talent_points || 0) + points }).eq('id', childId);
    }
    toast.success(status === 'approved' ? 'Aprovado!' : status === 'grace_approved' ? 'Graça concedida!' : 'Rejeitado.');
    fetchAuditTasks();
  };

  const handleShare = async (task: any, childName: string) => {
    if (!task.evidence_url) { toast.error('Sem evidência para compartilhar.'); return; }
    try {
      const isVideo = task.evidence_url.match(/\.(mp4|webm|ogg|mov)$/i);
      if (navigator.share) {
        await navigator.share({ url: task.evidence_url, title: 'Missão Concluída!', text: `${childName} completou: ${task.template?.title} 🌟` });
      } else {
        const a = document.createElement('a'); a.href = task.evidence_url; a.download = `evidencia-${childName}.${isVideo ? 'mp4' : 'jpg'}`; a.click();
        toast.success('Arquivo baixado!');
      }
    } catch (e) { toast.error('Erro ao compartilhar.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-muted p-1 rounded-xl">
        {(['pending', 'approved'] as const).map(t => (
          <button key={t} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === t ? 'bg-background shadow-sm' : 'text-muted-foreground'}`} onClick={() => setTab(t)}>
            {t === 'pending' ? 'Pendentes' : 'Aprovados'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-border">
          {tab === 'pending' ? 'Nenhuma evidência pendente.' : 'Nenhuma missão aprovada ainda.'}
        </div>
      ) : tasks.map(task => {
        const childName = task.child?.child?.name || 'Criança';
        const childId = task.template?.child_id;
        const isVideo = task.evidence_url?.match(/\.(mp4|webm|ogg|mov)$/i);

        return (
          <div key={task.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-fredoka font-bold text-lg">{task.template?.title}</h3>
                <p className="text-sm text-muted-foreground">{childName}</p>
              </div>
              {task.status === 'failed' && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full font-semibold">Falhou</span>}
              {(task.status === 'approved' || task.status === 'grace_approved') && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-semibold flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Aprovado</span>}
            </div>

            {task.evidence_url && (
              <div className="my-3">
                {isVideo ? (
                  <video src={task.evidence_url} controls className="w-full h-48 object-cover rounded-xl bg-black" />
                ) : (
                  <img src={task.evidence_url} alt="Evidência" className="w-full h-48 object-cover rounded-xl" />
                )}
              </div>
            )}

            {task.justification && (
              <div className="my-3 p-3 bg-muted rounded-xl">
                <p className="text-xs font-semibold mb-1">Justificativa:</p>
                <p className="text-sm text-muted-foreground">{task.justification}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-3">
              {task.status === 'completed_pending_review' && (
                <>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={() => handleAction(task.id, 'approved', 10, childId)}>✅ Aprovar (+10 XP)</Button>
                    <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleAction(task.id, 'failed', 0, childId)}>❌ Rejeitar</Button>
                  </div>
                  <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold" onClick={() => handleAction(task.id, 'grace_approved', 5, childId)}>🕊️ Conceder por Graça (+5 XP)</Button>
                </>
              )}
              {task.status === 'failed' && (
                <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold" onClick={() => handleAction(task.id, 'grace_approved', 5, childId)}>🕊️ Poder de Graça — Perdoar (+5 XP)</Button>
              )}
              {(task.status === 'approved' || task.status === 'grace_approved') && task.evidence_url && (
                <Button className="w-full font-bold" variant="outline" onClick={() => handleShare(task, childName)}>Compartilhar Evidência</Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Children Panel ───────────────────────────────────────────────────────────
function ChildrenPanel({ profile }: { profile: any }) {
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [newChildName, setNewChildName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchChildren = async () => {
    setLoading(true);
    const { data } = await supabase.from('children').select('*').order('created_at');
    setChildren(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchChildren(); }, []);

  const handleAddChild = async () => {
    if (!newChildName.trim()) return;
    // Limit check: base plan = 1 child; family_pass or partner = unlimited
    const isUnlimited = profile?.plan_type === 'family_pass' || profile?.subscription_status === 'partner';
    if (children.length >= 1 && !isUnlimited) {
      toast.error("O Plano Base permite apenas 1 filho. Adquira o Passe Família para ter filhos ilimitados!", { duration: 5000 });
      return;
    }
    const { error } = await supabase.from('children').insert({ name: newChildName.trim(), avatar_url: '1', talent_points: 0 });
    if (error) {
      toast.error("Erro ao adicionar filho.");
    } else {
      toast.success(`${newChildName} adicionado com sucesso!`);
      setNewChildName("");
      fetchChildren();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
        <h2 className="font-fredoka font-semibold mb-3">Adicionar Filho</h2>
        <div className="flex gap-2">
          <Input placeholder="Nome da criança" value={newChildName} onChange={e => setNewChildName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChild()} />
          <Button onClick={handleAddChild}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
        </div>
        {profile?.plan_type !== 'family_pass' && profile?.subscription_status !== 'partner' && children.length >= 1 && (
          <p className="text-xs text-amber-600 mt-2 font-medium">
            ⚠️ Plano Base: apenas 1 filho. Compre o <strong>Passe Família</strong> para adicionar mais.
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4 text-muted-foreground">Carregando...</div>
      ) : children.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
          Nenhum filho cadastrado ainda.
        </div>
      ) : children.map(child => (
        <div key={child.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar avatarId={child.avatar_url} className="w-12 h-12 border-2" />
            <div>
              <h3 className="font-fredoka font-bold text-lg">{child.name}</h3>
              <p className="text-sm text-muted-foreground">{child.talent_points || 0} Talentos ⭐</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function MorehDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/missions')} className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-fredoka text-xl font-bold text-foreground">Painel do Moreh</h1>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="children" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="children" className="flex gap-1 text-xs">
              <Users className="w-4 h-4" /> Filhos
            </TabsTrigger>
            <TabsTrigger value="trails" className="flex gap-1 text-xs">
              <Target className="w-4 h-4" /> Trilhas
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex gap-1 text-xs">
              <CheckSquare className="w-4 h-4" /> Auditoria
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex gap-1 text-xs">
              <Settings className="w-4 h-4" /> Ajustes
            </TabsTrigger>
          </TabsList>

          {/* Filhos */}
          <TabsContent value="children">
            <ChildrenPanel profile={profile} />
          </TabsContent>

          {/* Trilhas — abre MorehPackManager */}
          <TabsContent value="trails">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-5 rounded-2xl border border-primary/20">
                <h2 className="font-fredoka font-bold text-lg mb-1">Suas Trilhas de Missão</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie trilhas completas com dias e tarefas. Elas aparecem junto com as missões do app para seus filhos.
                </p>
                <Button onClick={() => navigate('/moreh/packs')} className="w-full">
                  <Target className="w-4 h-4 mr-2" /> Gerenciar Trilhas
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                As trilhas que você criar aparecerão em <strong>Missões</strong> junto com as trilhas do administrador.
              </p>
            </div>
          </TabsContent>

          {/* Auditoria */}
          <TabsContent value="audit">
            <AuditPanel />
          </TabsContent>

          {/* Ajustes */}
          <TabsContent value="settings">
            <div className="bg-card p-4 rounded-2xl shadow-sm border border-border space-y-4">
              <h2 className="font-fredoka font-semibold">Informações do Plano</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground">Plano atual</p>
                  <p className="font-bold capitalize">{profile?.plan_type || 'Base'}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-bold capitalize">{profile?.subscription_status || '—'}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                O Passe Família é liberado automaticamente após a compra na Kiwify.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
