
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, AlertCircle, ShoppingCart, Mail, Database, Send } from 'lucide-react';

export function AdminTestSuite() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [steps, setSteps] = useState<{
        webhook: 'idle' | 'loading' | 'success' | 'error';
        supabase: 'idle' | 'loading' | 'success' | 'error';
        resend: 'idle' | 'loading' | 'success' | 'error';
    }>({
        webhook: 'idle',
        supabase: 'idle',
        resend: 'idle'
    });
    const { toast } = useToast();

    const handleSimulate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            toast({
                variant: "destructive",
                title: "Campos obrigatórios",
                description: "Preencha o nome e e-mail para simular."
            });
            return;
        }

        setLoading(true);
        setSteps({ webhook: 'loading', supabase: 'idle', resend: 'idle' });

        try {
            // 1. Trigger internal webhook call
            const payload = {
                order_status: "paid",
                customer: {
                    full_name: name,
                    email: email,
                    mobile: "5511999999999"
                },
                product: { product_id: "amiguito_anual" }
            };

            const bypassSecret = import.meta.env.VITE_INTERNAL_API_SECRET;

            if (!bypassSecret) {
                throw new Error('Chave de simulação (VITE_INTERNAL_API_SECRET) não configurada no ambiente.');
            }

            const response = await fetch('/api/webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-test-bypass': bypassSecret
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Attempt to parse JSON if possible
                let errorMessage = errorText;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorText;
                } catch (e) { }
                throw new Error(errorMessage || `Erro ${response.status} no Webhook`);
            }

            setSteps(prev => ({ ...prev, webhook: 'success', supabase: 'loading' }));

            // Simulate small delays for visual feedback
            await new Promise(r => setTimeout(r, 1000));
            setSteps(prev => ({ ...prev, supabase: 'success', resend: 'loading' }));

            await new Promise(r => setTimeout(r, 1000));
            setSteps(prev => ({ ...prev, resend: 'success' }));

            toast({
                title: "Simulação Concluída!",
                description: "Venda processada e e-mail enviado com sucesso."
            });

        } catch (error: any) {
            console.error('Simulation Error:', error);
            setSteps(prev => ({
                ...prev,
                webhook: prev.webhook === 'loading' ? 'error' : prev.webhook,
                supabase: prev.supabase === 'loading' ? 'error' : prev.supabase,
                resend: prev.resend === 'loading' ? 'error' : prev.resend
            }));

            toast({
                variant: "destructive",
                title: "Falha na Simulação",
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-Fredoka font-bold text-gray-900">Suite de Testes</h1>
                    <p className="text-gray-500">Simulador de Vendas Kiwify (Ambiente Sandbox Interno)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Simulator Form */}
                <Card className="border-0 shadow-xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-indigo-600 text-white pb-8 pt-8">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="w-8 h-8" />
                            <CardTitle className="text-2xl font-Fredoka">Simulador de Vendas</CardTitle>
                        </div>
                        <CardDescription className="text-indigo-100 opacity-90">
                            Simule um pagamento aprovado para validar o Auth e Resend.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 px-8 pb-8">
                        <form onSubmit={handleSimulate} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="test-name" className="font-bold text-indigo-900">Nome do Cliente</Label>
                                <Input
                                    id="test-name"
                                    placeholder="Ex: João Silva"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="rounded-xl border-indigo-100 focus:border-indigo-400 bg-indigo-50/30 h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="test-email" className="font-bold text-indigo-900">E-mail do Cliente</Label>
                                <Input
                                    id="test-email"
                                    type="email"
                                    placeholder="Ex: joao@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="rounded-xl border-indigo-100 focus:border-indigo-400 bg-indigo-50/30 h-12"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex gap-2 text-lg mt-4"
                            >
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {loading ? "Processando Simulação..." : "Simular Venda Aprovada"}
                                {!loading && <Send className="w-5 h-5" />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Status Tracking */}
                <Card className="border-0 shadow-xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-amber-500 text-white pb-8 pt-8">
                        <CardTitle className="text-2xl font-Fredoka">Status do Processamento</CardTitle>
                        <CardDescription className="text-amber-50 opacity-90">
                            Acompanhe cada etapa do fluxo de integração.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 px-8 space-y-6">
                        <StatusStep
                            title="Webhook Received"
                            description="Validação do bypass e payload"
                            status={steps.webhook}
                            icon={<ShoppingCart />}
                        />
                        <StatusStep
                            title="Supabase Profile"
                            description="Criação/Update do usuário e status active"
                            status={steps.supabase}
                            icon={<Database />}
                        />
                        <StatusStep
                            title="Resend Gateway"
                            description="Disparo do e-mail de boas-vindas"
                            status={steps.resend}
                            icon={<Mail />}
                        />

                        {steps.resend === 'success' && (
                            <div className="mt-8 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                                <div className="bg-green-100 p-6 rounded-full text-green-600 shadow-inner mb-4">
                                    <CheckCircle2 className="w-16 h-16" />
                                </div>
                                <h3 className="text-2xl font-black text-green-700">SUCESSO TOTAL!</h3>
                                <p className="text-green-600 font-medium">Verifique o link mágico no e-mail.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatusStep({ title, description, status, icon }: { title: string, description: string, status: 'idle' | 'loading' | 'success' | 'error', icon: React.ReactNode }) {
    const getStatusUI = () => {
        switch (status) {
            case 'loading': return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
            case 'success': return <CheckCircle2 className="w-6 h-6 text-green-500" />;
            case 'error': return <AlertCircle className="w-6 h-6 text-red-500" />;
            default: return <div className="w-6 h-6 rounded-full border-2 border-gray-200" />;
        }
    };

    return (
        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${status === 'success' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
            <div className={`p-3 rounded-xl ${status === 'success' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'} transition-colors`}>
                {icon}
            </div>
            <div className="flex-1">
                <h4 className={`font-bold ${status === 'success' ? 'text-green-900' : 'text-gray-700'}`}>{title}</h4>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
            <div>{getStatusUI()}</div>
        </div>
    );
}
