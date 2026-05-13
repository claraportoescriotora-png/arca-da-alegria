import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";

export default function TaskViewer() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchTask() {
      if (!taskId) return;
      const { data } = await supabase
        .from("daily_tasks")
        .select(`
          *,
          template:routine_templates (
            title, is_mandatory, requires_photo, linked_content_url
          )
        `)
        .eq("id", taskId)
        .single();
      
      setTask(data);
      setLoading(false);
    }
    fetchTask();
  }, [taskId]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task || !session?.user?.id) return;

    setSubmitting(true);
    toast.loading("Enviando foto para o Moreh...");

    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

    try {
      // Upload
      const { error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('evidences')
        .getPublicUrl(fileName);

      // Update task status
      const { error: updateError } = await supabase
        .from('daily_tasks')
        .update({ 
          status: 'completed_pending_review',
          evidence_url: publicUrl,
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (updateError) throw updateError;

      toast.dismiss();
      toast.success("Foto enviada! Aguardando o Moreh validar.");
      navigate(-1);
    } catch (err) {
      toast.dismiss();
      toast.error("Erro ao enviar a foto. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteWithoutPhoto = async () => {
    setSubmitting(true);
    const { error } = await supabase
      .from('daily_tasks')
      .update({ 
        status: 'completed_pending_review',
        completed_at: new Date().toISOString()
      })
      .eq('id', task.id);
    
    setSubmitting(false);
    if (!error) {
      toast.success("Missão concluída!");
      
      // se tem link nativo, abre ele, se não volta
      if (task.template.linked_content_url) {
        navigate(task.template.linked_content_url);
      } else {
        navigate(-1);
      }
    }
  };

  const handleJustify = async (emoji: string, reason: string) => {
    setSubmitting(true);
    const { error } = await supabase
      .from('daily_tasks')
      .update({ 
        status: 'failed',
        justification: `${emoji} ${reason}`,
        completed_at: new Date().toISOString()
      })
      .eq('id', task.id);
    
    setSubmitting(false);
    if (!error) {
      toast.success("Justificativa enviada ao Moreh.");
      navigate(-1);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!task) return <div className="min-h-screen flex items-center justify-center">Missão não encontrada.</div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-fredoka text-xl font-bold text-foreground">Missão</h1>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-8 space-y-8 text-center">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-md">
          <h2 className="font-fredoka text-3xl font-bold text-primary mb-4">{task.template.title}</h2>
          
          {task.template.requires_photo ? (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Camera className="w-16 h-16" />
              </div>
              <p className="text-muted-foreground">Tire uma foto para mostrar que você conseguiu!</p>
              
              <div className="relative">
                <Button className="w-full h-14 text-lg font-bold" disabled={submitting}>
                  <Camera className="w-5 h-5 mr-2" /> Abrir Câmera
                </Button>
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  capture="environment" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handlePhotoCapture}
                  disabled={submitting}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                <Check className="w-16 h-16" />
              </div>
              <p className="text-muted-foreground">O Moreh confia em você! Confirme quando terminar.</p>
              <Button 
                className="w-full h-14 text-lg font-bold bg-green-500 hover:bg-green-600"
                onClick={handleCompleteWithoutPhoto}
                disabled={submitting}
              >
                <Check className="w-5 h-5 mr-2" /> Já Terminei!
              </Button>
            </div>
          )}
        </div>

        {/* Justifications */}
        <div className="space-y-3">
          <p className="font-semibold text-muted-foreground">Não conseguiu fazer?</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center" onClick={() => handleJustify('🚗', 'Tive que sair com a família')}>
              <span className="text-2xl mb-1">🚗</span>
              <span className="text-xs text-center">Tive que sair com a família</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center" onClick={() => handleJustify('⏰', 'Faltou tempo')}>
              <span className="text-2xl mb-1">⏰</span>
              <span className="text-xs text-center">Faltou tempo</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center" onClick={() => handleJustify('🤒', 'Não me senti bem')}>
              <span className="text-2xl mb-1">🤒</span>
              <span className="text-xs text-center">Não me senti bem</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center" onClick={() => handleJustify('🤷', 'Esqueci / Outro motivo')}>
              <span className="text-2xl mb-1">🤷</span>
              <span className="text-xs text-center">Esqueci / Outro motivo</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
