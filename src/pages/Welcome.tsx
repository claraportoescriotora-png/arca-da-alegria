
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lock, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const Welcome = () => {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast({
                variant: "destructive",
                title: "Senha muito curta",
                description: "A senha deve ter pelo menos 6 caracteres.",
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            toast({
                title: "Tudo pronto! ✨",
                description: "Sua senha foi definida com sucesso.",
            });
            navigate("/home");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro ao definir senha",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-400 to-indigo-600 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white/95 backdrop-blur shadow-2xl rounded-[3rem] border-0 overflow-hidden">
                <CardHeader className="text-center space-y-4 pt-12">
                    <div className="mx-auto bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-5xl">✨</span>
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-bold text-blue-900 leading-tight">
                            Bem-vindo ao <br /> Meu Amiguito!
                        </CardTitle>
                        <CardDescription className="text-blue-700 text-lg">
                            Sua jornada de fé e alegria começa agora.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-8 space-y-8 pb-12">
                    <div className="bg-blue-50/50 rounded-2xl p-6 space-y-4 border border-blue-100 italic text-blue-800 text-center">
                        <p>"Ensina a criança no caminho em que deve andar..."</p>
                        <p className="text-xs font-bold">— Provérbios 22:6</p>
                    </div>

                    <form onSubmit={handleSetPassword} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700 ml-1">
                                Deseja definir uma senha para acessos futuros? (Opcional)
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="Sua senha (mín. 6 dígitos)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 h-14 rounded-2xl border-blue-100 focus:border-blue-400 focus:ring-blue-400 bg-white shadow-sm text-lg"
                                />
                            </div>
                            <p className="text-xs text-gray-500 ml-1">Se preferir, você poderá continuar usando apenas o Link Mágico por e-mail.</p>
                        </div>

                        <div className="flex flex-col gap-4 pt-2">
                            <Button
                                type="submit"
                                disabled={loading || !password}
                                className="w-full h-15 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl shadow-xl transform active:scale-95 transition-all flex gap-3"
                            >
                                {loading ? "Configurando..." : (
                                    <>
                                        Definir Senha e Começar
                                        <Check className="w-6 h-6" />
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate("/home")}
                                className="w-full h-12 text-blue-600 hover:text-blue-700 font-bold flex gap-2"
                            >
                                Pular esta etapa agora
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Welcome;
