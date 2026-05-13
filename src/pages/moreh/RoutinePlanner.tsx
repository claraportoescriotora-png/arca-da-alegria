import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Camera, Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";

export default function RoutinePlanner() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const { session } = useAuth();
  
  const [title, setTitle] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [requiresPhoto, setRequiresPhoto] = useState(true);
  const [linkedContent, setLinkedContent] = useState<string>("none");
  const [scheduleType, setScheduleType] = useState("daily");
  
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available content for the dropdown
    async function fetchContent() {
      const { data } = await supabase.from("games").select("id, title").eq("is_active", true);
      if (data) setGames(data);
    }
    fetchContent();
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !childId || !session?.user?.id) {
      toast.error("Preencha o título da missão.");
      return;
    }

    setLoading(true);
    const linkedUrl = linkedContent !== "none" ? `/games/embed/${linkedContent}` : null;

    const { error } = await supabase.from("routine_templates").insert([{
      user_id: session.user.id,
      child_id: childId,
      title,
      is_mandatory: isMandatory,
      requires_photo: requiresPhoto,
      linked_content_url: linkedUrl,
      schedule_type: scheduleType,
      schedule_days: scheduleType === "daily" ? [1,2,3,4,5,6,7] : []
    }]);

    setLoading(false);

    if (error) {
      toast.error("Erro ao criar a missão.");
    } else {
      toast.success("Missão criada com sucesso!");
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-fredoka text-xl font-bold text-foreground">Nova Missão</h1>
          </div>
          <Button onClick={handleSave} disabled={loading} size="sm">
            <Check className="w-4 h-4 mr-2" /> Salvar
          </Button>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="bg-card p-4 rounded-2xl border border-border space-y-4">
          <div>
            <label className="text-sm font-semibold mb-1 block">O que a criança deve fazer?</label>
            <Input 
              placeholder="Ex: Escovar os dentes, Orar..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg py-6"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div>
              <p className="font-semibold text-sm">Missão Obrigatória</p>
              <p className="text-xs text-muted-foreground">Essencial para a meta do dia</p>
            </div>
            <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              {requiresPhoto ? <Camera className="w-5 h-5 text-primary" /> : <Check className="w-5 h-5 text-muted-foreground" />}
              <div>
                <p className="font-semibold text-sm">Exigir Foto da Criança</p>
                <p className="text-xs text-muted-foreground">Abre a câmera como prova</p>
              </div>
            </div>
            <Switch checked={requiresPhoto} onCheckedChange={setRequiresPhoto} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Repetição</label>
            <Select value={scheduleType} onValueChange={setScheduleType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Todos os dias</SelectItem>
                <SelectItem value="weekdays">Dias de Semana</SelectItem>
                <SelectItem value="weekends">Finais de Semana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Atalho de Conteúdo (Opcional)</label>
            <p className="text-xs text-muted-foreground mb-2">Conecte a missão a um jogo ou vídeo do app</p>
            <Select value={linkedContent} onValueChange={setLinkedContent}>
              <SelectTrigger>
                <SelectValue placeholder="Sem atalho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum atalho</SelectItem>
                {games.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </main>
    </div>
  );
}
