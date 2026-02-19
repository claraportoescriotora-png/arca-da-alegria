import { useState, useEffect } from 'react';
import { ArrowRight, Heart, Zap, Brain, Users, BookOpen, Gamepad2, Sparkles, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export default function Landing() {
    const [currentGameIndex, setCurrentGameIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const games = [
        {
            title: "Quebra-Cabeça Cristão",
            description: "Foco e paciência. Montar cenas bíblicas desenvolve a concentração. Enquanto encaixa as peças, ele fixa a Palavra no coração.",
            tag: "Raciocínio",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/quebracabecalp.webp",
            color: "bg-blue-100 text-blue-800"
        },
        {
            title: "Subindo ao Céu",
            description: "Reflexos e propósito. Pular obstáculos nas nuvens até encontrar Jesus. Coordenação motora e espiritualidade no mesmo jogo.",
            tag: "Coordenação",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/subindoaoceu.webp",
            color: "bg-sky-100 text-sky-800"
        },
        {
            title: "O Bom Pastor",
            description: "Pensamento rápido. Guiar a ovelha desviando do lobo. Agilidade mental enquanto aprende sobre proteção e cuidado.",
            tag: "Agilidade",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/obompastor.webp",
            color: "bg-green-100 text-green-800"
        },
        {
            title: "Sinais da Vida de Jesus",
            description: "Memória afiada. Jogo da memória com os milagres de Jesus. A cada par encontrado, um sinal gravado na mente.",
            tag: "Memória",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/sinais.webp",
            color: "bg-purple-100 text-purple-800"
        },
        {
            title: "Encontro com Jesus",
            description: "Resolução de problemas. Labirinto até encontrar Jesus. Raciocínio lógico e busca espiritual em um só desafio.",
            tag: "Lógica",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/Encontre%20Jesus.webp",
            color: "bg-yellow-100 text-yellow-800"
        },
        {
            title: "No Ritmo do Céu",
            description: "Coordenação e ritmo. Sequências de cores e sons. Desenvolvimento motor e musical enquanto louva.",
            tag: "Musicalidade",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/noritimodoceu.webp",
            color: "bg-pink-100 text-pink-800"
        },
        {
            title: "Quem Estou Imitando?",
            description: "Conexão familiar. Imitar e adivinhar. Riso, afeto e memória afetiva. Pai e filho juntos no mesmo propósito.",
            tag: "Família",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/quem%20estou%20imitando.webp",
            color: "bg-orange-100 text-orange-800"
        }
    ];

    useEffect(() => {
        if (!isPaused) {
            const timer = setInterval(() => {
                setCurrentGameIndex((prev) => (prev + 1) % games.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [isPaused, games.length]);

    const nextGame = () => setCurrentGameIndex((prev) => (prev + 1) % games.length);
    const prevGame = () => setCurrentGameIndex((prev) => (prev - 1 + games.length) % games.length);

    return (
        <div className="min-h-screen bg-[#FFF8F0] font-fredoka">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b-2 border-purple-100">
                <div className="container max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/logo%20meu%20amiguito%20por%20extenso.webp"
                            alt="Meu Amiguito"
                            className="h-12 w-auto"
                        />
                    </div>
                    <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-soft">
                        Quero acessar agora
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-purple-200 via-purple-300 to-lavender-200 py-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    {/* Cloud decorations */}
                    <div className="absolute top-10 left-10 w-32 h-20 bg-white rounded-full"></div>
                    <div className="absolute top-20 right-20 w-40 h-24 bg-white rounded-full"></div>
                    <div className="absolute bottom-10 left-1/3 w-36 h-22 bg-white rounded-full"></div>
                </div>

                <div className="container max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-6">
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                            Um lugar seguro, alegre e cheio de fé para o seu filho crescer.
                        </h1>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Histórias bíblicas, jogos educativos, atividades criativas e missões espirituais em um só lugar.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <span className="text-gray-800">Acesso imediato</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <span className="text-gray-800">Conteúdo infantil cristão selecionado</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <span className="text-gray-800">Experiências para viver juntos</span>
                            </div>
                        </div>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg flex items-center gap-2 group">
                            Quero acessar agora
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Hero Illustration */}
                    <div className="flex items-center justify-center">
                        <img
                            src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/Daneil%20e%20a%20ovelhinha.webp"
                            alt="Daniel e a ovelhinha"
                            className="w-full max-w-md h-auto"
                        />
                    </div>
                </div>
            </section>

            {/* Problem Cards */}
            <section className="py-20 bg-blue-50">
                <div className="container max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
                        O que está acontecendo com as crianças hoje?
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {/* Card 1 */}
                        <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-soft border-2 border-gray-100">
                            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center overflow-hidden">
                                <img src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/emojitriste.avif" alt="Ansiosa" className="w-10 h-10 object-contain" />
                            </div>
                            <h3 className="font-bold text-gray-900">Mais ansiosas</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Expostas a estímulos rápidos demais, sem descanso.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-soft border-2 border-gray-100">
                            <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                                <img src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/emojiagitado.webp" alt="Agitada" className="w-10 h-10 object-contain" />
                            </div>
                            <h3 className="font-bold text-gray-900">Mais agitadas</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Acostumadas a recompensas instantâneas de conteúdos como TikTok.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-soft border-2 border-gray-100">
                            <div className="w-16 h-16 mx-auto bg-pink-100 rounded-full flex items-center justify-center overflow-hidden">
                                <img src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/emojicerebro.webp" alt="Menos concentrada" className="w-10 h-10 object-contain" />
                            </div>
                            <h3 className="font-bold text-gray-900">Menos concentradas</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Tudo é rápido… nada ensina a permanecer.
                            </p>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-soft border-2 border-gray-100">
                            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                                <img src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/emojifamilia.webp" alt="Distante da família" className="w-10 h-10 object-contain" />
                            </div>
                            <h3 className="font-bold text-gray-900">Mais distantes da família</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Muito entretenimento. Pouca formação.
                            </p>
                        </div>
                    </div>

                    {/* Connection Text */}
                    <div className="max-w-3xl mx-auto text-center space-y-4 text-gray-700 leading-relaxed">
                        <p>
                            <strong>Isso não acontece por acaso.</strong><br />
                            Hoje, muitas portas entram dentro de casa através das telas.
                            E nem sempre aquilo que parece "infantil" carrega valores que edificam.
                        </p>
                        <p>
                            Muitos conteúdos confundem, aceleram e afastam daquilo que realmente importa.
                        </p>
                        <p>
                            Como pais, sentimos que precisamos proteger… mas também precisamos <strong>oferecer algo melhor.</strong>
                        </p>
                    </div>
                </div>
            </section>

            {/* Product Introduction */}
            <section className="py-20 bg-gradient-to-br from-yellow-100 to-yellow-200">
                <div className="container max-w-5xl mx-auto px-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 shadow-soft border-2 border-yellow-200">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="bg-yellow-50 rounded-3xl p-8 flex items-center justify-center min-h-[300px]">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/Daneil%20e%20a%20ovelhinha.webp"
                                    alt="Criança lendo com ovelhinha"
                                    className="w-full max-w-sm h-auto"
                                />
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                    Meu Amiguito nasceu para ser esse "algo melhor".
                                </h2>
                                <p className="text-gray-700 leading-relaxed">
                                    Meu Amiguito não é só um aplicativo. É um <strong>ambiente digital criado com propósito</strong>.
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                    Um espaço onde a criança pode:<br />
                                    <strong>aprender, brincar e crescer</strong> sem se afastar de Deus.
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                    Aqui, o tempo de tela deixa de ser vazio e passa a ser um <strong>tempo de construção.</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-white">
                <div className="container max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
                        Um ambiente digital que trabalha a favor da família
                    </h2>
                    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                        Nada aqui foi colocado por acaso. Existe curadoria. Existe intenção. Existe cuidado espiritual.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🎬</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Conteúdos infantis selecionados</h3>
                                    <p className="text-sm text-gray-600">Vídeos educativos e músicas escolhidas com cuidado</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">📖</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Histórias com valores eternos</h3>
                                    <p className="text-sm text-gray-600">70+ histórias bíblicas para crianças</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🎵</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Músicas que acalmam e ensinam</h3>
                                    <p className="text-sm text-gray-600">Playlist curada de louvor infantil</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🎨</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Atividades que desenvolvem criatividade</h3>
                                    <p className="text-sm text-gray-600">Desenhos para colorir, jogos educativos e mais</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mt-6">
                                <p className="text-center font-bold text-gray-900">
                                    Mais de <span className="text-3xl text-purple-600">130</span> conteúdos escolhidos com responsabilidade
                                </p>
                            </div>
                        </div>

                        {/* Phone Mockup */}
                        <div className="flex items-center justify-center">
                            <img
                                src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/smartphonemockupamiguito.webp"
                                alt="App Meu Amiguito"
                                className="w-full max-w-md h-auto hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Bible Stories */}
            <section className="py-20 bg-gradient-to-br from-blue-100 to-blue-200">
                <div className="container max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
                        Histórias bíblicas que a criança entende e ama
                    </h2>
                    <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Uma biblioteca completa sobre a vida de Jesus. Sem linguagem difícil. Sem distância. Sem formalidade.
                        A criança aprende porque se conecta.
                    </p>

                    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border-2 border-blue-200">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            {[
                                { name: 'Zaqueu', image: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/zaqueunafigueira.webp' },
                                { name: 'Pedro na Prisão', image: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/pedronaprisao.webp' },
                                { name: 'Paulo e Silas', image: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/pauloesilas.webp' },
                                { name: 'O Nascimento de Jesus', image: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/onascimentodejesus.webp' },
                                { name: 'Jonas e o Grande Peixe', image: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/jonaseograndepeixe.webp' },
                                { name: 'Isaque e Rebeca', image: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/isaqueerebeca.webp' },
                                { name: 'O Filho Pródigo', image: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/filhoprodigo.webp' },
                                { name: 'Eliseu e o Azeite', image: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/eliseueoazeite.webp' },
                                { name: 'O Chamado de Abraão', image: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/chamadodeabraao.webp' },
                                { name: 'A Criação do Mundo', image: 'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/acriacaodomundo.webp' }
                            ].map((story, i) => (
                                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft hover:scale-105 transition-transform duration-300">
                                    <img
                                        src={story.image}
                                        alt={story.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                                        <span className="text-white text-xs font-bold text-center">{story.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-center font-bold text-gray-900 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl py-4">
                            Mais de <span className="text-2xl text-purple-600">70</span> histórias disponíveis
                        </p>
                    </div>
                </div>
            </section>

            {/* Daily Missions */}
            <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-100">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Text Column */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                                    Missões diárias — Crie um padrão de fé e ação no seu filho.
                                </h2>
                                <h3 className="text-xl text-green-800 font-medium">
                                    Transforme seu filho em protagonista. Missões diárias sobre:
                                    <br />
                                    Cura • Amizade • Família • Gratidão • Propósito
                                </h3>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white/60 rounded-2xl p-6 shadow-sm border border-green-100">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                                        Benefícios Rápidos
                                    </h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3 text-gray-700 text-sm">
                                            <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-green-700 text-xs">✓</span>
                                            </div>
                                            <span><strong>Cansado de ver seu filho sofrer?</strong> Dê a ele um propósito real.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-700 text-sm">
                                            <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-green-700 text-xs">✓</span>
                                            </div>
                                            <span><strong>Não é joguinho.</strong> São missões de oração que curam e restauram.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-700 text-sm">
                                            <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-green-700 text-xs">✓</span>
                                            </div>
                                            <span><strong>Seu filho vira protagonista.</strong> Guiado por Deus, ele ora e age. A família sente o impacto.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">?</span>
                                        Como Funciona:
                                    </h4>
                                    <div className="grid gap-3">
                                        <div className="flex items-center gap-3 bg-white/40 p-3 rounded-xl">
                                            <div className="font-bold text-2xl text-green-300">1</div>
                                            <div className="text-sm text-gray-800">
                                                <strong>Escolha a batalha:</strong> Cura, emprego, gratidão ou restauração familiar.
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/40 p-3 rounded-xl">
                                            <div className="font-bold text-2xl text-green-300">2</div>
                                            <div className="text-sm text-gray-800">
                                                <strong>Receba a missão:</strong> Passos diários de oração e ação.
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/40 p-3 rounded-xl">
                                            <div className="font-bold text-2xl text-green-300">3</div>
                                            <div className="text-sm text-gray-800">
                                                <strong>Veja o milagre:</strong> A fé vira realidade. Seu filho nunca mais será o mesmo.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 group">
                                QUERO CRIAR ESSE PADRÃO NO MEU FILHO
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Image Column */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-200 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
                            <img
                                src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/mockupmissoes.webp"
                                alt="Missões Diárias"
                                className="relative w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Games Section */}
            <section className="py-20 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 overflow-hidden">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Seu filho mais inteligente enquanto se conecta com Deus.
                        </h2>
                        <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
                            Chega de ansiedade. Nossos jogos treinam memória, raciocínio e coordenação.
                            Enquanto ele joga, a mente e o espírito evoluem.
                        </p>
                    </div>

                    <div className="relative max-w-5xl mx-auto">
                        {/* Carousel Container */}
                        <div
                            className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border-4 border-white relative overflow-hidden"
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-50 -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-50 -ml-32 -mb-32"></div>

                            <div className="relative grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                                {/* Image Side */}
                                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg group">
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                    <img
                                        src={games[currentGameIndex].image}
                                        alt={games[currentGameIndex].title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${games[currentGameIndex].color}`}>
                                            {games[currentGameIndex].tag}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Side */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Gamepad2 className="w-6 h-6 text-purple-500" />
                                        <span className="text-sm font-bold text-purple-500 tracking-wider uppercase">JOGO EM DESTAQUE</span>
                                    </div>

                                    <h3 className="text-3xl font-bold text-gray-900">
                                        {games[currentGameIndex].title}
                                    </h3>

                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        {games[currentGameIndex].description}
                                    </p>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={prevGame}
                                            className="p-3 rounded-full bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-600 transition-all hover:scale-110"
                                            aria-label="Jogo anterior"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <div className="flex gap-2 items-center">
                                            {games.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentGameIndex(idx)}
                                                    className={`w-3 h-3 rounded-full transition-all ${idx === currentGameIndex
                                                        ? 'bg-purple-600 w-8'
                                                        : 'bg-gray-300 hover:bg-purple-300'
                                                        }`}
                                                    aria-label={`Ir para jogo ${idx + 1}`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={nextGame}
                                            className="p-3 rounded-full bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-600 transition-all hover:scale-110"
                                            aria-label="Próximo jogo"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 text-center">
                            <button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-10 py-5 rounded-full text-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto group">
                                <Play className="w-6 h-6 fill-current" />
                                QUERO MEU FILHO MAIS INTELIGENTE E CONECTADO
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Activities Section */}
            <section className="py-20 bg-gradient-to-br from-pink-100 to-purple-100">
                <div className="container max-w-5xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
                        Atividades para colorir — Fé também fora da tela
                    </h2>
                    <p className="text-center text-gray-700 mb-12">
                        Lançamento do Volume 1 — A História de Jesus para Colorir
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-3xl p-6 shadow-soft border-2 border-purple-200">
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl aspect-[3/4] flex items-center justify-center text-6xl mb-4">
                                    📄
                                </div>
                                <p className="text-center text-sm text-gray-600">Página {i} - Para Colorir</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-center font-bold text-gray-900 mt-8 bg-white/70 rounded-2xl py-4">
                        Um verdadeiro kit de escola dominical dentro de casa.
                    </p>
                </div>
            </section>

            {/* Devotional Section */}
            <section className="py-20 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
                <div className="container max-w-5xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
                        Um espaço para pequenos devocionais
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white/80 rounded-3xl p-8 space-y-4 shadow-soft border-2 border-blue-100">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                                🙏
                            </div>
                            <h3 className="font-bold text-xl text-gray-900">Orações simples</h3>
                            <p className="text-gray-600">Orações guiadas adaptadas para crianças</p>
                        </div>

                        <div className="bg-white/80 rounded-3xl p-8 space-y-4 shadow-soft border-2 border-purple-100">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl">
                                ✨
                            </div>
                            <h3 className="font-bold text-xl text-gray-900">Versículos do dia</h3>
                            <p className="text-gray-600">Palavra diária para meditar em família</p>
                        </div>

                        <div className="bg-white/80 rounded-3xl p-8 space-y-4 shadow-soft border-2 border-green-100">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">
                                📖
                            </div>
                            <h3 className="font-bold text-xl text-gray-900">Reflexões infantis</h3>
                            <p className="text-gray-600">Ensinamentos bíblicos em linguagem simples</p>
                        </div>

                        <div className="bg-white/80 rounded-3xl p-8 space-y-4 shadow-soft border-2 border-yellow-100">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-3xl">
                                👨‍👩‍👧
                            </div>
                            <h3 className="font-bold text-xl text-gray-900">Momentos guiados</h3>
                            <p className="text-gray-600">Atividades para fazer juntos com os pais</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl p-8 text-center">
                        <p className="text-lg text-gray-800 leading-relaxed">
                            Meu Amiguito não substitui a família.<br />
                            Ele <strong className="text-purple-700">fortalece aquilo que já começa dentro dela.</strong>
                        </p>
                    </div>
                </div>
            </section>

            {/* Final Message */}
            <section className="py-20 bg-white">
                <div className="container max-w-4xl mx-auto px-6 text-center space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                        Não é só entretenimento.
                    </h2>
                    <div className="space-y-4 text-2xl text-gray-700">
                        <p>É <strong className="text-blue-600">cuidado.</strong></p>
                        <p>É <strong className="text-green-600">formação.</strong></p>
                        <p>É <strong className="text-purple-600">direção.</strong></p>
                    </div>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Uma ajuda prática para pais que desejam ver seus filhos crescerem com base, fé e equilíbrio.
                    </p>
                </div>
            </section>

            {/* Closing CTA */}
            <section className="py-20 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200">
                <div className="container max-w-5xl mx-auto px-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center space-y-6 shadow-xl border-2 border-white">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Acesso completo por um valor simbólico
                        </h2>
                        <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                            Reunimos conteúdos, atividades e experiências que normalmente estariam espalhados… em um único lugar.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-green-500 text-xl">✓</span>
                                <span>Simples de usar</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-green-500 text-xl">✓</span>
                                <span>Seguro</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-green-500 text-xl">✓</span>
                                <span>Feito para famílias</span>
                            </div>
                        </div>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-5 rounded-full text-xl font-bold transition-colors shadow-lg flex items-center gap-3 mx-auto group">
                            Quero começar agora
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Footer Illustration */}
                    <div className="mt-12 flex items-center justify-center gap-8">
                        <div className="text-center">
                            <div className="text-6xl mb-2">👦</div>
                            <p className="text-sm text-gray-700 font-semibold">Daniel</p>
                        </div>
                        <div className="text-center">
                            <div className="text-6xl mb-2">🐑</div>
                            <p className="text-sm text-gray-700 font-semibold">Amiguito</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-purple-900 text-white py-12">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-purple-200">Meu Amiguito</h3>
                            <p className="text-purple-300 text-sm">
                                Um ambiente digital seguro e cheio de fé para o seu filho crescer.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-purple-200">Links</h3>
                            <ul className="space-y-2 text-sm text-purple-300">
                                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-purple-200">Contato</h3>
                            <ul className="space-y-2 text-sm text-purple-300">
                                <li>contato@meuamiguito.com</li>
                                <li>WhatsApp: (XX) XXXXX-XXXX</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-purple-700 pt-6 text-center text-sm text-purple-300">
                        <p>© 2026 Meu Amiguito. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
