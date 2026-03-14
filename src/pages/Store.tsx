import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { ShoppingCart, Check, Star, ExternalLink, Loader2, PackageOpen } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { TrialBanner } from '@/components/TrialBanner';
import { useNavigate } from 'react-router-dom';
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
    const [products, setProducts] = useState<Product[]>([]);
    const [userProductIds, setUserProductIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

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

    const handleBuy = (product: Product) => {
        if (!product.payment_url) {
            toast.error('Link de pagamento não disponível.');
            return;
        }
        window.open(product.payment_url, '_blank');
        toast.info('Abrindo página de pagamento... após a compra, seu acesso será liberado automaticamente!', { duration: 6000 });
    };

    return (
        <div className="min-h-screen bg-slate-900 pb-28 text-slate-100">
            <TrialBanner />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-white/10 pt-safe">
                <div className="container max-w-md mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <ShoppingCart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-fredoka text-xl font-bold text-white">Loja de Conteúdo</h1>
                            <p className="text-slate-400 text-xs">Desbloqueie conteúdos exclusivos</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container max-w-md mx-auto px-4 pt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                        <PackageOpen className="w-16 h-16 text-slate-600" />
                        <p className="text-slate-400 text-lg font-fredoka">Nenhum produto disponível ainda</p>
                        <p className="text-slate-500 text-sm">Volte em breve para novidades!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {products.map((product) => {
                            const owned = userProductIds.has(product.id);
                            return (
                                <div
                                    key={product.id}
                                    className={`rounded-2xl overflow-hidden border transition-all ${owned
                                            ? 'border-green-500/40 bg-gradient-to-br from-slate-800 to-green-900/20'
                                            : 'border-white/10 bg-slate-800 hover:border-amber-400/40'
                                        }`}
                                >
                                    {/* Cover */}
                                    {product.cover_url && (
                                        <div className="relative">
                                            <img
                                                src={product.cover_url}
                                                alt={product.title}
                                                className="w-full h-40 object-cover"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                            {owned && (
                                                <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Liberado
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h2 className="font-fredoka text-lg font-bold text-white">{product.title}</h2>
                                                {product.description && (
                                                    <p className="text-slate-300 text-sm mt-1 leading-relaxed">{product.description}</p>
                                                )}
                                            </div>
                                            {product.price_label && !owned && (
                                                <div className="flex-shrink-0 bg-amber-500/20 border border-amber-500/40 px-2 py-1 rounded-lg">
                                                    <span className="text-amber-400 font-bold text-sm">{product.price_label}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content count */}
                                        {product.content && product.content.length > 0 && (
                                            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                                <Star className="w-3 h-3 text-amber-400" />
                                                <span>{product.content.length} conteúdo{product.content.length !== 1 ? 's' : ''} incluído{product.content.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        )}

                                        {/* CTA */}
                                        {owned ? (
                                            <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                                                <Check className="w-4 h-4" />
                                                Você já tem acesso a este pacote!
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleBuy(product)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-amber-500/25"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                {product.price_label ? `Comprar por ${product.price_label}` : 'Comprar'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNav />
            </div>
        </div>
    );
}
