
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabase";

import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Paywall = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (profile?.subscription_status === 'active' || profile?.subscription_status === 'partner') {
            navigate('/home');
        }
    }, [profile, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-xl border-2 border-yellow-400">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-blue-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                        <Lock className="w-10 h-10 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-blue-900">
                        Acesso Exclusivo Meu Amiguito
                    </CardTitle>
                    <CardDescription className="text-blue-700 text-lg">
                        Desbloqueie a jornada completa!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1 rounded-full">
                                <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-gray-700">Trilha de 30 dias de discipulado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1 rounded-full">
                                <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-gray-700">Histórias bíblicas e morais</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1 rounded-full">
                                <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-gray-700">Missões diárias e gamificação</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1 rounded-full">
                                <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-gray-700">Área exclusiva para pais</span>
                        </div>
                    </div>

                    {profile?.subscription_status === 'blocked' ? (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <p className="text-sm text-red-800 text-center font-bold">
                                Acesso Suspenso.
                            </p>
                            <p className="text-xs text-red-700 text-center mt-1">
                                Esta conta foi desativada por irregularidades no pagamento ou violação dos termos. Entre em contato com o suporte para mais informações.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800 text-center">
                                Sua conta <strong>{user?.email}</strong> está aguardando ativação.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-lg h-12 rounded-xl shadow-lg transform transition hover:scale-105"
                        onClick={() => window.open('https://www.meuamiguito.com.br/landing', '_blank')}
                    >
                        Assinar Agora
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => window.location.reload()}
                    >
                        Já paguei? Clique para atualizar
                    </Button>
                    <Button variant="ghost" className="w-full text-gray-500" onClick={signOut}>
                        Sair e tentar outra conta
                    </Button>


                </CardFooter>
            </Card>
        </div >
    );
};

export default Paywall;
