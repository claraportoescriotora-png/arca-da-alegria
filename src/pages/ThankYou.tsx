
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle2, Smartphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ThankYou = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-500 to-purple-700 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Bubbles */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />

            <Card className="w-full max-w-lg bg-white/95 backdrop-blur shadow-2xl rounded-[3rem] border-0 overflow-hidden z-10">
                <CardHeader className="text-center space-y-4 pt-12">
                    <div className="mx-auto bg-green-100 w-24 h-24 rounded-full flex items-center justify-center shadow-inner">
                        <CheckCircle2 className="w-14 h-14 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-4xl font-black text-blue-900 leading-tight">
                            Pagamento Confirmado! 🎉
                        </CardTitle>
                        <CardDescription className="text-blue-700 text-lg font-medium">
                            Sua jornada com o Meu Amiguito começou.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-8 space-y-8 pb-12 text-center">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                            <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-indigo-900">Verifique seu E-mail</h4>
                                <p className="text-sm text-indigo-700">Enviamos um link mágico de acesso para você entrar agora mesmo.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-yellow-50 p-6 rounded-3xl border border-yellow-100">
                            <div className="bg-yellow-500 p-3 rounded-2xl text-white">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-yellow-900">Dica Pro</h4>
                                <p className="text-sm text-yellow-700">Abra o link no Safari (iPhone) ou Chrome (Android) e "Adicione à Tela de Início".</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={() => navigate("/")}
                            className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl shadow-xl transform active:scale-95 transition-all flex gap-3"
                        >
                            Ir para a tela de Login
                            <ArrowRight className="w-6 h-6" />
                        </Button>
                        <p className="mt-6 text-gray-500 text-sm italic font-medium">
                            "Ensina a criança no caminho em que deve andar..." <br />
                            <span className="font-bold uppercase tracking-widest text-[10px] mt-1 inline-block">Provérbios 22:6</span>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ThankYou;
