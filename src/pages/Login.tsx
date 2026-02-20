import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useConfig } from "@/contexts/ConfigContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const { logoUrl } = useConfig();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Bem-vindo(a)!",
        description: "Login realizado com sucesso!",
      });
      navigate("/home");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0], // Default name
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Conta criada!",
        description: "Verifique seu e-mail para confirmar (ou entre se já confirmou).",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/devocional-bg.png')] opacity-10 bg-cover bg-center pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-4">
        {/* PWA Install Prompt */}
        {showInstallPrompt && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg mb-2 group">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-blue-900 font-extrabold leading-tight">Baixe o app no seu dispositivo!</p>
              <p className="text-blue-700 text-xs font-medium">Instale agora para acessar com um toque.</p>
            </div>
            <button
              onClick={() => {
                toast({
                  title: "Dica de Instalação",
                  description: "Clique em 'Compartilhar' (iOS) ou nos '3 pontinhos' (Android) e selecione 'Adicionar à tela de início'.",
                });
              }}
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors border border-blue-100"
            >
              Baixar
            </button>
          </div>
        )}

        <Card className="w-full border-0 shadow-2xl bg-white/95 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-col items-center space-y-4 pb-2">
            <div className="w-48 h-48 relative mb-2">
              <img
                src={logoUrl || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
                alt="Meu Amiguito"
                className={`w-full h-full object-contain drop-shadow-md transition-opacity duration-300 ${logoUrl ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
            <a href="https://www.meuamiguito.com.br/landing" className="text-2xl font-bold text-blue-600 text-center hover:underline">Bem-vindo ao Meu Amiguito!</a>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-blue-200 focus:border-blue-400 bg-blue-50/50 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-blue-200 focus:border-blue-400 bg-blue-50/50 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 rounded-xl text-lg shadow-lg"
                >
                  {loading ? "Carregando..." : "Entrar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={handleSignUp}
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  Criar Conta
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 italic text-center font-medium">
              "Ensina a criança no caminho em que deve andar..."
            </p>
            <p className="text-xs text-gray-400 mt-1">Provérbios 22:6</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
