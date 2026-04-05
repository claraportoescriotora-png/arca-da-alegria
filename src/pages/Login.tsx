import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Mail, Lock, Sparkles, ArrowRight, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useConfig } from "@/contexts/ConfigContext";
import { useAuth } from "@/contexts/AuthProvider";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [loginMode, setLoginMode] = useState<"password" | "magic">("password");
  const [step, setStep] = useState<"welcome" | "survey" | "install" | "login">("welcome");
  const [surveyData, setSurveyData] = useState({ source: "", goal: "" });
  const [isStandalone, setIsStandalone] = useState(false);
  
  const { logoUrl } = useConfig();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      navigate("/home", { replace: true });
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect if already in PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (standalone) {
      setIsStandalone(true);
      setStep("login");
    }

    // Check if onboarding already done
    if (localStorage.getItem('onboarding_completed') && !standalone) {
      setStep("login");
    }

    // Auto-fill email from URL
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setStep("login");
  };

  const saveSurvey = async () => {
    try {
      await supabase.from('user_surveys').insert({
        email: email || null,
        source: surveyData.source,
        goal: surveyData.goal,
        device_type: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 'android'
      });
    } catch (e) {
      console.error("Error saving survey:", e);
    }
    setStep("install");
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        completeOnboarding();
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
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
        description: "Enviámos um link de acesso para " + email,
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Bem-vindo(a)!", description: "Login realizado com sucesso!" });
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-bounce">
          <img src={logoUrl || "/logo.png"} alt="Loading..." className="w-32 h-32 object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/devocional-bg.png')] opacity-10 bg-cover bg-center pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-4">
        <Card className="w-full border-0 shadow-2xl bg-white/95 backdrop-blur-md rounded-[2.5rem] overflow-hidden transition-all duration-500">
          
          {step === "welcome" && (
            <div className="p-10 text-center space-y-8 animate-in fade-in zoom-in duration-700">
              <div className="w-48 h-48 mx-auto relative mb-4">
                <img src={logoUrl || "/logo.png"} alt="Meu Amiguito" className="w-full h-full object-contain drop-shadow-xl" />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-blue-900 tracking-tight">Bem-vindo(a)!</h1>
                <p className="text-xl text-blue-700 font-medium leading-relaxed">
                  Prepare-se para viver momentos incríveis com sua família. ✨
                </p>
              </div>
              <Button 
                onClick={() => setStep("survey")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-8 rounded-3xl text-xl shadow-xl transform active:scale-95 transition-all"
              >
                Vamos começar!
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          )}

          {step === "survey" && (
            <div className="p-8 space-y-8 animate-in slide-in-from-right fade-in duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-blue-900">Só uma coisinha...</h2>
                <p className="text-gray-500">Isso nos ajuda a criar um app melhor para você!</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-lg font-bold text-blue-900 ml-1">Como nos conheceu?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Instagram", "YouTube", "Amigo(a)", "Anúncio", "Google", "Outro"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSurveyData({ ...surveyData, source: opt })}
                        className={`py-3 px-4 rounded-2xl text-sm font-bold border-2 transition-all ${surveyData.source === opt ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-blue-200"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-lg font-bold text-blue-900 ml-1">Qual seu principal objetivo?</Label>
                  <div className="space-y-2">
                    {[
                      { id: "faith", label: "Fortalecer a fé dos meus filhos", icon: <Sparkles className="w-4 h-4" /> },
                      { id: "games", label: "Jogos saudáveis e cristãos", icon: <ArrowRight className="w-4 h-4" /> },
                      { id: "stories", label: "Histórias bíblicas divertidas", icon: <Lock className="w-4 h-4" /> }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSurveyData({ ...surveyData, goal: opt.label })}
                        className={`w-full text-left py-4 px-5 rounded-2xl text-sm font-bold border-2 transition-all flex items-center gap-3 ${surveyData.goal === opt.label ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-100 bg-gray-50 text-gray-400 hover:border-blue-200"}`}
                      >
                        <div className={`p-2 rounded-lg ${surveyData.goal === opt.label ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                          {opt.icon}
                        </div>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                disabled={!surveyData.source || !surveyData.goal}
                onClick={saveSurvey}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-7 rounded-2xl text-lg shadow-lg flex items-center justify-center gap-2"
              >
                Próximo passo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {step === "install" && (
            <div className="p-8 text-center space-y-8 animate-in slide-in-from-right fade-in duration-500">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-500">
                <DownloadCloud className="w-12 h-12 md:animate-bounce" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-blue-900">Instale agora! 📱</h2>
                <p className="text-gray-600 text-lg">
                  Para uma experiência melhor e mais rápida, instale o app na sua tela de início.
                </p>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={handleInstallClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-7 rounded-2xl text-lg shadow-xl"
                >
                  <Smartphone className="w-6 h-6 mr-2" />
                  Instalar Aplicativo
                </Button>

                <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 text-sm text-yellow-800 flex gap-3">
                  <Sparkles className="w-5 h-5 flex-shrink-0 text-yellow-500" />
                  <p className="text-left font-medium">
                    <strong>Importante:</strong> Após instalar, feche esta aba e abra o ícone na sua tela inicial para continuar o acesso.
                  </p>
                </div>
              </div>

              <Button 
                variant="ghost"
                onClick={completeOnboarding}
                className="text-gray-400 font-bold"
              >
                Já instalei ou quero continuar aqui
              </Button>
            </div>
          )}

          {step === "login" && (
            <>
              <CardHeader className="flex flex-col items-center space-y-4 pb-2 pt-10">
                <div className="w-32 h-32 relative mb-2">
                  <img
                    src={logoUrl || "/logo.png"}
                    alt="Meu Amiguito"
                    className={`w-full h-full object-contain drop-shadow-md transition-opacity duration-300 ${logoUrl ? 'opacity-100' : 'opacity-0'}`}
                  />
                </div>
                {!isStandalone && (
                  <Button 
                    onClick={handleInstallClick}
                    variant="outline"
                    className="bg-blue-50/50 hover:bg-blue-100 border-blue-200 text-blue-700 font-bold rounded-full px-6 shadow-sm transition-all text-sm"
                  >
                    <DownloadCloud className="w-4 h-4 mr-2" />
                    Como Instalar
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!sent ? (
                  <div className="space-y-6">
                    <div className="flex justify-center mb-2">
                      <div className="bg-blue-50 p-1 rounded-2xl flex gap-1 border border-blue-100">
                        <button
                          onClick={() => setLoginMode("password")}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${loginMode === "password" ? "bg-white text-blue-600 shadow-sm" : "text-blue-400 hover:text-blue-600"}`}
                        >
                          Senha
                        </button>
                        <button
                          onClick={() => setLoginMode("magic")}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${loginMode === "magic" ? "bg-white text-blue-600 shadow-sm" : "text-blue-400 hover:text-blue-600"}`}
                        >
                          Sem Senha
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
                            className="pl-12 rounded-2xl border-blue-100 focus:border-blue-400 bg-blue-50/30 text-blue-950 placeholder:text-gray-400 h-14"
                            style={{ color: '#1e3a8a' }}
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
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-7 rounded-2xl text-xl shadow-xl flex items-center justify-center gap-3 transform active:scale-95 transition-all"
                        >
                          {loading ? "Processando..." : (
                            loginMode === "magic" ? (
                              <>Receber Link <Mail className="w-6 h-6" /></>
                            ) : (
                              <>Entrar agora <ArrowRight className="w-6 h-6" /></>
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
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-500">
                      <Sparkles className="w-12 h-12 animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-bold text-blue-900 text-center">Quase lá! ✨</h3>
                      <p className="text-lg text-gray-600 text-center">Enviamos o acesso para <strong>{email}</strong></p>
                    </div>
                    <Button variant="outline" onClick={() => setSent(false)} className="rounded-2xl border-blue-200 text-blue-600 h-12 px-8">Tentar outro e-mail</Button>
                  </div>
                )}
              </CardContent>
            </>
          )}

          <CardFooter className="flex flex-col items-center pt-6 pb-10 border-t border-blue-50">
            <p className="text-sm text-gray-500 italic text-center font-medium px-8">
              "Ensina a criança no caminho em que deve andar..."
            </p>
            <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest text-center">Provérbios 22:6</p>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
        <DialogContent className="sm:max-w-md w-11/12 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-blue-900 flex items-center justify-center gap-2">
              <Smartphone className="w-6 h-6 text-blue-500" />
              Como instalar o App
            </DialogTitle>
            <DialogDescription className="text-center pt-4 text-base space-y-4">
              <p><strong>No iPhone (Safari):</strong><br />1. Toque em Compartilhar 📤<br />2. Toque em <strong>Adicionar à Tela de Início</strong>.</p>
              <div className="w-full h-px bg-gray-200 my-2"></div>
              <p><strong>No Android (Chrome):</strong><br />1. Toque no Menu (3 pontinhos)<br />2. Selecione <strong>Instalar Aplicativo</strong>.</p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowInstallModal(false)} className="bg-blue-500 text-white w-full rounded-2xl h-12 mt-4">Entendido!</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
