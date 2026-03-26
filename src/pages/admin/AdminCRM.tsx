import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Loader2, Search, Calendar, CheckSquare, 
    MessageSquare, Trash2, X, Plus, Clock 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";

// The allowed CRM stages from the database enum
export const CRM_STAGES = [
    'Novo lead', 'Em contato', 'Trial 5d', 'Usando', 
    'Negociação', 'Ganho', 'Perdido', 'Remarketing'
];

interface CRMTask {
    id: string;
    text: string;
    completed: boolean;
}

interface CRMLead {
    id: string;
    user_id: string | null;
    email: string | null;
    stage: string;
    notes: string;
    reminder_date: string | null;
    tasks: CRMTask[];
    created_at: string;
    updated_at: string;
}

function LeadModal({ 
    lead, 
    onClose, 
    onSave 
}: { 
    lead: CRMLead; 
    onClose: () => void;
    onSave: (updated: Partial<CRMLead>) => Promise<void>;
}) {
    const [notes, setNotes] = useState(lead.notes || '');
    const [reminderDate, setReminderDate] = useState(
        lead.reminder_date ? format(parseISO(lead.reminder_date), "yyyy-MM-dd'T'HH:mm") : ''
    );
    const [tasks, setTasks] = useState<CRMTask[]>(lead.tasks || []);
    const [newTaskText, setNewTaskText] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                id: lead.id,
                notes,
                reminder_date: reminderDate ? new Date(reminderDate).toISOString() : null,
                tasks
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const addTask = () => {
        if (!newTaskText.trim()) return;
        setTasks([...tasks, { id: Date.now().toString(), text: newTaskText, completed: false }]);
        setNewTaskText('');
    };

    const toggleTask = (taskId: string) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    };

    const removeTask = (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-5 border-b flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">Detalhes do Lead</h2>
                        <p className="text-slate-500 text-sm">{lead.email}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" /> Notas
                        </Label>
                        <Textarea 
                            rows={4} 
                            placeholder="Informações importantes sobre a evolução deste lead..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Reminder */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" /> Lembrete (Data/Hora)
                        </Label>
                        <Input 
                            type="datetime-local" 
                            value={reminderDate}
                            onChange={(e) => setReminderDate(e.target.value)}
                        />
                    </div>

                    {/* Tasks */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-emerald-500" /> Tarefas
                        </Label>
                        
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Nova tarefa..." 
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                            />
                            <Button type="button" onClick={addTask} disabled={!newTaskText.trim()}>
                                Adicionar
                            </Button>
                        </div>

                        <div className="space-y-2 mt-4">
                            {tasks.length === 0 ? (
                                <p className="text-sm text-slate-400">Nenhuma tarefa cadastrada.</p>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-2 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={task.completed}
                                            onChange={() => toggleTask(task.id)}
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className={`flex-1 text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                            {task.text}
                                        </span>
                                        <button onClick={() => removeTask(task.id)} className="text-slate-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t bg-slate-50 flex items-center justify-between rounded-b-2xl">
                    <div className="text-xs text-slate-400">
                        Criado em: {format(parseISO(lead.created_at), 'dd/MM/yyyy')}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-28">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AdminCRM() {
    const { toast } = useToast();
    const [leads, setLeads] = useState<CRMLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeLead, setActiveLead] = useState<CRMLead | null>(null);

    // D&D state
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // First, sync users
            await supabase.rpc('sync_trial_users_to_crm');

            // Then fetch all CRM leads
            const { data, error } = await supabase
                .from('crm_leads')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setLeads(data || []);
        } catch (error: any) {
            console.error('Error fetching CRM leads:', error);
            toast({ variant: 'destructive', title: 'Erro ao carregar', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const updateLeadStage = async (leadId: string, newStage: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead || lead.stage === newStage) return;

        // Optimistic update
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));

        try {
            const { error } = await supabase
                .from('crm_leads')
                .update({ stage: newStage, updated_at: new Date().toISOString() })
                .eq('id', leadId);
            
            if (error) throw error;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
            loadData(); // revert
        }
    };

    const handleSaveLead = async (updates: Partial<CRMLead>) => {
        try {
            const { error } = await supabase
                .from('crm_leads')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', updates.id);
            if (error) throw error;
            
            toast({ title: 'Lead salvo com sucesso!' });
            setLeads(prev => prev.map(l => l.id === updates.id ? { ...l, ...updates } : l));
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
            throw error;
        }
    };

    // --- HTML5 Drag and Drop Handlers ---
    const onDragStart = (e: React.DragEvent, id: string) => {
        setDraggedLeadId(id);
        // This is required for Firefox to drag properly
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e: React.DragEvent, stage: string) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData("text/plain");
        if (leadId) {
            updateLeadStage(leadId, stage);
        }
        setDraggedLeadId(null);
    };

    const filteredLeads = leads.filter(l => 
        l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] h-[calc(100vh-6rem)] flex flex-col">
            {activeLead && (
                <LeadModal 
                    lead={activeLead} 
                    onClose={() => setActiveLead(null)} 
                    onSave={handleSaveLead} 
                />
            )}

            <div className="mb-6 flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800 flex items-center gap-2">
                        CRM Kanban
                    </h2>
                    <p className="text-slate-500">Gerencie leads, trials e negociações em um quadro interativo.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar lead (email ou notas)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>
            </div>

            {/* Kanban Board Scrolling Area */}
            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-4 h-full min-w-max items-start">
                    {CRM_STAGES.map(stage => {
                        const stageLeads = filteredLeads.filter(l => l.stage === stage);
                        const isDragTarget = draggedLeadId !== null;

                        return (
                            <div 
                                key={stage}
                                className="w-72 bg-slate-200/50 rounded-xl flex flex-col max-h-[100%] border border-slate-200"
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, stage)}
                            >
                                <div className="p-3 border-b border-slate-200/60 flex items-center justify-between bg-slate-100 rounded-t-xl shrink-0">
                                    <h3 className="font-bold text-slate-700 text-sm">{stage}</h3>
                                    <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full font-medium">
                                        {stageLeads.length}
                                    </span>
                                </div>
                                <div className={`flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar transition-colors ${isDragTarget ? 'bg-blue-50/50' : ''}`}>
                                    {stageLeads.map(lead => {
                                        const completedTasksCount = lead.tasks?.filter(t => t.completed).length || 0;
                                        const totalTasks = lead.tasks?.length || 0;
                                        
                                        let reminderWarning = false;
                                        if (lead.reminder_date) {
                                            const remDate = parseISO(lead.reminder_date);
                                            if (remDate < new Date()) reminderWarning = true;
                                        }

                                        return (
                                            <div
                                                key={lead.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, lead.id)}
                                                onClick={() => setActiveLead(lead)}
                                                className={`bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow transition-all group`}
                                            >
                                                <div className="text-sm font-semibold text-slate-800 break-all">
                                                    {lead.email || 'Sem email'}
                                                </div>
                                                
                                                {(totalTasks > 0 || lead.reminder_date || lead.notes) && (
                                                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                                                        {lead.notes && (
                                                            <div className="flex items-center gap-1" title="Contém notas">
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                            </div>
                                                        )}
                                                        {totalTasks > 0 && (
                                                            <div className="flex items-center gap-1" title={`${completedTasksCount}/${totalTasks} tarefas concluídas`}>
                                                                <CheckSquare className="w-3.5 h-3.5" />
                                                                <span>{completedTasksCount}/{totalTasks}</span>
                                                            </div>
                                                        )}
                                                        {lead.reminder_date && (
                                                            <div className={`flex items-center gap-1 ${reminderWarning ? 'text-red-500 font-semibold' : ''}`} title="Lembrete agendado">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>{format(parseISO(lead.reminder_date), 'dd/MM')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #94a3b8;
                }
            `}</style>
        </div>
    );
}
