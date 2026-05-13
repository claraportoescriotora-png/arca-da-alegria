import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { useMoreh } from "@/hooks/useMoreh";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, CheckSquare, Settings, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

import { supabase } from "@/lib/supabase";

function AuditPanel() {
  const { session } = useAuth();
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
      .select(`
        *,
        template:routine_templates(title, child_id),
        child:routine_templates(child:children(name))
      `)
      .in('status', statuses)
      .order('completed_at', { ascending: false })
      .limit(20);
    
    if (data) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAuditTasks();
  }, [tab]);

  const handleAction = async (taskId: string, status: string, points: number, childId: string) => {
    // Update task
    await supabase.from("daily_tasks").update({ status }).eq('id', taskId);
    
    // Give points if approved
    if (points > 0) {
      // we need to get current child talent_points and add
      const { data: childData } = await supabase.from('children').select('talent_points').eq('id', childId).single();
      if (childData) {
        await supabase.from('children').update({ talent_points: childData.talent_points + points }).eq('id', childId);
      }
    }
    
    toast.success(status === 'approved' ? 'Aprovado com sucesso!' : 'Graça liberada!');
    fetchAuditTasks();
  };

  const handleShare = async (task: any, childName: string) => {
    if (!task.evidence_url) {
      toast.error('Somente missões com foto podem ser compartilhadas.');
      return;
    }
    try {
      toast.loading('Gerando certificado...');
      
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Draw background
      ctx.fillStyle = '#6D28D9'; // Primary purple
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Certificado de Conclusão', 540, 150);
      
      ctx.font = '50px sans-serif';
      ctx.fillText(`${childName} completou a missão:`, 540, 250);
      
      ctx.font = 'bold 60px sans-serif';
      ctx.fillStyle = '#FCD34D'; // Yellow
      ctx.fillText(task.template?.title || '', 540, 350);

      // Load and draw image
      if (task.evidence_url.match(/\.(mp4|webm|ogg|mov)$/i)) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '40px sans-serif';
        ctx.fillText('(Vídeo salvo no mural da família)', 540, 600);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = task.evidence_url;
        });
        
        // Draw image centered and cropped
        const size = 500;
        const x = 540 - size / 2;
        const y = 450;
        
        // Draw frame
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 10, y - 10, size + 20, size + 20);
        ctx.drawImage(img, x, y, size, size);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'certificado.jpg', { type: 'image/jpeg' });

      toast.dismiss();

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Certificado de Conclusão',
          text: `Olha só o que ${childName} fez hoje no Meu Amiguito! 🌟`,
        });
      } else {
        // Fallback download
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `certificado-${childName}.jpg`;
        a.click();
        toast.success('Certificado baixado!');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Erro ao gerar certificado.');
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-muted p-1 rounded-xl">
        <button 
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'pending' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          onClick={() => setTab('pending')}
        >
          Pendentes
        </button>
        <button 
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tab === 'approved' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          onClick={() => setTab('approved')}
        >
          Aprovados
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">Carregando...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl border border-border">
          {tab === 'pending' ? 'Nenhuma evidência pendente.' : 'Nenhuma missão aprovada ainda.'}
        </div>
      ) : (
        tasks.map(task => {
          const childName = task.child?.child?.name || 'Criança';
          const childId = task.template?.child_id;
          
          return (
            <div key={task.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-fredoka font-bold text-lg">{task.template?.title}</h3>
                  <p className="text-sm text-muted-foreground">{childName}</p>
                </div>
                {task.status === 'failed' && (
                  <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full font-semibold">
                    Falhou
                  </span>
                )}
                {task.status === 'approved' && (
                  <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" /> Aprovado
                  </span>
                )}
              </div>

              {task.evidence_url && (
                <div className="my-4">
                  {task.evidence_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                    <video src={task.evidence_url} controls className="w-full h-48 object-cover rounded-xl bg-black" />
                  ) : (
                    <img src={task.evidence_url} alt="Evidência" className="w-full h-48 object-cover rounded-xl bg-black" />
                  )}
                </div>
              )}

              {task.justification && (
                <div className="my-4 p-3 bg-muted rounded-xl">
                  <p className="text-sm font-semibold">Justificativa:</p>
                  <p className="text-sm text-muted-foreground">{task.justification}</p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                {task.status === 'completed_pending_review' && (
                  <>
                    <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={() => handleAction(task.id, 'approved', 10, childId)}>
                      Aprovar (+10)
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => handleAction(task.id, 'failed', 0, childId)}>
                      Rejeitar
                    </Button>
                  </>
                )}
                
                {task.status === 'failed' && (
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold" onClick={() => handleAction(task.id, 'grace_approved', 5, childId)}>
                    Poder de Graça (+5)
                  </Button>
                )}

                {(task.status === 'approved' || task.status === 'grace_approved') && task.evidence_url && (
                  <Button className="w-full font-bold" variant="outline" onClick={() => handleShare(task, childName)}>
                    Compartilhar Certificado
                  </Button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function MorehDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { children, addChild, hygieneDays, updateHygieneDays } = useMoreh();
  const [newChildName, setNewChildName] = useState("");

  const handleAddChild = async () => {
    if (!newChildName.trim()) return;
    
    // Check limit
    if (children.length >= 1 && profile?.plan_type !== 'family_pass' && profile?.subscription_status !== 'partner') {
      toast.error("O Plano Base permite apenas 1 filho. Adquira o Passe Família para acessos ilimitados!");
      return;
    }

    const { error } = await addChild(newChildName, "1"); // Default avatar 1
    if (error) {
      toast.error("Erro ao adicionar filho. Verifique o limite da sua licença.");
    } else {
      toast.success("Filho adicionado com sucesso!");
      setNewChildName("");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-fredoka text-xl font-bold text-foreground">Painel do Moreh</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="children" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="children" className="flex gap-2">
              <Users className="w-4 h-4" /> Filhos
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex gap-2">
              <CheckSquare className="w-4 h-4" /> Auditoria
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex gap-2">
              <Settings className="w-4 h-4" /> Ajustes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="children" className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                <h2 className="font-fredoka font-semibold mb-4">Adicionar Filho</h2>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nome da criança" 
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                  />
                  <Button onClick={handleAddChild}><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
                </div>
              </div>

              {children.map(child => (
                <div key={child.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <UserAvatar avatarId={child.avatar_url} className="w-12 h-12 border-2" />
                    <div>
                      <h3 className="font-fredoka font-bold text-lg">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">{child.talent_points} Talentos</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate(`/moreh/planner/${child.id}`)}>
                    Criar Missões
                  </Button>
                </div>
              ))}
              
              {children.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  Nenhum filho cadastrado ainda.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AuditPanel />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
              <h2 className="font-fredoka font-semibold mb-2">Higiene do Sistema</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Quanto tempo o aplicativo deve guardar as fotos de evidência antes de apagá-las automaticamente para liberar espaço no aparelho?
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                {[7, 15, 30].map(days => (
                  <Button 
                    key={days}
                    variant={hygieneDays === days ? "default" : "outline"}
                    onClick={() => updateHygieneDays(days)}
                  >
                    {days} dias
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
