import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Mail, Lock, Sparkles, ArrowRight, ToggleLeft as Toggle } from "lucide-react";
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
  const [sent, setSent] = useState(false);
  const [loginMode, setLoginMode] = useState<"magic" | "password">("magic");
  const { logoUrl } = useConfig();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      // Call custom API that uses Resend instead of direct supabase.auth.signInWithOtp
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao enviar link");

      setSent(true);
      toast({
        title: "Verifique o seu e-mail!",
        description: "Enviámos um link mágico de acesso para " + email,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

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


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/devocional-bg.png')] opacity-10 bg-cover bg-center pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-4">
        <Card className="w-full border-0 shadow-2xl bg-white/95 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-col items-center space-y-4 pb-2 pt-10">
            <div className="w-40 h-40 relative mb-2">
              <img
                src={logoUrl || "/logo.png"}
                alt="Meu Amiguito"
                className={`w-full h-full object-contain drop-shadow-md transition-opacity duration-300 ${logoUrl ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <div className="space-y-6">
                <div className="flex justify-center mb-2">
                  <div className="bg-blue-50 p-1 rounded-2xl flex gap-1 border border-blue-100">
                    <button
                      onClick={() => setLoginMode("magic")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${loginMode === "magic" ? "bg-white text-blue-600 shadow-sm" : "text-blue-400 hover:text-blue-600"}`}
                    >
                      Link Mágico
                    </button>
                    <button
                      onClick={() => setLoginMode("password")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${loginMode === "password" ? "bg-white text-blue-600 shadow-sm" : "text-blue-400 hover:text-blue-600"}`}
                    >
                      Senha
                    </button>
                  </div>
                </div>

                <form onSubmit={loginMode === "magic" ? handleMagicLink : handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold text-blue-900 ml-1">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 rounded-2xl border-blue-100 focus:border-blue-400 bg-blue-50/30 text-blue-950 placeholder:text-gray-400 h-14 SafariFix"
                        style={{ color: '#1e3a8a' }} // Safari fix for invisible text
                      />
                    </div>
                  </div>

                  {loginMode === "password" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="password_field" className="font-bold text-blue-900 ml-1">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                        <Input
                          id="password_field"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 rounded-2xl border-blue-100 focus:border-blue-400 bg-blue-50/30 text-blue-950 placeholder:text-gray-400 h-14"
                          style={{ color: '#1e3a8a' }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-7 rounded-2xl text-xl shadow-xl flex gap-3 transform active:scale-95 transition-all"
                    >
                      {loading ? "Processando..." : (
                        loginMode === "magic" ? (
                          <>
                            Enviar Link de Acesso
                            <Mail className="w-6 h-6" />
                          </>
                        ) : (
                          <>
                            Entrar agora
                            <ArrowRight className="w-6 h-6" />
                          </>
                        )
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => window.location.href = "https://www.meuamiguito.com.br/landing"}
                      className="text-blue-600 hover:text-blue-700 font-bold h-12"
                    >
                      Não tenho conta? Assinar agora
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-12 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-500 shadow-inner">
                  <Sparkles className="w-12 h-12 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-blue-900">Quase lá! ✨</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    Enviámos um link de acesso para <br /> <strong className="text-blue-600">{email}</strong>.
                  </p>
                  <p className="text-sm text-gray-500 italic px-4">
                    Abra o e-mail no seu telemóvel e clique no botão para entrar.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSent(false)}
                  className="rounded-2xl border-blue-200 text-blue-600 h-12 px-8"
                >
                  Tentar outro e-mail
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center pt-6 pb-10 border-t border-blue-50">
            <p className="text-sm text-gray-500 italic text-center font-medium px-8">
              "Ensina a criança no caminho em que deve andar..."
            </p>
            <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">Provérbios 22:6</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
