import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Loader2, Search, Calendar, CheckSquare, 
    MessageSquare, Trash2, X, Plus, Clock, Download, 
    LayoutDashboard, ListTodo, User, DollarSign
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";

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

interface CRMMessage {
    id: string;
    content: string;
    is_from_user: boolean;
    created_at: string;
}

interface CRMLead {
    id: string;
    user_id: string | null;
    email: string | null;
    name: string | null;
    value: number | null;
    social_id: string | null;
    stage: string;
    notes: string;
    reminder_date: string | null;
    tasks: CRMTask[];
    created_at: string;
    updated_at: string;
    profiles?: { created_at: string } | null;
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
    const { toast } = useToast();
    const [notes, setNotes] = useState(lead.notes || '');
    const [name, setName] = useState(lead.name || '');
    const [valueStr, setValueStr] = useState(lead.value ? lead.value.toString() : '');
    const [reminderDate, setReminderDate] = useState(
        lead.reminder_date ? format(parseISO(lead.reminder_date), "yyyy-MM-dd'T'HH:mm") : ''
    );
    const [tasks, setTasks] = useState<CRMTask[]>(lead.tasks || []);
    const [newTaskText, setNewTaskText] = useState('');
    const [saving, setSaving] = useState(false);

    // Chat states
    const [messages, setMessages] = useState<CRMMessage[]>([]);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');

    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('crm_messages')
                .select('*')
                .eq('lead_id', lead.id)
                .order('created_at', { ascending: true });
            
