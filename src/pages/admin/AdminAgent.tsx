
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Key, Archive, Database, Play, Bot, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- SMART THEMES LIST ---
const BIBLICAL_THEMES = [
    "A Criação do Mundo", "A Arca de Noé", "A Torre de Babel", "O Chamado de Abraão",
    "Isaque e Rebeca", "O Sonho de Jacó", "José do Egito", "O Bebê Moisés",
    "A Travessia do Mar Vermelho", "Os Dez Mandamentos", "A Muralha de Jericó",
    "Gideão e os 300", "A Força de Sansão", "Rute e Noemi", "O Menino Samuel",
    "Davi e Golias", "A Sabedoria de Salomão", "Elias e os Corvos", "Eliseu e o Azeite",
    "A Cura de Naamã", "Jonas e o Grande Peixe", "Daniel na Cova dos Leões",
    "A Rainha Ester", "O Nascimento de Jesus", "A Fuga para o Egito",
    "Jesus no Templo", "O Batismo de Jesus", "A Pesca Maravilhosa",
    "Jesus Acalma a Tempestade", "A Multiplicação dos Pães", "O Bom Samaritano",
    "O Filho Pródigo", "Zaqueu, o Pequeno", "A Ressurreição de Lázaro",
    "A Entrada em Jerusalém", "A Última Ceia", "A Ressurreição de Jesus",
    "A Pesca Milagrosa", "A Ascensão de Jesus", "O Dia de Pentecostes",
    "A Cura do Coxo", "A Conversão de Paulo", "Pedro na Prisão",
    "Paulo e Silas", "O Naufrágio de Paulo", "João na Ilha de Patmos"
];

