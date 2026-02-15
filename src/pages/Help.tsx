import { ArrowLeft, HelpCircle, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-card hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-fredoka text-xl font-bold text-foreground">Ajuda</h1>
          </div>
        </div>
      </header>
      
      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="bg-card p-6 rounded-2xl shadow-sm text-center">
          <HelpCircle className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h2 className="font-bold text-lg mb-2">Precisa de ajuda?</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Se você encontrou algum problema ou tem alguma dúvida, entre em contato com nossa equipe de suporte.
          </p>
          <Button className="w-full gap-2">
            <Mail className="w-4 h-4" />
            Enviar Mensagem
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold ml-2">Perguntas Frequentes</h3>
          
          <div className="bg-card p-4 rounded-xl shadow-sm">
            <h4 className="font-semibold text-sm mb-1">Como mudar meu avatar?</h4>
            <p className="text-xs text-muted-foreground">Vá até o seu Perfil e clique no ícone de configurações.</p>
          </div>
          
          <div className="bg-card p-4 rounded-xl shadow-sm">
            <h4 className="font-semibold text-sm mb-1">Como ganhar mais pontos?</h4>
            <p className="text-xs text-muted-foreground">Complete as histórias diárias e jogue os jogos educativos!</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Help;