            if (data) setMessages(data);
        };
        fetchMessages();
    }, [lead.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                id: lead.id,
                name: name.trim() || null,
                value: valueStr ? parseFloat(valueStr) : null,
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

    const sendReply = async () => {
        if (!replyText.trim() || !lead.social_id) return;
        setSendingReply(true);
        try {
            // Placeholder for calling your Vercel endpoint that calls FB Graph API
            // For now, we simulate success and save message to local DB
            
            // 1. Send to FB (would be a real fetch to api/fb-send)
            // await fetch('/api/fb-send', { method: 'POST', body: JSON.stringify({ recipientId: lead.social_id, text: replyText }) });

            // 2. Save locally
            const newMsg = {
                lead_id: lead.id,
                content: replyText.trim(),
                is_from_user: false
            };
            const { data, error } = await supabase.from('crm_messages').insert(newMsg).select('*').single();
            if (error) throw error;

            if (data) setMessages([...messages, data]);
            setReplyText('');
            
            // Auto-move lead to "Em contato" if it was "Novo lead"
            if (lead.stage === 'Novo lead') {
                await onSave({ id: lead.id, stage: 'Em contato' });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro ao enviar mensagem', description: e.message });
        } finally {
            setSendingReply(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col">
                <div className="p-5 border-b flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            Detalhes do Lead
                            {lead.social_id && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">Instagram Linked</span>}
                        </h2>
                        <p className="text-slate-500 text-sm">{lead.email || lead.social_id || 'Sem contato'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex border-b">
                    <button 
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600 flex-1' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Informações & Tarefas
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'border-blue-600 text-blue-600 flex-1' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Chat (Instagram)
                        {messages.length > 0 && <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full text-xs">{messages.length}</span>}
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {activeTab === 'details' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-500" /> Nome
                            </Label>
                            <Input 
                                placeholder="Nome do contato..." 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Value */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" /> Valor (R$) Previsto/Fechado
                            </Label>
                            <Input 
                                type="number"
                                step="any"
                                placeholder="0.00" 
                                value={valueStr}
                                onChange={(e) => setValueStr(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" /> Notas
                        </Label>
                        <Textarea 
                            rows={3} 
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
                            <CheckSquare className="w-4 h-4 text-emerald-500" /> Tarefas do Lead
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
                        </>
                    ) : (
                        <div className="h-full flex flex-col -mx-2 -my-2">
                            {lead.social_id ? (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 rounded-lg custom-scrollbar">
                                        {messages.length === 0 ? (
                                            <div className="text-center py-10 text-slate-400 text-sm">Nenhuma mensagem neste chat.</div>
                                        ) : (
                                            messages.map(msg => (
                                                <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.is_from_user ? 'self-start items-start' : 'self-end items-end ml-auto'}`}>
                                                    <div className={`p-3 rounded-2xl text-sm ${msg.is_from_user ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 mt-1">{format(parseISO(msg.created_at), 'dd/MM HH:mm')}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="pt-4 flex gap-2">
                                        <Input 
                                            placeholder="Digite sua resposta e tecle Enter..." 
                                            value={replyText} 
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                                        />
                                        <Button onClick={sendReply} disabled={sendingReply || !replyText.trim()} className="bg-blue-600 hover:bg-blue-700">
                                            {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-20 text-slate-400">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Este lead não possui Social ID do Instagram/Facebook.</p>
                                    <p className="text-sm mt-1">O chat está disponível apenas para contatos originados via integração Meta.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t bg-slate-50 flex items-center justify-between rounded-b-2xl">
                    <div className="text-xs text-slate-400 flex flex-col">
                        <span>Criado no CRM: {format(parseISO(lead.created_at), 'dd/MM/yyyy')}</span>
                        {lead.profiles?.created_at && (
                            <span>Conta no App: {format(parseISO(lead.profiles.created_at), 'dd/MM/yyyy')}</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-28">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar
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
    const [activeTab, setActiveTab] = useState<'kanban' | 'tasks'>('kanban');

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
            // Join profiles created_at for trial length calc
            const { data, error } = await supabase
                .from('crm_leads')
                .select('*, profiles!crm_leads_user_id_fkey(created_at)')
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

    const handleExportCSV = () => {
        if (leads.length === 0) {
            toast({ title: 'Nenhum dado para exportar' });
            return;
        }

        const headers = ["ID", "Nome", "Email", "Social ID", "Fase", "Valor", "Data Lembrete", "Data Criacao"];
        
        const rows = leads.map(l => [
            l.id,
            l.name || '',
            l.email || '',
            l.social_id || '',
            l.stage,
            l.value ? l.value.toString() : '0',
            l.reminder_date ? format(parseISO(l.reminder_date), "dd/MM/yyyy HH:mm") : '',
            format(parseISO(l.created_at), "dd/MM/yyyy")
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.map(x => `"${x}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `crm_leads_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- HTML5 Drag and Drop Handlers ---
    const onDragStart = (e: React.DragEvent, id: string) => {
        setDraggedLeadId(id);
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
        l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate daily tasks/reminders
    const leadsWithPendingActions = leads.filter(l => {
        if (!l.reminder_date && (!l.tasks || l.tasks.every(t => t.completed))) return false;
        
        // Has unfinished tasks
        if (l.tasks?.some(t => !t.completed)) return true;
        
        // Or has a reminder that is due today or past due
        if (l.reminder_date) {
            const rd = parseISO(l.reminder_date);
            if (rd <= new Date() || rd.toDateString() === new Date().toDateString()) return true;
        }

        return false;
    });

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

            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800 flex items-center gap-2">
                        CRM Leads
                    </h2>
                    <p className="text-slate-500">Gerencie leads, trials e tarefas diárias.</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="bg-white rounded-lg p-1 border border-slate-200 flex">
                        <button
                            onClick={() => setActiveTab('kanban')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'kanban' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <LayoutDashboard className="w-4 h-4" /> Quadro Kanban
                        </button>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'tasks' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <ListTodo className="w-4 h-4" /> Tarefas do Dia
                            {leadsWithPendingActions.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                                    {leadsWithPendingActions.length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Buscar nome, email ou nota..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>

                    <Button variant="outline" onClick={handleExportCSV} className="bg-white">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {/* TAB: KANBAN */}
            {activeTab === 'kanban' && (
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
                                        <h3 className="font-bold text-slate-700 text-sm whitespace-nowrap overflow-hidden text-ellipsis mr-2">{stage}</h3>
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

                                            // Calculate Trial Info if they have a profile created_at
                                            let trialInfo = null;
                                            if (lead.profiles?.created_at && (stage === 'Trial 5d' || stage === 'Novo lead')) {
                                                const daysActive = differenceInDays(new Date(), parseISO(lead.profiles.created_at));
                                                // Default logic: assume 7 days trial if we don't fetch trial_config explicitly, or just show days active
                                                trialInfo = { daysActive };
                                            }

                                            return (
                                                <div
                                                    key={lead.id}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, lead.id)}
                                                    onClick={() => setActiveLead(lead)}
                                                    className={`bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow transition-all group relative`}
                                                >
                                                    <div className="font-semibold text-slate-800 break-all text-sm leading-tight mb-1">
                                                        {lead.name || lead.email || 'Sem nome/email'}
                                                    </div>
                                                    
                                                    {/* Extra Tags Container */}
                                                    <div className="flex flex-wrap gap-1 mt-1.5 mb-2">
                                                        {lead.value > 0 && (
                                                            <span className="inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                                                R$ {lead.value}
                                                            </span>
                                                        )}
                                                        {lead.social_id && !lead.email && (
                                                            <span className="inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-pink-700">
                                                                Instagram
                                                            </span>
                                                        )}
                                                        {trialInfo !== null && (
                                                            <span className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded ${trialInfo.daysActive >= 7 ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                                                                Trial: Dia {trialInfo.daysActive}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {(totalTasks > 0 || lead.reminder_date || lead.notes) && (
                                                        <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-3 text-xs text-slate-500">
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
                                                                    <span>{format(parseISO(lead.reminder_date), 'dd/MM HH:mm')}</span>
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
            )}

            {/* TAB: TASKS OF THE DAY */}
            {activeTab === 'tasks' && (
                <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                    {leadsWithPendingActions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <CheckSquare className="w-16 h-16 mb-4 text-emerald-300" />
                            <h3 className="text-xl font-bold text-slate-700">Tudo limpo!</h3>
                            <p className="mt-1">Não há tarefas pendentes ou lembretes para hoje.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {leadsWithPendingActions.map(lead => {
                                const unfinishedTasks = lead.tasks?.filter(t => !t.completed) || [];
                                const hasDueReminder = lead.reminder_date && parseISO(lead.reminder_date) <= new Date();

                                return (
                                    <div 
                                        key={lead.id} 
                                        onClick={() => setActiveLead(lead)}
                                        className="border border-slate-200 bg-white shadow-sm hover:shadow relative p-4 rounded-xl cursor-pointer transition-all group"
                                    >
                                        <div className="absolute top-3 right-3 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {lead.stage}
                                        </div>
                                        <h4 className="font-bold text-slate-800 truncate pr-16">{lead.name || lead.email || 'Lead S/ Nome'}</h4>
                                        
                                        <div className="mt-4 space-y-3">
                                            {hasDueReminder && (
                                                <div className="flex items-start gap-2 text-sm bg-red-50 text-red-700 p-2 rounded-md border border-red-100">
                                                    <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                                                    <div>
                                                        <span className="font-semibold block">Lembrete Vencido ou Hoje:</span>
                                                        {format(parseISO(lead.reminder_date!), "dd/MM 'às' HH:mm")}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {unfinishedTasks.length > 0 && (
                                                <div className="text-sm">
                                                    <div className="font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                                                        <CheckSquare className="w-4 h-4" /> 
                                                        Tarefas pendentes ({unfinishedTasks.length})
                                                    </div>
                                                    <ul className="space-y-1 ml-1 text-slate-500">
                                                        {unfinishedTasks.slice(0, 3).map(t => (
                                                            <li key={t.id} className="truncate">• {t.text}</li>
                                                        ))}
                                                        {unfinishedTasks.length > 3 && (
                                                            <li className="text-xs text-blue-500 italic">+ {unfinishedTasks.length - 3} tarefas</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {lead.notes && (
                                                <div className="text-xs text-slate-400 border-t pt-2 line-clamp-2 mt-2">
                                                    <strong>Notas: </strong> {lead.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
            
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