export function AdminAgent() {
    const [activeTab, setActiveTab] = useState("factory");
    const [apiKey, setApiKey] = useState("");
    const [agentsConfig, setAgentsConfig] = useState<any>({});
    const [loadingConfig, setLoadingConfig] = useState(false);

    // Factory State
    const [selectedAgent, setSelectedAgent] = useState('storyteller');
    const [batchQuantity, setBatchQuantity] = useState(1);
    const [themeInput, setThemeInput] = useState("");
    const [processing, setProcessing] = useState(false);

    // Queue & Progress
    const [queue, setQueue] = useState<string[]>([]);
    const [currentTheme, setCurrentTheme] = useState<string | null>(null);
    const [progressLogs, setProgressLogs] = useState<string[]>([]);
    const [completedCount, setCompletedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(1);

    const stopSignal = useRef(false);

    const { toast } = useToast();

    useEffect(() => {
        fetchConfig();
    }, []);

    // --- Config Logic ---
    const fetchConfig = async () => {
        setLoadingConfig(true);
        const { data } = await supabase.from('agent_config').select('*');
        if (data) {
            const configMap: any = {};
            data.forEach(item => {
                configMap[item.key] = item.value;
            });
            setAgentsConfig(configMap);
            setApiKey(configMap['google_gemini_api_key'] || '');
        }
        setLoadingConfig(false);
    };

    const saveConfig = async () => {
        setLoadingConfig(true);
        const updates = [
            { key: 'google_gemini_api_key', value: apiKey },
            ...Object.keys(agentsConfig).filter(k => k.startsWith('agent_') || k === 'google_gemini_model').map(k => ({ key: k, value: agentsConfig[k] }))
        ];

        for (const update of updates) {
            await supabase.from('agent_config').upsert(update);
        }
        toast({ title: "Configurações salvas!" });
        setLoadingConfig(false);
    };

    const updateAgentConfig = (key: string, value: string) => {
        setAgentsConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    const diagnosticModels = async () => {
        addLog("🔍 Solicitando lista de modelos permitidos para sua chave...");
        try {
            const response = await fetch('/api/agent/flow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list_models', agentType: 'storyteller' })
            });
            const result = await response.json();
            if (result.models) {
                const names = result.models.map((m: any) => m.name.replace('models/', ''));
                addLog(`✅ Modelos encontrados: ${names.join(', ')}`);
                console.log("Full Model List:", result.models);
            } else {
                addLog("⚠️ Nenhum modelo retornado. Verifique sua chave API.");
            }
        } catch (err: any) {
            addLog(`❌ Erro no diagnóstico: ${err.message}`);
        }
    };

    // --- Factory Logic (Client-Side Orchestrator) ---

    const prepareQueue = () => {
        let themes: string[] = [];

        if (!themeInput.trim()) {
            // Auto Mode: Pick random themes
            const shuffled = [...BIBLICAL_THEMES].sort(() => 0.5 - Math.random());
            themes = shuffled.slice(0, batchQuantity);
            addLog(`🤖 Modo Automático: Selecionados ${themes.length} temas bíblicos.`);
        } else if (themeInput.includes(',')) {
            // List Mode
            themes = themeInput.split(',').map(t => t.trim()).filter(Boolean);
            // If requested quantity is larger than list, loop list? No, strictly list.
            addLog(`📝 Modo Lista: ${themes.length} temas identificados.`);
        } else {
            // Single Theme (Repeated?)
            // If quantity > 1 and single theme, maybe add "Part 1, Part 2"?
            // Or just repeat.
            for (let i = 0; i < batchQuantity; i++) themes.push(`${themeInput} (Parte ${i + 1})`);
            addLog(`🔁 Modo Repetição: ${themes.length} variações.`);
        }

        return themes;
    };

    const startFactory = async () => {
        if (processing) return;

        setProcessing(true);
        stopSignal.current = false;
        setProgressLogs([]);
        setCompletedCount(0);

        const themes = prepareQueue();
        setQueue(themes);
        setTotalCount(themes.length);

        const { data: { user } } = await supabase.auth.getUser();

        // --- Process Loop ---
        for (let i = 0; i < themes.length; i++) {
            if (stopSignal.current) {
                addLog("🛑 Produção interrompida pelo usuário.");
                break;
            }

            const theme = themes[i];
            setCurrentTheme(theme);
            setCompletedCount(i); // Working on i+1

            addLog(`⏳ [${i + 1}/${themes.length}] Iniciando: "${theme}"...`);

            try {
                // 1. Call API (Single Item)
                const response = await fetch('/api/agent/flow', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'generate_story', // Only Storyteller implemented fully
                        agentType: selectedAgent,
                        params: { theme },
                        userId: user?.id,
                        model: agentsConfig['google_gemini_model'] || 'gemini-2-flash'
                    })
                });

                const result = await response.json();

                if (!response.ok || result.error) {
                    throw new Error(result.error || response.statusText);
                }

                addLog(`✅ Sucesso! História criada: "${result.data}"`);

            } catch (error: any) {
                console.error(error);
                addLog(`❌ Falha em "${theme}": ${error.message}`);
                // Don't break loop, try next
            }

            // 2. Smart Delay (Anti-Rate Limit)
            if (i < themes.length - 1) {
                addLog("⏸️ Esfriando motores (18s para segurança máxima)...");
                await new Promise(res => setTimeout(res, 18000));
            }
        }

        setCompletedCount(themes.length);
        setCurrentTheme(null);
        setProcessing(false);
        toast({ title: "Processamento da fila finalizado!" });
    };

    const stopFactory = () => {
        stopSignal.current = true;
    };

    const addLog = (msg: string) => {
        setProgressLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-fredoka text-slate-800 flex items-center gap-2">
                        <Bot className="w-8 h-8 text-indigo-600" />
                        Fábrica de Conteúdo
                    </h2>
                    <p className="text-slate-500">Produção autônoma de histórias, quizzes e missões.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white p-1 border border-slate-200 rounded-xl w-full md:w-auto">
                    <TabsTrigger value="factory" className="px-8 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 rounded-lg">Fábrica (Execução)</TabsTrigger>
                    <TabsTrigger value="config" className="px-8 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700 rounded-lg">Configurar Agentes</TabsTrigger>
                </TabsList>

                {/* --- FACTORY TAB --- */}
                <TabsContent value="factory" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Control Panel */}
                        <Card className="lg:col-span-1 border-indigo-100 shadow-md h-fit">
                            <CardHeader className="bg-indigo-50/50 pb-4">
                                <CardTitle className="text-indigo-700 text-lg">Painel de Controle</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">

                                {/* Model Selector */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700">Modelo Gemini</label>
                                    <Select
                                        value={agentsConfig['google_gemini_model'] || 'gemini-flash-latest'}
                                        onValueChange={(val) => updateAgentConfig('google_gemini_model', val)}
                                        disabled={processing}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Selecione o modelo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gemini-flash-latest">gemini-flash-latest</SelectItem>
                                            <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                                            <SelectItem value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</SelectItem>
                                            <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-slate-400">
                                        Dica: Use o '2 Flash' para lotes grandes. O '2.5' é limitado.
                                    </p>
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-indigo-500 p-0" onClick={diagnosticModels}>
                                        🔍 Verificar quais modelos minha chave aceita
                                    </Button>
                                </div>

                                {/* Agent Selector */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700">Operador</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant={selectedAgent === 'storyteller' ? 'default' : 'outline'}
                                            className={selectedAgent === 'storyteller' ? 'bg-indigo-600' : ''}
                                            onClick={() => setSelectedAgent('storyteller')}
                                        >
                                            Histórias
                                        </Button>
                                        <Button disabled variant="outline" className="opacity-50 cursor-not-allowed" title="Em breve">
                                            Missões
                                        </Button>
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm font-medium text-slate-700">Lote: {batchQuantity} itens</label>
                                        </div>
                                        <Slider
                                            value={[batchQuantity]}
                                            onValueChange={(val) => setBatchQuantity(val[0])}
                                            max={50}
                                            min={1}
                                            step={1}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Tema (Opcional)</label>
                                        <Textarea
                                            placeholder="Deixe vazio para 'Modo Automático' (Temas Bíblicos) ou liste: 'Davi, Golias, Noé'..."
                                            value={themeInput}
                                            onChange={(e) => setThemeInput(e.target.value)}
                                            rows={3}
                                            disabled={processing}
                                        />
                                        <p className="text-xs text-slate-400">
                                            Vazio = Aleatório da lista interna. <br />
                                            Com Vírgulas = Lista específica.
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                {processing ? (
                                    <Button
                                        variant="destructive"
                                        className="w-full h-12 text-lg shadow-lg"
                                        onClick={stopFactory}
                                    >
                                        🛑 Parar Produção
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full h-12 text-lg shadow-lg shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700"
                                        onClick={startFactory}
                                    >
                                        <Play className="mr-2 fill-current" /> Iniciar Fábrica
                                    </Button>
                                )}

                            </CardContent>
                        </Card>

                        {/* Monitor Panel */}
                        <Card className="lg:col-span-2 border-slate-200 shadow-sm flex flex-col h-[600px]">
                            <CardHeader className="pb-4 border-b border-slate-50">
                                <CardTitle className="text-slate-700 text-lg flex justify-between items-center">
                                    <span>Monitor em Tempo Real</span>
                                    <Badge variant={processing ? "default" : "secondary"} className={processing ? "bg-green-500 hover:bg-green-600" : ""}>
                                        {processing ? "EM OPERAÇÃO" : "AGUARDANDO"}
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    Progresso: {completedCount} / {totalCount}
                                </CardDescription>
                            </CardHeader>

                            <div className="w-full bg-slate-100 h-1">
                                <div
                                    className="bg-green-500 h-1 transition-all duration-500"
                                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                                />
                            </div>

                            <CardContent className="flex-1 p-0 bg-slate-950 overflow-hidden relative font-mono text-sm">
                                <div className="absolute inset-0 p-4 overflow-y-auto space-y-2">
                                    {progressLogs.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-600">
                                            <p>O terminal de logs está vazio.</p>
                                        </div>
                                    ) : (
                                        progressLogs.map((log, i) => (
                                            <div key={i} className={`border-b border-slate-800/50 pb-1 ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-slate-300'}`}>
                                                {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- CONFIG TAB --- */}
                <TabsContent value="config">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações Mestre</CardTitle>
                            <CardDescription>Gerencie as chaves e personalidades de cada agente.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Google Gemini API Key (Mestra)</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="password"
                                        className="pl-9 bg-white"
                                        placeholder="AIzaSy..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="storyteller">
                                    <AccordionTrigger className="font-semibold text-indigo-600">Agente Contador de Histórias</AccordionTrigger>
                                    <AccordionContent>
                                        <Textarea
                                            rows={6}
                                            value={agentsConfig['agent_storyteller_prompt'] || ''}
                                            onChange={(e) => updateAgentConfig('agent_storyteller_prompt', e.target.value)}
                                            className="font-mono text-xs"
                                        />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="gamification">
                                    <AccordionTrigger className="font-semibold text-amber-600">Agente de Gamificação</AccordionTrigger>
                                    <AccordionContent>
                                        <Textarea
                                            rows={6}
                                            value={agentsConfig['agent_gamification_prompt'] || ''}
                                            onChange={(e) => updateAgentConfig('agent_gamification_prompt', e.target.value)}
                                            className="font-mono text-xs"
                                        />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="analyst">
                                    <AccordionTrigger className="font-semibold text-emerald-600">Agente Analista</AccordionTrigger>
                                    <AccordionContent>
                                        <Textarea
                                            rows={6}
                                            value={agentsConfig['agent_analyst_prompt'] || ''}
                                            onChange={(e) => updateAgentConfig('agent_analyst_prompt', e.target.value)}
                                            className="font-mono text-xs"
                                        />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="notifier">
                                    <AccordionTrigger className="font-semibold text-pink-600">Agente de Notificações</AccordionTrigger>
                                    <AccordionContent>
                                        <Textarea
                                            rows={6}
                                            value={agentsConfig['agent_notifier_prompt'] || ''}
                                            onChange={(e) => updateAgentConfig('agent_notifier_prompt', e.target.value)}
                                            className="font-mono text-xs"
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                        </CardContent>
                        <CardFooter>
                            <Button onClick={saveConfig} disabled={loadingConfig}>
                                {loadingConfig && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salvar Todas as Configurações
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
