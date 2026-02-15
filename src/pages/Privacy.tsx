import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

const Privacy = () => {
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
            <h1 className="font-fredoka text-xl font-bold text-foreground">Privacidade</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="bg-card p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <h2 className="font-bold text-lg">Seus Dados Estão Seguros</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            O Meu Amiguito se preocupa muito com sua segurança. Nós não compartilhamos seus dados com ninguém.
            Tudo o que você faz aqui serve apenas para acompanhar seu progresso na jornada da fé!
          </p>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold mb-2">Termos de Uso</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ao usar este aplicativo, você concorda em ser gentil, respeitoso e se divertir aprendendo sobre a Palavra de Deus.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Privacy;
