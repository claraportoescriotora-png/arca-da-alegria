import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
      // If user not found, try to sign up automatically (optional, based on UX)
      // For now, let's just show error or simpler: treat as signup/login unified for MVP?
      // User request says "Registro/Login: Cadastro simples dos pais."
      // Let's try SignUp if Login fails? Or just show error.
      // Better: Explicit Toggle or just handle error. 
      // Let's implement a simple "Entrar / Cadastrar" logic if needed, but for now just error.

      // Actually, let's try to sign up if login fails with "Invalid login credentials" is risky.
      // Let's keep it simple: Error message.
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
      // In development with Supabase, email confirmation might be off or fake.
      // If Auto Confirm is on, they are logged in.

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
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/devocional-bg.png')] opacity-10 bg-cover bg-center pointer-events-none" />

      <Card className="w-full max-w-md border-0 shadow-xl bg-white/90 backdrop-blur-sm z-10">
        <CardHeader className="flex flex-col items-center space-y-4 pb-2">
          <div className="w-48 h-48 relative mb-2">
            <img
              src={logoUrl || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} // Transparent pixel while loading
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
  );
};

export default Login;
