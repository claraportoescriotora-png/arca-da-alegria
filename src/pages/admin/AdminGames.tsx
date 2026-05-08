
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Settings, Upload, Image as ImageIcon, Gamepad2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Game {
    id: string;
    title: string;
    image_url: string;
    game_url?: string;
    type: string;
    status: string; // 'available' | 'coming_soon'
    config: any;
    unlock_delay_days?: number;
    required_mission_day?: number;
}

export function AdminGames() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Config Dialog State
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [gameImageFile, setGameImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('games')
            .select('*')
            .order('title', { ascending: true });

        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar jogos" });
        } else {
            setGames(data || []);
        }
        setLoading(false);
    };

    const toggleActive = async (game: Game) => {
        const newActive = !game.is_active;

        // Optimistic update
        setGames(games.map(g => g.id === game.id ? { ...g, is_active: newActive } : g));

        const { error } = await supabase
            .from('games')
            .update({ is_active: newActive })
            .eq('id', game.id);

        if (error) {
            setGames(games);
            toast({ variant: "destructive", title: "Erro ao atualizar visibilidade", description: error.message });
        } else {
            toast({
                title: newActive ? "Jogo Visível" : "Jogo Oculto",
                description: `O jogo "${game.title}" agora ${newActive ? 'aparecerá' : 'não aparecerá'} para os clientes.`
            });
        }
    };

    const toggleStatus = async (game: Game) => {
        const newStatus = game.status === 'available' ? 'coming_soon' : 'available';

        // Optimistic update
        setGames(games.map(g => g.id === game.id ? { ...g, status: newStatus } : g));

        const { error } = await supabase
            .from('games')
            .update({ status: newStatus })
            .eq('id', game.id);

        if (error) {
            setGames(games);
            toast({ variant: "destructive", title: "Erro ao atualizar status", description: error.message });
        } else {
            toast({
                title: newStatus === 'available' ? "Status: Disponível" : "Status: Em Breve",
                description: `O jogo "${game.title}" agora está marcado como ${newStatus === 'available' ? 'disponível' : 'em breve'}.`
            });
        }
    };

    const openConfig = (game: Game) => {
        setSelectedGame(game);
        setPuzzleImageFile(null);
        setIsConfigOpen(true);
    };

    // Create Dialog State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newGameTitle, setNewGameTitle] = useState("");
    const [newGameType, setNewGameType] = useState("embed");
    const [newGameUrl, setNewGameUrl] = useState("");
    const [creating, setCreating] = useState(false);

    const handleCreateGame = async () => {
        if (!newGameTitle) return;
        if (newGameType === 'embed' && !newGameUrl) {
            toast({ variant: "destructive", title: "URL obrigatória", description: "Informe a URL do jogo embed." });
            return;
        }

        setCreating(true);
        try {
            const defaultImage = 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp';

            const insertData: any = {
                title: newGameTitle,
                type: newGameType,
                status: 'available',
                image_url: defaultImage,
                is_active: true,
            };

            if (newGameType === 'embed') {
                insertData.game_url = newGameUrl.trim();
                insertData.config = { width: 800, height: 600 };
            } else if (newGameType === 'puzzle') {
                insertData.config = { image: defaultImage, pieces: 9 };
            } else {
                insertData.config = {};
            }

            const { error } = await supabase.from('games').insert(insertData);

            if (error) throw error;

            toast({ title: "Jogo Criado!", description: "O novo jogo foi adicionado com sucesso." });
            setIsCreateOpen(false);
            setNewGameTitle("");
            setNewGameType("embed");
            setNewGameUrl("");
            fetchGames();
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao criar jogo", description: error.message });
        } finally {
            setCreating(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!selectedGame) return;

        setUploading(true);
        try {
            let finalUrlWithCacheBuster = selectedGame.image_url;

            // 1. Upload file if selected
            if (gameImageFile) {
                const fileExt = gameImageFile.name.split('.').pop();
                const fileName = `${selectedGame.id}-${Date.now()}.${fileExt}`;
                const filePath = `games/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('activities')
                    .upload(filePath, gameImageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('activities')
                    .getPublicUrl(filePath);

                finalUrlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
            }

            // 2. Update Game Config and Image URL
            const newConfig = { ...selectedGame.config };
            if (gameImageFile) {
                newConfig.image = finalUrlWithCacheBuster;
            }

            const { error: updateError } = await supabase
                .from('games')
                .update({
                    config: newConfig,
                    image_url: finalUrlWithCacheBuster,
                    game_url: selectedGame.game_url || null,
                    unlock_delay_days: Number(selectedGame.unlock_delay_days || 0),
                    required_mission_day: Number(selectedGame.required_mission_day || 0)
                })
                .eq('id', selectedGame.id)
                .select();

            if (updateError) throw updateError;

            toast({ title: "Configurações salvas!", description: "O jogo foi atualizado com sucesso." });

            setGameImageFile(null);
            setIsConfigOpen(false);
            setSelectedGame(null);
            fetchGames();

        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800">Gerenciar Jogos</h2>
                    <p className="text-slate-500">Ative, desative e configure os jogos do app.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    Novo Jogo
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Jogo</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status (Badge)</TableHead>
                            <TableHead>Visível (Cliente)</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                </TableCell>
                            </TableRow>
                        ) : (
                            games.map((game) => (
                                <TableRow key={game.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {game.image_url ? (
                                                <img src={game.image_url} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    <Gamepad2 className="w-5 h-5 text-slate-400" />
                                                </div>
                                            )}
                                            <span className="font-medium text-slate-700">{game.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                                            {game.type}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={game.status === 'available'}
                                                onCheckedChange={() => toggleStatus(game)}
                                            />
                                            <span className={`text-xs ${game.status === 'available' ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
                                                {game.status === 'available' ? 'Disponível' : 'Em Breve'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={game.is_active}
                                                onCheckedChange={() => toggleActive(game)}
                                            />
                                            <span className={`text-xs ${game.is_active ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                                                {game.is_active ? 'Sim' : 'Não'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openConfig(game)}>
                                            <Settings className="w-4 h-4 mr-2" />
                                            Configurar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Game Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Novo Jogo</DialogTitle>
                        <DialogDescription>
                            Adicione um novo jogo à plataforma.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título do Jogo</Label>
                            <Input
                                placeholder="Ex: Corrida no Trânsito"
                                value={newGameTitle}
                                onChange={(e) => setNewGameTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo de Jogo</Label>
                            <select
                                className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newGameType}
                                onChange={(e) => setNewGameType(e.target.value)}
                            >
                                <option value="embed">🌐 Jogo Embed (iframe)</option>
                                <option value="puzzle">Quebra-Cabeça</option>
                                <option value="memory">Jogo da Memória</option>
                                <option value="quiz">Quiz</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>

                        {newGameType === 'embed' && (
                            <div className="space-y-2">
                                <Label>URL do Jogo (src do iframe)</Label>
                                <Input
                                    placeholder="https://html5.gamedistribution.com/GAME_ID/?gd_sdk_referrer_url=..."
                                    value={newGameUrl}
                                    onChange={(e) => setNewGameUrl(e.target.value)}
                                />
                                <p className="text-xs text-slate-500">Cole apenas o valor do atributo <code>src</code> do iframe.</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateGame} disabled={creating || !newGameTitle}>
                            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Criar Jogo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Config Dialog */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Configurar: {selectedGame?.title}</DialogTitle>
                        <DialogDescription>
                            Alterar configurações específicas deste jogo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedGame?.type === 'embed' && (
                            <div className="space-y-2">
                                <Label>URL do Jogo (src do iframe)</Label>
                                <Input
                                    placeholder="https://html5.gamedistribution.com/GAME_ID/?gd_sdk_referrer_url=..."
                                    value={selectedGame?.game_url || ''}
                                    onChange={e => selectedGame && setSelectedGame({ ...selectedGame, game_url: e.target.value })}
                                    className="bg-white font-mono text-xs"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs">Largura (px)</Label>
                                        <Input
                                            type="number"
                                            value={selectedGame?.config?.width || 800}
                                            onChange={e => selectedGame && setSelectedGame({ ...selectedGame, config: { ...selectedGame.config, width: parseInt(e.target.value) || 800 } })}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Altura (px)</Label>
                                        <Input
                                            type="number"
                                            value={selectedGame?.config?.height || 600}
                                            onChange={e => selectedGame && setSelectedGame({ ...selectedGame, config: { ...selectedGame.config, height: parseInt(e.target.value) || 600 } })}
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400">Largura e altura originais do jogo (para calcular proporção correta na tela).</p>
                            </div>
                        )}

                        {/* Cover Image Upload (Universal) */}
                        <div className="space-y-2">
                            <Label>Capa do Jogo (Imagem)</Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => setGameImageFile(e.target.files?.[0] || null)}
                                />
                                {gameImageFile ? (
                                    <div className="text-center">
                                        <ImageIcon className="w-8 h-8 mx-auto text-green-500 mb-2" />
                                        <p className="text-sm font-medium text-slate-700">{gameImageFile.name}</p>
                                        <p className="text-xs text-slate-500">Clique para mudar</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                        <p className="text-sm font-medium text-slate-700">Clique para escolher uma capa</p>
                                        <p className="text-xs text-slate-500">Apenas se quiser trocar a atual</p>
                                    </div>
                                )}
                            </div>
                            {selectedGame?.image_url && (
                                <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-2">
                                    Capa atual: <a href={selectedGame.image_url} target="_blank" className="text-blue-500 hover:underline truncate max-w-[200px]">{selectedGame.image_url}</a>
                                </div>
                            )}
                        </div>

                        {/* Content Drip Settings */}
                        <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-sm text-blue-800 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Configurações de Gotejamento (Drip)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Dias para Liberar</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={selectedGame?.unlock_delay_days || 0}
                                        onChange={e => selectedGame && setSelectedGame({ ...selectedGame, unlock_delay_days: parseInt(e.target.value) || 0 })}
                                        className="bg-white"
                                    />
                                    <p className="text-[10px] text-slate-500">0 = Liberado imediatamente</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Missão Obrigatória (Dia)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={selectedGame?.required_mission_day || 0}
                                        onChange={e => selectedGame && setSelectedGame({ ...selectedGame, required_mission_day: parseInt(e.target.value) || 0 })}
                                        className="bg-white"
                                    />
                                    <p className="text-[10px] text-slate-500">Obrigatório concluir até o dia X</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveConfig} disabled={uploading}>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar Configuração
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
