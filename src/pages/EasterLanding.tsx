import { Check, ArrowRight, Gift, Play, Star, Sparkles, Clock, Smartphone } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function EasterLanding() {
    const kiwifyLink = "https://pay.kiwify.com.br/KAGNE4Z";

    const scrollToOffer = () => {
        document.getElementById('oferta')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#FDFCF0] font-fredoka text-gray-900 pb-20">
            {/* Urgent Header */}
            <header className="bg-purple-700 text-white py-3 px-4 text-center sticky top-0 z-50 shadow-md">
                <p className="text-sm md:text-base font-bold flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-pulse" />
                    Ainda dá tempo! Use hoje mesmo com seu filho.
                </p>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 to-[#FDFCF0] pt-10 pb-16">
                <div className="container max-w-[480px] mx-auto px-6 text-center space-y-6">
                    <div className="inline-block bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-sm font-black mb-2 animate-bounce-soft">
                        OFERTA DE PÁSCOA ✝️
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-black text-purple-800 leading-tight">
                        Esqueceu o presente de Páscoa do seu filho? 😬
                    </h1>
                    
                    <p className="text-xl font-bold text-orange-600">
                        Ainda dá tempo de fazer algo especial — HOJE
                    </p>
                    
                    <p className="text-lg text-gray-600 font-medium">
                        Tudo pronto para você usar agora com seu filho, direto no celular.
                    </p>

                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform hover:scale-105 transition-transform duration-500">
                        <img 
                            src="/assets/pascoa/hero.png" 
                            alt="Páscoa Cristã" 
                            className="w-full h-auto"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent" />
                    </div>

                    <Button 
                        onClick={scrollToOffer}
                        className="w-full py-8 text-xl font-black bg-yellow-400 hover:bg-yellow-500 text-purple-900 rounded-2xl shadow-[0_8px_0_rgb(202,138,4)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-wider"
                    >
                        Quero acessar agora
                    </Button>
                </div>
            </section>

            {/* What you receive */}
            <section className="py-12 bg-white">
                <div className="container max-w-[480px] mx-auto px-6">
                    <div className="bg-purple-50 rounded-3xl p-8 border-2 border-purple-100">
                        <h2 className="text-2xl font-black text-purple-800 mb-6 flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-yellow-500" />
                            O que você recebe:
                        </h2>
                        
                        <ul className="space-y-4">
                            {[
                                "Missões diárias prontas",
                                "Um passo a passo para cada dia da Páscoa",
                                "Filme cristão dentro do app",
                                "Jogos e atividades interativas",
                                "Kits prontos para imprimir",
                                "Momentos guiados para fazer em família"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm border border-purple-50">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="w-4 h-4 text-white font-bold" />
                                    </div>
                                    <span className="font-bold text-gray-700">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Kit Items */}
            <section className="py-12 bg-[#FDFCF0]">
                <div className="container max-w-[480px] mx-auto px-6 space-y-12">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-purple-800 mb-2">🎁 O que vem no kit</h2>
                        <p className="text-gray-500 font-medium">Arquivos prontos para você imprimir e montar agora.</p>
                    </div>

                    {/* Kit Card 1 */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-yellow-200">
                            <img src="/assets/pascoa/kit1.png" alt="Kit Confeiteiro e Chocolates" className="w-full h-auto" />
                            <div className="p-6 bg-gradient-to-b from-white to-purple-50">
                                <div className="grid grid-cols-1 gap-2">
                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-black w-fit">✓ MINI KIT CONFEITEIRO</span>
                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-black w-fit">✓ BIS DA CRUZ</span>
                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-black w-fit">✓ MALETA DE CHOCOLATES</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kit Card 2 */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-purple-200">
                            <img src="/assets/pascoa/kit2.png" alt="Porta Chocolates e Cones" className="w-full h-auto" />
                            <div className="p-6 bg-gradient-to-b from-white to-yellow-50">
                                <div className="grid grid-cols-1 gap-2">
                                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black w-fit">✓ PORTA CHOCOLATE CORAÇÃO</span>
                                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black w-fit">✓ PORTA TABLETE</span>
                                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black w-fit">✓ CONE PIRÂMIDE</span>
                                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black w-fit">✓ PORTA OVO DE PÁSCOA</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kit Card 3 */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-green-200">
                            <img src="/assets/pascoa/kit3.png" alt="Jogos e Atividades" className="w-full h-auto" />
                            <div className="p-6 bg-gradient-to-b from-white to-green-50">
                                <div className="grid grid-cols-1 gap-2">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black w-fit">✓ BINGO DA PÁSCOA</span>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black w-fit">✓ LEITURA SOBRE A PÁSCOA</span>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black w-fit">✓ ÁLBUM DE FIGURINHAS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* App Features */}
            <section className="py-12 bg-purple-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 opacity-20 filter blur-3xl rounded-full" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400 opacity-30 filter blur-3xl rounded-full" />
                
                <div className="container max-w-[480px] mx-auto px-6 text-center space-y-8 relative z-10">
                    <div>
                        <h2 className="text-3xl font-black mb-2 flex items-center justify-center gap-2">
                            <Smartphone className="w-8 h-8 text-yellow-400" />
                            🎬 Dentro do app
                        </h2>
                        <p className="text-purple-200 font-medium italic">Cinema e diversão segura no celular</p>
                    </div>

                    <div className="space-y-10">
                        {/* Movie */}
                        <div className="space-y-4 group">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-purple-700 transform group-hover:rotate-1 transition-transform">
                                <img src="/assets/pascoa/features.png" alt="App Features" className="w-full h-auto" />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="font-black text-lg">FILME "REI DOS REIS"</p>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                        <Play className="w-8 h-8 text-white fill-current" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bonus Game */}
                        <div className="bg-purple-800/50 backdrop-blur-sm p-6 rounded-3xl border-2 border-purple-700 border-dashed">
                            <h3 className="text-xl font-black text-yellow-400 flex items-center justify-center gap-2 mb-2">
                                <Star className="w-6 h-6 fill-current" />
                                🎮 BÔNUS
                            </h3>
                            <p className="text-lg font-bold">Jogo Verdade ou Mentira Bíblico</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Offer Section */}
            <section id="oferta" className="py-20 bg-white">
                <div className="container max-w-[480px] mx-auto px-6 text-center space-y-8">
                    <div className="space-y-2">
                        <p className="text-lg font-bold text-gray-500 uppercase tracking-widest">💰 Oferta Especial</p>
                        <h2 className="text-3xl font-black text-purple-800">Tudo isso por apenas:</h2>
                    </div>

                    <div className="bg-yellow-50 rounded-[3rem] p-10 border-4 border-yellow-400 shadow-xl relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 opacity-20 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                        
                        <div className="relative z-10">
                            <p className="text-xl font-bold text-gray-600 line-through opacity-50">R$ 97,00</p>
                            <div className="flex items-center justify-center leading-none mt-2">
                                <span className="text-2xl font-black text-purple-800 self-start mt-2">R$</span>
                                <span className="text-7xl font-black text-purple-800 tracking-tighter">29,90</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <a href={kiwifyLink} className="block group">
                            <Button className="w-full py-10 text-2xl font-black bg-purple-700 hover:bg-purple-800 text-white rounded-[2rem] shadow-2xl transform active:scale-95 transition-all flex flex-col gap-1 items-center justify-center">
                                <span>QUERO ACESSAR AGORA</span>
                                <span className="text-xs font-bold opacity-80 flex items-center gap-1 uppercase tracking-widest">
                                   <Gift className="w-3 h-3" /> Acesso imediato após a compra
                                </span>
                            </Button>
                        </a>
                        
                        <p className="text-sm font-bold text-gray-400 flex items-center justify-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            Pagamento seguro e criptografado
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="pt-10 pb-20 bg-gray-50 border-t-2 border-gray-100">
                <div className="container max-w-[480px] mx-auto px-6 text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-lg font-bold text-purple-800 italic">"Use ainda hoje com seu filho."</p>
                        <p className="text-sm font-bold text-gray-500">Perfeito para quem deixou para a última hora.</p>
                    </div>
                    
                    <img 
                        src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/logo%20meu%20amiguito%20por%20extenso.webp?width=200" 
                        alt="Meu Amiguito" 
                        className="h-10 w-auto mx-auto opacity-50"
                    />
                </div>
            </footer>

            {/* Float Button (Mobile Only) */}
            <div className="fixed bottom-6 inset-x-6 z-40 md:hidden">
                <a href={kiwifyLink}>
                    <Button className="w-full h-16 text-lg font-black bg-yellow-400 text-purple-900 rounded-full shadow-2xl animate-pulse active:scale-95 transition-all">
                        GARANTIR MEU ACESSO AGORA!
                    </Button>
                </a>
            </div>
        </div>
    );
}
