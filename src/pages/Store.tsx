import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { ShoppingCart, Check, Star, ExternalLink, Loader2, PackageOpen, X, PlayCircle, Trophy, BookOpen, Clock, Info } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface Product {
    id: string;
    title: string;
    description: string | null;
    cover_url: string | null;
    price_label: string | null;
    payment_url: string;
    content: { type: string; id: string }[];
    is_active: boolean;
}

export default function Store() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState<Product[]>([]);
    const [userProductIds, setUserProductIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'novidades' | 'seus_produtos'>('novidades');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, userProductsRes] = await Promise.all([
                supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
                user ? supabase.from('user_products').select('product_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
            ]);

            if (productsRes.error) throw productsRes.error;
            setProducts(productsRes.data ?? []);

            const owned = new Set<string>((userProductsRes.data ?? []).map((row: any) => row.product_id));
            setUserProductIds(owned);
        } catch (e) {
            console.error(e);
            toast.error('Erro ao carregar a loja.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-open product from navigation state if available
    useEffect(() => {
        if (products.length > 0 && location.state?.productId) {
            const productToOpen = products.find(p => p.id === location.state.productId);
            if (productToOpen) {
                setSelectedProduct(productToOpen);
                // Clear the state so it doesn't re-open on refresh
                navigate('.', { replace: true, state: {} });
            }
        }
    }, [products, location.state, navigate]);

    const handleBuy = (product: Product) => {
        if (!product.payment_url) {
            toast.error('Link de pagamento não disponível.');
            return;
        }
        window.open(product.payment_url, '_blank');
        toast.info('Abrindo página de pagamento... após a compra, seu acesso será liberado automaticamente!', { duration: 6000 });
    };

    const displayProducts = activeTab === 'novidades'
        ? products
        : products.filter(p => userProductIds.has(p.id));

    return (
        <div className="min-h-screen bg-slate-900 pb-28 text-slate-100">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-white/10 pt-safe">
                <div className="container max-w-md mx-auto px-4 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <ShoppingCart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-fredoka text-xl font-bold text-white">Loja de Conteúdo</h1>
                            <p className="text-slate-400 text-xs">Desbloqueie pacotes exclusivos</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('novidades')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'novidades'
                                ? 'bg-amber-500 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Novidades
                        </button>
                        <button
                            onClick={() => setActiveTab('seus_produtos')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'seus_produtos'
                                ? 'bg-amber-500 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Acervo ({userProductIds.size})
                        </button>
                    </div>
                </div>
            </header>

            <main className="container max-w-md mx-auto px-4 pt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    </div>
                ) : displayProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                        <PackageOpen className="w-16 h-16 text-slate-600" />
                        <p className="text-slate-400 text-lg font-fredoka">Nenhum produto {activeTab === 'seus_produtos' ? 'adquirido ainda' : 'disponível'}</p>
                        <p className="text-slate-500 text-sm">
                            {activeTab === 'seus_produtos' ? 'Explore a aba Novidades para desbloquear e aprofundar sua jornada!' : 'Volte em breve para novidades!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                        {displayProducts.map((product) => {
                            const owned = userProductIds.has(product.id);
                            return (
                                <div
                                    key={product.id}
                                    onClick={() => setSelectedProduct(product)}
                                    className={`relative flex flex-col rounded-2xl overflow-hidden border cursor-pointer group transition-all duration-300 ${owned
                                        ? 'border-green-500/40 bg-gradient-to-b from-slate-800 to-green-900/10'
                                        : 'border-white/10 bg-slate-800 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1'
                                        }`}
                                >
                                    {/* Cover Image */}
                                    <div className="aspect-[4/3] bg-slate-900 relative">
                                        {product.cover_url ? (
                                            <img
                                                src={product.cover_url}
                                                alt={product.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                                                <ShoppingCart className="w-8 h-8 opacity-20" />
                                            </div>
                                        )}

                                        {/* Status / Price Badge */}
                                        <div className="absolute top-2 right-2">
                                            {owned ? (
                                                <div className="bg-green-500/90 backdrop-blur text-white px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold shadow-sm flex items-center gap-1 border border-green-400/50">
                                                    <Check className="w-3 h-3" /> Liberado
                                                </div>
                                            ) : (
                                                <div className="bg-amber-500/90 backdrop-blur text-white px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold shadow-sm shadow-amber-900/50">
                                                    {product.price_label || 'Premium'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Small Info Section */}
                                    <div className="p-3 flex flex-col flex-1">
                                        <h2 className="font-fredoka font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors">
                                            {product.title}
                                        </h2>

                                        <div className="mt-auto pt-2 flex items-center justify-between text-slate-400 text-xs">
                                            <div className="flex items-center gap-1 border border-slate-700 bg-slate-800/50 px-1.5 py-0.5 rounded-md">
                                                <Star className="w-3 h-3 text-amber-500" />
                                                <span className="font-semibold">{product.content?.length || 0}</span>
                                            </div>
                                            <span className="flex items-center gap-1 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Info className="w-3 h-3" /> Detalhes
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
                    <div
                        className="w-full max-w-md bg-slate-900 sm:rounded-3xl rounded-t-3xl border sm:border-slate-800 border-t-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-5"
                    >
                        {/* Modal Header */}
                        <div className="relative flex-shrink-0 bg-black border-b border-slate-800">
                            {selectedProduct.cover_url ? (
                                <img
                                    src={selectedProduct.cover_url}
                                    alt={selectedProduct.title}
                                    className="w-full max-h-[40vh] object-contain"
                                />
                            ) : (
                                <div className="w-full h-48 flex flex-col items-center justify-center text-slate-600">
                                    <ShoppingCart className="w-12 h-12 opacity-20" />
                                </div>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-colors border border-white/20"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
                            <div>
                                <h2 className="font-fredoka text-2xl font-bold text-white mb-2 leading-tight">
                                    {selectedProduct.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-amber-400 text-xs font-semibold">
                                        <PackageOpen className="w-3.5 h-3.5" />
                                        <span>Pacote Completo</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-blue-400 text-xs font-semibold">
                                        <Star className="w-3.5 h-3.5" />
                                        <span>{selectedProduct.content?.length || 0} Itens Inclusos</span>
                                    </div>
                                </div>
                            </div>

                            <div className="prose prose-invert prose-sm">
                                <h3 className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-2">Sobre este pacote</h3>
                                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedProduct.description || "Nenhuma descrição fornecida para este pacote."}
                                </div>
                            </div>

                            {/* Purchase Action inside modal content */}
                            <div className="pt-4 border-t border-slate-800/50 mt-4">
                                {userProductIds.has(selectedProduct.id) ? (
                                    <div className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-bold">
                                        <Check className="w-5 h-5" />
                                        Conteúdo Desbloqueado
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleBuy(selectedProduct)}
                                        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-amber-500/25 group"
                                    >
                                        <div className="flex items-center gap-2 text-lg">
                                            <ShoppingCart className="w-5 h-5" />
                                            <span>Comprar Agora</span>
                                        </div>
                                        <div className="bg-white/20 px-3 py-1 rounded-lg border border-white/20 group-hover:bg-white/30 transition-colors">
                                            {selectedProduct.price_label || 'Acessar'}
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 z-[60]">
                <BottomNav />
            </div>
        </div>
    );
}
