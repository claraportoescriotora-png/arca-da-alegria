
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Download, Pencil, Trash2, Upload, FileType } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Activity {
    id: string;
    title: string;
    description: string;
    image_url: string;
    pdf_url: string;
    type: string; // 'coloring', 'cutting', 'puzzle'
}

export function AdminDownloads() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog State
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Activity>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    // Import Dialog State
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importUrl, setImportUrl] = useState("");
    const [importing, setImporting] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar atividades" });
        } else {
            setActivities(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.type) {
            toast({ variant: "destructive", title: "Preencha os campos obrigatórios" });
            return;
        }

        setSaving(true);
        try {
            let imageUrl = formData.image_url;
            let pdfUrl = formData.pdf_url;

            // 1. Upload Image if changed
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `activity-img-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('activities')
                    .upload(`covers/${fileName}`, imageFile);
                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('activities').getPublicUrl(`covers/${fileName}`);
                imageUrl = data.publicUrl;
            }

            // 2. Upload PDF if changed
            if (pdfFile) {
                const fileExt = pdfFile.name.split('.').pop();
                const fileName = `activity-pdf-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('activities')
                    .upload(`files/${fileName}`, pdfFile);
                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('activities').getPublicUrl(`files/${fileName}`);
                pdfUrl = data.publicUrl;
            }

            const dataToSave = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                image_url: imageUrl,
                pdf_url: pdfUrl
            };

            let error;
            if (formData.id) {
                const { error: err } = await supabase.from('activities').update(dataToSave).eq('id', formData.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('activities').insert(dataToSave);
                error = err;
            }

            if (error) throw error;

            toast({ title: "Atividade salva com sucesso!" });
            setIsOpen(false);
            fetchActivities();
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja apagar esta atividade?")) return;

        const { error } = await supabase.from('activities').delete().eq('id', id);
        if (error) {
            toast({ variant: "destructive", title: "Erro ao deletar", description: error.message });
        } else {
            toast({ title: "Atividade removida" });
            fetchActivities();
        }
    };

    const openDialog = (activity?: Activity) => {
        if (activity) {
            setFormData(activity);
        } else {
            setFormData({ type: 'coloring' });
        }
        setImageFile(null);
        setPdfFile(null);
        setIsOpen(true);
    };

    const handleImportDrive = async () => {
        if (!importUrl) return;
        setImporting(true);
        try {
            const response = await fetch('/api/import-drive-pdfs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderUrl: importUrl })
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: "Importação Concluída",
                    description: result.message || `${result.imported} arquivos novos importados.`
                });
                setIsImportOpen(false);
                setImportUrl("");
                fetchActivities();
            } else {
                throw new Error(result.error || 'Falha na importação');
            }
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro na importação", description: error.message });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800">Gerenciar Downloads</h2>
                    <p className="text-slate-500">Adicione atividades (PDFs) para as crianças baixarem.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsImportOpen(true)} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Upload className="w-4 h-4 mr-2" />
                        Importar do Drive
                    </Button>
                    <Button onClick={() => openDialog()} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Atividade
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Capa</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>PDF</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                </TableCell>
                            </TableRow>
                        ) : (
                            activities.map((activity) => (
                                <TableRow key={activity.id}>
                                    <TableCell>
                                        {activity.image_url ? (
                                            <img src={activity.image_url} className="w-12 h-16 object-cover rounded shadow-sm bg-slate-100" />
                                        ) : (
                                            <div className="w-12 h-16 bg-slate-100 rounded flex items-center justify-center text-slate-300">
                                                <FileType className="w-6 h-6" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700">{activity.title}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-mono uppercase">
                                            {activity.type}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {activity.pdf_url ? (
                                            <a href={activity.pdf_url} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1 text-sm">
                                                <Download className="w-3 h-3" />
                                                Abrir PDF
                                            </a>
                                        ) : (
                                            <span className="text-slate-400 text-sm">Sem PDF</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog(activity)}>
                                                <Pencil className="w-4 h-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(activity.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                        {!loading && activities.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                    Nenhuma atividade encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{formData.id ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
                        <DialogDescription>
                            Carregue um PDF e uma imagem de capa.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                                value={formData.title || ''}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Desenho de Noé"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.type || 'coloring'}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="coloring">Colorir</option>
                                <option value="cutting">Recortar</option>
                                <option value="puzzle">Quebra-cabeça (Papel)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Capa (Imagem)</Label>
                                <div className="border border-input rounded-md p-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                        className="text-sm w-full"
                                    />
                                    {formData.image_url && !imageFile && (
                                        <p className="text-xs text-green-600 mt-1 truncate">Imagem atual mantida</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Arquivo (PDF)</Label>
                                <div className="border border-input rounded-md p-2">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                        className="text-sm w-full"
                                    />
                                    {formData.pdf_url && !pdfFile && (
                                        <p className="text-xs text-green-600 mt-1 truncate">PDF atual mantido</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar do Google Drive</DialogTitle>
                        <DialogDescription>
                            Cole o link de uma pasta pública do Google Drive para importar os PDFs automaticamente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Link da Pasta (Google Drive)</Label>
                            <Input
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..."
                            />
                            <p className="text-xs text-slate-500">
                                Certifique-se de que a pasta está configurada como "Qualquer pessoa com o link".
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
                        <Button onClick={handleImportDrive} disabled={importing || !importUrl}>
                            {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                            {importing ? 'Importando...' : 'Iniciar Importação'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
