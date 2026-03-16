import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2, Plus, Trash2, Save, Edit2, ExternalLink,
    ShoppingCart, X, Check, Package, Users, Search, Link, Copy, Info, Shield
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface ContentItem {
    type: 'video' | 'movie' | 'story' | 'episode' | 'series' | 'game' | 'activity' | 'mission_pack';
    id: string;
    title?: string;
}

interface Product {
    id: string;
    title: string;
    description: string;
    cover_url: string;
    price_label: string;
    payment_url: string;
    content: ContentItem[];
    is_active: boolean;
    requires_separate_purchase: boolean;
    webhook_key: string;
    created_at: string;
}

const CONTENT_TYPES = [
    { value: 'video', label: 'Vídeo', table: 'videos' },
    { value: 'movie', label: 'Filme', table: 'movies' },
    { value: 'story', label: 'História', table: 'stories' },
    { value: 'episode', label: 'Episódio', table: 'episodes' },
    { value: 'series', label: 'Série', table: 'series' },
    { value: 'game', label: 'Jogos', table: 'games' },
    { value: 'activity', label: 'Tarefas (Imprimir)', table: 'activities' },
    { value: 'mission_pack', label: 'Missões', table: 'mission_packs' },
];

function ProductForm({
    product,
    onSave,
    onCancel,
}: {
    product: Partial<Product> | null;
    onSave: () => void;
    onCancel: () => void;
}) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: product?.title || '',
        description: product?.description || '',
        cover_url: product?.cover_url || '',
        price_label: product?.price_label || '',
        payment_url: product?.payment_url || '',
        is_active: product?.is_active !== false,
        requires_separate_purchase: (product as any)?.requires_separate_purchase ?? false,
        content: (product?.content || []) as ContentItem[],
    });

    // Content selector state
    const [selectedType, setSelectedType] = useState<string>('video');
    const [contentList, setContentList] = useState<ContentItem[]>([]);
    const [loadingContent, setLoadingContent] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchContentByType(selectedType);
        setSearchQuery('');
    }, [selectedType]);

    const fetchContentByType = async (type: string) => {
        const typeDef = CONTENT_TYPES.find((t) => t.value === type);
        if (!typeDef) return;
        setLoadingContent(true);
        const { data } = await supabase
            .from(typeDef.table)
            .select('id, title')
            .order('created_at', { ascending: false }); // Fetch all items, no limit, to allow correct searching
        setContentList((data || []).map((item: any) => ({ type: type as any, id: item.id, title: item.title })));
        setLoadingContent(false);
    };

    const toggleContent = (item: ContentItem) => {
        const exists = form.content.some((c) => c.id === item.id && c.type === item.type);
        if (exists) {
            setForm({ ...form, content: form.content.filter((c) => !(c.id === item.id && c.type === item.type)) });
        } else {
            setForm({ ...form, content: [...form.content, item] });
        }
    };

    const handleSave = async () => {
        if (!form.title) {
            toast({ variant: 'destructive', title: 'Título é obrigatório' });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                cover_url: form.cover_url,
                price_label: form.price_label,
                payment_url: form.payment_url,
                is_active: form.is_active,
                requires_separate_purchase: form.requires_separate_purchase,
                content: form.content.map(({ type, id }) => ({ type, id })),
            };
            if (product?.id) {
                const { error } = await supabase.from('products').update(payload).eq('id', product.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('products').insert(payload);
                if (error) throw error;
            }
            toast({ title: 'Produto salvo!' });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: e.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">{product?.id ? 'Editar Produto' : 'Novo Produto'}</h2>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <Label>Título *</Label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Pacote Natal Especial" />
                        </div>
                        <div className="space-y-1">
                            <Label>Preço exibido</Label>
                            <Input value={form.price_label} onChange={(e) => setForm({ ...form, price_label: e.target.value })} placeholder="Ex: R$ 47,00" />
                        </div>
                        <div className="space-y-1">
                            <Label>Link de pagamento</Label>
                            <Input value={form.payment_url} onChange={(e) => setForm({ ...form, payment_url: e.target.value })} placeholder="https://hotmart.com/..." />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label>URL da capa</Label>
                            <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." />
                            {form.cover_url && (
                                <img src={form.cover_url} alt="preview" className="h-24 w-auto rounded-lg object-cover mt-2" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            )}
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label>Descrição</Label>
                            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o que está incluído neste pacote..." rows={3} />
                        </div>
                    </div>

                    {/* Content selector */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-4">
                            <h3 className="font-semibold text-slate-700">Conteúdos do Pacote ({form.content.filter(c => c.type === selectedType).length} selecionados nesta categoria)</h3>

                            {/* Tabs and Search */}
                            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                                <div className="flex gap-2 flex-wrap flex-1">
                                    {CONTENT_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedType(t.value);
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedType === t.value ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative w-full xl:w-64 flex-shrink-0">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar conteúdo..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-9 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-3 max-h-72 overflow-y-auto space-y-1 bg-white">
                            {loadingContent ? (
                                <div className="flex flex-col justify-center items-center py-10 text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                                    <span className="text-sm">Carregando conteúdos...</span>
                                </div>
                            ) : (() => {
                                const filteredList = contentList.filter(item =>
                                    (item.title || item.id).toLowerCase().includes(searchQuery.toLowerCase())
                                );

                                if (filteredList.length === 0) {
                                    return (
                                        <div className="text-center py-8">
                                            <p className="text-slate-500 font-medium">Nenhum conteúdo encontrado</p>
                                            {searchQuery && <p className="text-sm text-slate-400 mt-1">Tente buscar com outros termos.</p>}
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
                                            Mostrando {filteredList.length} itens encontrados
                                        </div>
                                        {filteredList.map((item) => {
                                            const selected = form.content.some((c) => c.id === item.id && c.type === item.type);
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleContent(item);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all border ${selected ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium shadow-sm' : 'border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                                        {selected && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="truncate flex-1">{item.title || item.id}</span>
                                                </button>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-sm mt-4">
                        <span className="text-slate-500 font-medium">Total Geral Selecionado:</span>
                        <span className="text-blue-600 font-bold bg-blue-100 px-3 py-1 rounded-full">{form.content.length} itens</span>
                    </div>

                    {/* Access type toggle */}
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 text-sm">Tipo de acesso</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Por padrão, assinantes ativos também acessam este conteúdo sem precisar comprar.
                                    Ative abaixo para conteúdos EXCLUSIVOS (seus ou de terceiros) que devem ser cobrados separadamente, mesmo para quem já é assinante.
                                </p>
                            </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div
                                onClick={() => setForm({ ...form, requires_separate_purchase: !form.requires_separate_purchase })}
                                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${form.requires_separate_purchase ? 'bg-orange-500' : 'bg-slate-300'
                                    }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.requires_separate_purchase ? 'translate-x-5' : 'translate-x-1'
                                    }`} />
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                                {form.requires_separate_purchase
                                    ? '🔒 Compra obrigatória (bloqueia até assinantes)'
                                    : '✅ Complementar (assinantes acessam livremente)'}
                            </span>
                        </label>
                    </div>

                    {/* Webhook Info */}
                    {(product as any)?.webhook_key ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 mt-2">
                            <p className="text-sm text-slate-700 font-semibold flex items-center gap-2">
                                <Link className="w-4 h-4 text-blue-500" /> Integração de Venda Externa (Kiwify, Hotmart, etc.)
                            </p>
                            <p className="text-xs text-slate-500">
                                Copie a URL abaixo e coloque-a como "Webhook" nas configurações do seu produto lá na plataforma de pagamento:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-slate-600 bg-white border border-slate-200 rounded px-2 py-2 flex-1 truncate select-all">
                                    {`https://arca-da-alegria.vercel.app/api/webhook?token=7p9u8wegntp&p=${(product as any).webhook_key}`}
                                </code>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="px-3 flex-shrink-0"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`https://arca-da-alegria.vercel.app/api/webhook?token=7p9u8wegntp&p=${(product as any).webhook_key}`);
                                        toast({ title: 'URL Copiada!' });
                                    }}
                                >
                                    <Copy className="w-4 h-4 mr-2" /> Copiar URL
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 text-center mt-2">
                            <p className="text-sm text-slate-500">
                                <Info className="w-4 h-4 inline mr-1 text-blue-500 mb-0.5" />
                                A URL de integração externa (Webhook) de vendas será gerada automaticamente <strong className="text-slate-700">após você salvar</strong> este produto.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <Label htmlFor="is_active" className="cursor-pointer">Produto ativo (visível na loja)</Label>
                    </div>
                </div>

                <div className="p-6 border-t flex justify-end gap-3 bg-slate-50">
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-28">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar
                    </Button>
                </div>
            </div>
        </div>
    );
}

function UserGrantModal({ product, onClose }: { product: Product; onClose: () => void }) {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [granting, setGranting] = useState(false);
    const [grantedUsers, setGrantedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGrantedUsers();
    }, []);

    const fetchGrantedUsers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('user_products')
            .select(`
                id, 
                user_id, 
                granted_at,
                profiles!inner(email, full_name)
            `)
            .eq('product_id', product.id);
        setGrantedUsers(data || []);
        setLoading(false);
    };

    const handleGrant = async () => {
        if (!email.trim()) return;
        setGranting(true);
        try {
            // Find user by email via profiles table
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email.trim().toLowerCase())
                .single();

            if (profileError || !profileData) {
                toast({ variant: 'destructive', title: 'Usuário não encontrado', description: 'Verifique o e-mail e tente novamente.' });
                return;
            }

            const { error } = await supabase.from('user_products').upsert({
                user_id: profileData.id,
                product_id: product.id,
            }, { onConflict: 'user_id,product_id' });

            if (error) throw error;
            toast({ title: 'Acesso concedido!' });
            setEmail('');
            fetchGrantedUsers();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro', description: e.message });
        } finally {
            setGranting(false);
        }
    };

    const handleRevoke = async (rowId: string) => {
        await supabase.from('user_products').delete().eq('id', rowId);
        fetchGrantedUsers();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-5 border-b flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-slate-800">Gerenciar Acesso</h2>
                        <p className="text-slate-500 text-sm">{product.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex gap-2">
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email do usuário" onKeyDown={(e) => e.key === 'Enter' && handleGrant()} />
                        <Button onClick={handleGrant} disabled={granting || !email.trim()} className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0">
                            {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">Usuários com acesso ({grantedUsers.length})</h3>
                        {loading ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
                        ) : grantedUsers.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">Nenhum usuário com acesso ainda.</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {grantedUsers.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm border border-slate-100">
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-slate-700 font-semibold truncate">{u.profiles?.full_name || 'Sem nome'}</span>
                                            <span className="text-slate-500 text-xs truncate">{u.profiles?.email}</span>
                                        </div>
                                        <button onClick={() => handleRevoke(u.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md ml-2 transition-colors" title="Revogar acesso">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AdminProducts() {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null | undefined>(undefined);
    const [managingProduct, setManagingProduct] = useState<Product | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) toast({ variant: 'destructive', title: 'Erro ao carregar produtos' });
        setProducts(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir' });
        } else {
            toast({ title: 'Produto excluído!' });
            fetchProducts();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl">
            {/* Edit Modal */}
            {editingProduct !== undefined && (
                <ProductForm
                    product={editingProduct}
                    onSave={() => { setEditingProduct(undefined); fetchProducts(); }}
                    onCancel={() => setEditingProduct(undefined)}
                />
            )}

            {/* User grant modal */}
            {managingProduct && (
                <UserGrantModal product={managingProduct} onClose={() => setManagingProduct(null)} />
            )}

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold font-fredoka text-slate-800 flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-amber-500" />
                        Loja de Produtos
                    </h2>
                    <p className="text-slate-500">Gerencie pacotes de conteúdo com links de pagamento.</p>
                </div>
                <Button onClick={() => setEditingProduct(null)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Novo Produto
                </Button>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">Nenhum produto criado ainda</p>
                    <p className="text-sm mt-1">Clique em "Novo Produto" para começar</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {product.cover_url && (
                                <img
                                    src={product.cover_url}
                                    alt={product.title}
                                    className="w-full h-32 object-cover"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            )}
                            <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{product.title}</h3>
                                        {product.price_label && (
                                            <span className="text-sm text-amber-600 font-semibold">{product.price_label}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {product.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                        {product.requires_separate_purchase && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">🔒 Exclusivo</span>
                                        )}
                                    </div>
                                </div>

                                {product.description && (
                                    <p className="text-slate-500 text-sm line-clamp-2">{product.description}</p>
                                )}

                                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                    <Package className="w-3.5 h-3.5" />
                                    <span>{(product.content || []).length} conteúdo(s)</span>
                                </div>

                                {/* Webhook key */}
                                {product.webhook_key && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1">
                                        <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                                            <Link className="w-3 h-3" /> URL do Webhook (para integrações)
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <code className="text-[10px] text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex-1 truncate">
                                                {`https://arca-da-alegria.vercel.app/api/webhook?token=7p9u8wegntp&p=${product.webhook_key}`}
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`https://arca-da-alegria.vercel.app/api/webhook?token=7p9u8wegntp&p=${product.webhook_key}`);
                                                }}
                                                className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded flex-shrink-0"
                                                title="Copiar URL"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400">Configure como webhook na Kiwify/Hotmart passando o email do comprador.</p>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingProduct(product)}
                                        className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setManagingProduct(product)}
                                        className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
                                    >
                                        <Users className="w-3.5 h-3.5 mr-1" /> Acessos
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(product.id)}
                                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
