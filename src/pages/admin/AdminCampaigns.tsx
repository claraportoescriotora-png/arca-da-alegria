import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Loader2, Plus, Target, CheckSquare, X, Send, Search } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Campaign {
    id: string;
    title: string;
    type: 'email' | 'push' | 'both';
    subject: string;
    content: string;
    target_tags: string[];
    status: 'draft' | 'sending' | 'sent';
    stats: { emails?: number; pushes?: number; total_leads?: number };
    created_at: string;
}

export function AdminCampaigns() {
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeModal, setActiveModal] = useState<Campaign | 'new' | null>(null);

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('crm_campaigns')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setCampaigns(data || []);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao carregar', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (campaignId: string) => {
        try {
            toast({ title: 'Iniciando envio...', description: 'Aguarde enquanto os leads são processados.' });
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Token ausente');

            // Chamada para Vercel Function
            const res = await fetch('/api/campaigns/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ campaign_id: campaignId })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Erro no envio');

            toast({ title: 'Sucesso!', description: `Campanha enviada para ${result.leadsTargeted} leads (Emails: ${result.emailsSent}, Pushes: ${result.pushesSent})` });
            loadCampaigns();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Falha no disparo', description: error.message });
        }
    };

    const filtered = campaigns.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || (c.subject && c.subject.toLowerCase().includes(searchQuery.toLowerCase())));

    return (
        <div className="max-w-[1200px] h-[calc(100vh-6rem)] flex flex-col">
            {activeModal && (
                <CampaignModal 
                    campaign={activeModal === 'new' ? null : activeModal} 
                    onClose={() => setActiveModal(null)} 
                    onSaved={loadCampaigns} 
                />
            )}

            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800 flex items-center gap-2">
                        <Mail className="w-6 h-6 text-blue-600" /> Campanhas (E-mail e Push)
                    </h2>
                    <p className="text-slate-500">Comunique-se de forma massiva com seus Leads por segmentação.</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Buscar campanha..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>
                    
                    <Button 
                        onClick={() => setActiveModal('new')} 
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Campanha
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Nenhuma campanha encontrada</h3>
                    <p>Comece a espalhar a novidade! Crie campanhas e notificações por push para engajar os clientes.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <th className="p-4 font-medium">Nome e Título</th>
                                <th className="p-4 font-medium text-center">Tipo</th>
                                <th className="p-4 font-medium text-center">Status</th>
                                <th className="p-4 font-medium text-center">Data</th>
                                <th className="p-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{c.title}</div>
                                        <div className="text-sm text-slate-500 truncate max-w-sm">{c.subject}</div>
                                        {c.target_tags && c.target_tags.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {c.target_tags.map(t => (
                                                    <span key={t} className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">#{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-600 uppercase">{c.type}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {c.status === 'draft' && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold">Rascunho</span>}
                                        {c.status === 'sending' && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold flex items-center justify-center gap-1 w-max mx-auto"><Loader2 className="w-3 h-3 animate-spin"/> Enviando</span>}
                                        {c.status === 'sent' && (
                                            <div className="flex flex-col items-center">
                                                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold">Enviado</span>
                                                <span className="text-[10px] text-slate-500 mt-1" title="Leads Processados">{c.stats?.total_leads || 0} leads</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-center text-sm text-slate-500">
                                        {format(parseISO(c.created_at), 'dd/MM/yyyy HH:mm')}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {c.status === 'draft' && (
                                            <Button size="sm" onClick={() => handleSend(c.id)} className="bg-green-600 hover:bg-green-700 text-white">
                                                <Send className="w-3 h-3 mr-1" /> Disparar
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" onClick={() => setActiveModal(c)}>
                                            Ver / Editar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function CampaignModal({ campaign, onClose, onSaved }: { campaign: Campaign | null, onClose: () => void, onSaved: () => void }) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    
    const [title, setTitle] = useState(campaign?.title || '');
    const [type, setType] = useState<'email'|'push'|'both'>(campaign?.type || 'both');
    const [subject, setSubject] = useState(campaign?.subject || '');
    const [content, setContent] = useState(campaign?.content || '');
    const [tags, setTags] = useState<string[]>(campaign?.target_tags || []);
    const [newTagText, setNewTagText] = useState('');

    const isReadOnly = campaign?.status === 'sent' || campaign?.status === 'sending';

    const handleSave = async () => {
        if (!title || !subject || !content) {
            return toast({ variant: 'destructive', title: 'Preencha os campos obrigatórios' });
        }
        
        setSaving(true);
        try {
            const payload = {
                title, type, subject, content, target_tags: tags
            };

            if (campaign) {
                const { error } = await supabase.from('crm_campaigns').update(payload).eq('id', campaign.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('crm_campaigns').insert(payload);
                if (error) throw error;
            }

            toast({ title: 'Campanha salva (Rascunho)!' });
            onSaved();
            onClose();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-5 border-b flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">
                            {campaign ? (isReadOnly ? 'Detalhes da Campanha' : 'Editar Campanha') : 'Nova Campanha'}
                        </h2>
                        {isReadOnly && <p className="text-sm text-red-500">Esta campanha já foi enviada e não pode ser modificada.</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label>Título Interno <span className="text-red-500">*</span></Label>
                            <Input placeholder="Ex: Promoção de Natal" value={title} onChange={e => setTitle(e.target.value)} disabled={isReadOnly} />
                        </div>

                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label>Tipos de Envio</Label>
                            <select 
                                disabled={isReadOnly}
                                value={type}
                                onChange={e => setType(e.target.value as any)}
                                className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 bg-white"
                            >
                                <option value="both">E-mail e Push Notification</option>
                                <option value="email">Somente E-mail</option>
                                <option value="push">Somente Push Notification</option>
                            </select>
                        </div>

                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label className="flex items-center gap-2"><Target className="w-4 h-4 text-purple-600"/> Filtro de Tags (Público-alvo)</Label>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder={tags.length === 0 ? "Adicionar Tag ou Todos" : "Adicionar tag"} 
                                    value={newTagText} 
                                    onChange={e => setNewTagText(e.target.value)} 
                                    disabled={isReadOnly}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (newTagText.trim() && !tags.includes(newTagText.trim())) {
                                                setTags([...tags, newTagText.trim()]);
                                                setNewTagText('');
                                            }
                                        }
                                    }}
                                />
                                <Button type="button" disabled={isReadOnly || !newTagText.trim()} onClick={() => {
                                    if (newTagText.trim() && !tags.includes(newTagText.trim())) {
                                        setTags([...tags, newTagText.trim()]);
                                        setNewTagText('');
                                    }
                                }}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {tags.map(t => (
                                    <span key={t} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                        #{t}
                                        {!isReadOnly && <button onClick={() => setTags(tags.filter(x => x !== t))}><X className="w-3 h-3 hover:text-red-500"/></button>}
                                    </span>
                                ))}
                                {tags.length === 0 && <span className="text-xs text-slate-500">Enviará para <b>Todos os leads</b></span>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label>Assunto do E-mail / Título da Notificação <span className="text-red-500">*</span></Label>
                            <Input placeholder="Escreva o assunto que chamará a atenção..." value={subject} onChange={e => setSubject(e.target.value)} disabled={isReadOnly} />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                <span>Conteúdo do E-mail (Aceita HTML) e Texto Secundário do Push <span className="text-red-500">*</span></span>
                            </Label>
                            <Textarea rows={8} placeholder="<h1>Olá!</h1><p>Temos uma novidade incrível...</p>" value={content} onChange={e => setContent(e.target.value)} disabled={isReadOnly} />
                            <p className="text-xs text-slate-500">Para Notificações Push, o HTML será removido automaticamente (suportando apenas texto puro na notificação de celular).</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t bg-slate-50 flex justify-end gap-2 rounded-b-2xl">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Fechar</Button>
                    {!isReadOnly && (
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckSquare className="w-4 h-4 mr-2" />}
                            Salvar Rascunho
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
