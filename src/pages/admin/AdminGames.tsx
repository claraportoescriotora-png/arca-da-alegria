
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Settings, Upload, Image as ImageIcon, Gamepad2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Game {
    id: string;
    title: string;
    image_url: string;
    type: string;
    status: string; // 'available' | 'coming_soon'
    config: any;
}

export function AdminGames() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Config Dialog State
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [puzzleImageFile, setPuzzleImageFile] = useState<File | null>(null);
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

    const toggleStatus = async (game: Game) => {
        const newStatus = game.status === 'available' ? 'coming_soon' : 'available';

        // Optimistic update
        setGames(games.map(g => g.id === game.id ? { ...g, status: newStatus } : g));

        const { error } = await supabase
            .from('games')
            .update({ status: newStatus })
            .eq('id', game.id);

        if (error) {
            // Revert on error
            setGames(games);
            toast({ variant: "destructive", title: "Erro ao atualizar status", description: error.message });
        } else {
            toast({
                title: newStatus === 'available' ? "Jogo Ativado" : "Jogo Desativado",
                description: `O jogo "${game.title}" agora está ${newStatus === 'available' ? 'disponível' : 'em breve'}.`
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
    const [newGameType, setNewGameType] = useState("puzzle");
    const [creating, setCreating] = useState(false);

    const handleCreateGame = async () => {
        if (!newGameTitle) return;

        setCreating(true);
        try {
            // Default Biblical Image to avoid empty/broken state, but NO Vecteezy/Unsplash hardcoding
            const defaultImage = 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/meuamiguitopwaicone.webp';

            const { error } = await supabase
                .from('games')
                .insert({
                    title: newGameTitle,
                    type: newGameType,
                    status: 'available',
                    image_url: newGameType === 'puzzle' ? defaultImage : null,
                    config: newGameType === 'puzzle' ? { image: defaultImage, pieces: 9 } : {},
                    is_active: true
                });

            if (error) throw error;

            toast({ title: "Jogo Criado!", description: "O novo jogo foi adicionado com sucesso." });
            setIsCreateOpen(false);
            setNewGameTitle("");
            setNewGameType("puzzle");
            fetchGames();
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao criar jogo", description: error.message });
        } finally {
            setCreating(false);
        }
    };

    const handlePuzzleUpload = async () => {
        if (!selectedGame || !puzzleImageFile) return;

        setUploading(true);
        try {
            // 1. Upload file to 'activities' bucket
            const fileExt = puzzleImageFile.name.split('.').pop();
            const fileName = `puzzle-${selectedGame.id}-${Date.now()}.${fileExt}`;
            const filePath = `games/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('activities')
                .upload(filePath, puzzleImageFile);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('activities')
                .getPublicUrl(filePath);

            // 3. Add Cache Buster to force UI refresh everywhere
            const finalUrlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

            // 4. Update Game Config and Image URL
            console.log('Update target ID:', selectedGame.id);
            console.log('New image URL:', finalUrlWithCacheBuster);

            const newConfig = { ...selectedGame.config, image: finalUrlWithCacheBuster };

            const { error: updateError, data } = await supabase
                .from('games')
                .update({
                    config: newConfig,
                    image_url: finalUrlWithCacheBuster // Aggressive sync
                })
                .eq('id', selectedGame.id)
                .select(); // Get data back to verify success

            if (updateError) throw updateError;

            if (!data || data.length === 0) {
                console.error('No rows affected by update. ID mismatch or RLS issue.');
                throw new Error('Não foi possível encontrar o jogo no banco para atualizar. Verifique se o ID existe.');
            }

            console.log('Update successful, rows affected:', data.length);

            toast({ title: "Imagem salva com sucesso!", description: "O quebra-cabeça foi atualizado." });

            // Clean up state and force reload
            setPuzzleImageFile(null);
            setIsConfigOpen(false);
            setSelectedGame(null);
            fetchGames();

        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro no salvamento", description: error.message });
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
                            <TableHead>Status</TableHead>
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
                                            <span className={`text-sm ${game.status === 'available' ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
                                                {game.status === 'available' ? 'Ativo' : 'Em Breve'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {game.type === 'puzzle' && (
                                            <Button variant="outline" size="sm" onClick={() => openConfig(game)}>
                                                <Settings className="w-4 h-4 mr-2" />
                                                Configurar
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Game Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
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
                                placeholder="Ex: Quebra-Cabeça da Criação"
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
                                <option value="puzzle">Quebra-Cabeça</option>
                                <option value="memory">Jogo da Memória</option>
                                <option value="quiz">Quiz</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurar: {selectedGame?.title}</DialogTitle>
                        <DialogDescription>
                            Alterar configurações específicas deste jogo.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedGame?.type === 'puzzle' && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Imagem do Quebra-Cabeça</Label>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setPuzzleImageFile(e.target.files?.[0] || null)}
                                    />
                                    {puzzleImageFile ? (
                                        <div className="text-center">
                                            <ImageIcon className="w-8 h-8 mx-auto text-green-500 mb-2" />
                                            <p className="text-sm font-medium text-slate-700">{puzzleImageFile.name}</p>
                                            <p className="text-xs text-slate-500">Clique para mudar</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                            <p className="text-sm font-medium text-slate-700">Clique para escolher uma imagem</p>
                                            <p className="text-xs text-slate-500">JPG, PNG (Max 2MB)</p>
                                        </div>
                                    )}
                                </div>
                                {selectedGame.config?.image && (
                                    <div className="mt-2 text-xs text-slate-500">
                                        Imagem atual: <a href={selectedGame.config.image} target="_blank" className="text-blue-500 hover:underline">Ver Imagem</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancelar</Button>
                        <Button onClick={handlePuzzleUpload} disabled={uploading || !puzzleImageFile}>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar Configuração
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
