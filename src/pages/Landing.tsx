import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Heart, Zap, Brain, Users, BookOpen, Gamepad2, Sparkles, ChevronLeft, ChevronRight, Play, Check, Shield, Trophy } from 'lucide-react';

export default function Landing() {
    const [isPaused, setIsPaused] = useState(false);
    const [isVideoPaused, setIsVideoPaused] = useState(false);
    const gamesScrollRef = useRef<HTMLDivElement>(null);
    const videosScrollRef = useRef<HTMLDivElement>(null);

    const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
        if (ref.current) {
            const scrollAmount = window.innerWidth < 768 ? 300 : 500;
            ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

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

    const videos = [
        {
            title: "Smilinguido",
            description: "Clássico que marcou época. Aqui seu filho revive as histórias que você amou.",
            tag: "Clássico",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/smiliguido.webp",
            color: "bg-orange-100 text-orange-800"
        },
        {
            title: "Midinho, o Pequeno Missionário",
            description: "Missão e coragem. Aventuras que ensinam fé e propósito.",
            tag: "Missão",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/filmemidinho.webp",
            color: "bg-blue-100 text-blue-800"
        },
        {
            title: "Curtas Premiados",
            description: "Snowbear e outros títulos premiados. Arte de qualidade com valores cristãos.",
            tag: "Arte",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/animaceospremiadas%20(1).webp",
            color: "bg-purple-100 text-purple-800"
        },
        {
            title: "Músicas Cristãs",
            description: "Seleção de músicas infantis que alegram e ensinam a Palavra.",
            tag: "Louvor",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/musicascristas.webp",
            color: "bg-green-100 text-green-800"
        },
        {
            title: "Vídeos Educativos",
            description: "Conteúdo para aprender a ler, escrever e se desenvolver. Sem ideologias.",
            tag: "Educação",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/conteudoeducativo%20(1).webp",
            color: "bg-yellow-100 text-yellow-800"
        },
        {
            title: "Catálogo Crescente",
            description: "Mais de 20h de conteúdo Seguro e Sem Ideologias. Toda semana, novidades.",
            tag: "Novidades",
            image: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/conteudoeducativo%20(1).webp",
            color: "bg-pink-100 text-pink-800"
        }
    ];

    const scrollToOffer = () => {
        document.getElementById('oferta')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#FFF8F0] font-fredoka">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b-2 border-purple-100">
                <div className="container max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/logo%20meu%20amiguito%20por%20extenso.webp?width=300&quality=80&resize=contain"
                            srcSet="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/logo%20meu%20amiguito%20por%20extenso.webp?width=300&quality=80&resize=contain 300w, https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/logo%20meu%20amiguito%20por%20extenso.webp?width=500&quality=80&resize=contain 500w"
                            sizes="(max-width: 640px) 160px, 200px"
                            alt="Meu Amiguito"
                            className="h-12 w-auto"
                            width="649"
                            height="293"
                            loading="eager"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="/"
                            className="hidden sm:block text-purple-600 hover:text-purple-700 font-bold px-4 py-2 hover:bg-purple-50 rounded-full transition-all"
                        >
                            Já sou aluno
                        </a>
                        <button
                            onClick={scrollToOffer}
                            className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-full font-bold transition-all shadow-soft active:scale-95"
                        >
                            Assinar agora
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-purple-200 via-purple-300 to-lavender-200 pt-20 pb-0 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    {/* Cloud decorations */}
                    <div className="absolute top-10 left-10 w-32 h-20 bg-white rounded-full"></div>
                    <div className="absolute top-20 right-20 w-40 h-24 bg-white rounded-full"></div>
                    <div className="absolute bottom-10 left-1/3 w-36 h-22 bg-white rounded-full"></div>
                </div>

                <div className="container max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-end relative z-10">
                    <div className="space-y-6 pb-20">
                        <div className="min-h-[180px] md:min-h-[120px]">
                            <h1 className="text-3xl md:text-5xl font-bold leading-tight text-gray-900">
                                Uma única assinatura você terá: filmes, jogos e missões com conteúdo seguro e valores cristãos para os pequeninos.
                            </h1>
                        </div>
                        <p className="text-lg text-gray-700 leading-relaxed font-medium">
                            Por apenas R$ 97 por ano (menos de R$ 10,03 ao mês), leve: Histórias bíblicas, jogos educativos, atividades criativas e missões espirituais para a sua família.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <span className="text-gray-800 font-medium">+20 horas de conteúdo seguro, puro e sem ideologias.</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <span className="text-gray-800 font-medium">Missões práticas para tirar seu filho do vício da tela e aproximá-lo de você.</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                                <span className="text-gray-800 font-medium">Curadoria rigorosa do Tio Natan, que vive o ministério infantil todos os dias.</span>
                            </div>
                        </div>
                        <button onClick={scrollToOffer} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg flex items-center gap-2 group">
                            Quero acessar agora
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Hero Illustration */}
                    <div className="flex items-end justify-center h-full relative xl:translate-x-8">
                        <img
                            src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/natameseufilhoheroamiguito%20(1).webp?width=900&quality=80"
                            srcSet="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/natameseufilhoheroamiguito%20(1).webp?width=480&quality=80 480w, https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/natameseufilhoheroamiguito%20(1).webp?width=768&quality=80 768w, https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/natameseufilhoheroamiguito%20(1).webp?width=900&quality=80 900w"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            alt="Nathan e seu filho"
                            className="w-full max-w-3xl lg:max-w-[120%] h-auto object-bottom transform scale-110 lg:scale-125 lg:translate-y-8 origin-bottom"
                            width="455"
                            height="548"
                            loading="eager"
                            fetchPriority="high"
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
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/emojitriste.avif?width=80&quality=80"
                                    alt="Ansiosa"
                                    className="w-10 h-10 object-contain"
                                    loading="lazy"
                                    width="40" height="40"
                                />
                            </div>
                            <h3 className="font-bold text-gray-900">Mais ansiosas</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Expostas a estímulos rápidos demais, sem descanso.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-soft border-2 border-gray-100">
                            <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/emojiagitado.webp?width=80&quality=80"
                                    alt="Agitada"
                                    className="w-10 h-10 object-contain"
                                    loading="lazy"
                                    width="40" height="40"
                                />
                            </div>
                            <h3 className="font-bold text-gray-900">Mais agitadas</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Acostumadas a recompensas instantâneas de conteúdos como TikTok.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-soft border-2 border-gray-100">
                            <div className="w-16 h-16 mx-auto bg-pink-100 rounded-full flex items-center justify-center overflow-hidden">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/emojicerebro.webp?width=80&quality=80"
                                    alt="Menos concentrada"
                                    className="w-10 h-10 object-contain"
                                    loading="lazy"
                                    width="40" height="40"
                                />
                            </div>
                            <h3 className="font-bold text-gray-900">Menos concentradas</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Tudo é rápido… nada ensina a permanecer.
                            </p>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-soft border-2 border-gray-100">
                            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/render/image/public/activities/emojifamilia.webp?width=80&quality=80"
                                    alt="Distante da família"
                                    className="w-10 h-10 object-contain"
                                    loading="lazy"
                                    width="40" height="40"
                                />
                            </div>
                            <h3 className="font-bold text-gray-900">Mais distantes da família</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Muito entretenimento. Pouca formação.
                            </p>
                        </div>
                    </div>

                    {/* Connection Text */}
                    <div className="max-w-3xl mx-auto text-center space-y-4 text-gray-700 leading-relaxed text-lg">
                        <p>
                            <strong>Isso não acontece por acaso.</strong><br />
                            O algoritmo não é neutro.
                        </p>
                        <p>
                            Enquanto você tenta ensinar valores, o próximo vídeo sugerido pode estar desconstruindo tudo o que você acredita.
                        </p>
                        <p className="font-bold text-gray-900 text-xl mt-4">
                            Seu filho não precisa de mais estímulo; ele precisa de direção.
                        </p>
                    </div>
                </div>
            </section>

            {/* Quem é Nathan Lima? */}
            <section className="py-20 bg-gray-50 border-t border-gray-100">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-200 rounded-3xl transform rotate-3 scale-105 opacity-50"></div>
                            <img
                                src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/familianatan%20(1).webp"
                                alt="Natan Lima e sua família"
                                className="relative rounded-3xl shadow-2xl w-full h-auto object-cover"
                                width="600"
                                height="800"
                                loading="lazy"
                            />
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                                Quem é Natan Lima?
                            </h2>
                            <h3 className="text-xl text-blue-600 font-bold">
                                Pai, Esposo e Educador: Uma vida dedicada a edificar a próxima geração.
                            </h3>
                            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
                                <p>
                                    Natan não é apenas um rosto no aplicativo; ele é o curador que garante que cada segundo de tela no Meu Amiguito seja uma semente do Reino no coração do seu filho.
                                </p>
                                <ul className="space-y-4 mt-6">
                                    <li className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <strong className="text-gray-900 block mb-1">Criador do Projeto Força Kids:</strong>
                                            <span className="text-sm md:text-base">Idealizador de um movimento em Quixeramobim focado em levar o Avivamento Espiritual para os pequenos através de missões e ensino bíblico.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Heart className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <strong className="text-gray-900 block mb-1">Pai e Esposo:</strong>
                                            <span className="text-sm md:text-base">Vive diariamente a missão de liderar sua família e educar seu filho, o Bernardo, nos princípios inegociáveis da Palavra.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <strong className="text-gray-900 block mb-1">Professor de Escola Dominical:</strong>
                                            <span className="text-sm md:text-base">Especialista em ensino infantil, com anos de experiência traduzindo verdades profundas em linguagem que as crianças amam e entendem.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <strong className="text-gray-900 block mb-1">Sentinela da Curadoria:</strong>
                                            <span className="text-sm md:text-base">Responsável por selecionar e validar as quase 20 horas de conteúdo seguro, garantindo que a "janela digital" da sua casa esteja protegida.</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
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
                                    width="500"
                                    height="575"
                                    loading="lazy"
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
                                width="645"
                                height="677"
                                loading="lazy"
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
                                        loading="lazy"
                                        width="200"
                                        height="200"
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
                                    Missões diárias — A missão começa no app e termina na sala de casa.
                                </h2>
                                <h3 className="text-xl text-green-800 font-medium">
                                    Não é apenas entretenimento passivo. São gatilhos de ação. Transforme seu filho no herói da própria jornada espiritual.
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

                            <button onClick={scrollToOffer} className="w-full sm:w-auto bg-green-800 hover:bg-green-900 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 group">
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
                                width="490"
                                height="513"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Transformation Journeys */}
            <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            As Jornadas de Transformação
                        </h2>
                        <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
                            Cada uma dessas jornadas foi desenhada para resolver um problema real. No mercado, cada "trilha" dessas custaria o valor de um curso individual, mas no Meu Amiguito, elas já estão inclusas no seu acesso.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Box 1 */}
                        <div className="bg-white rounded-3xl p-6 shadow-soft border-2 border-purple-100 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300">
                            <div className="rounded-2xl h-64 overflow-hidden mb-6 shadow-sm flex items-center justify-center">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/box7diascomjesus.webp"
                                    alt="7 Dias com Jesus"
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span>🛡️</span> 7 Dias com Jesus (O Coração Calmo)
                            </h3>
                            <p className="text-gray-600 text-sm flex-grow mb-6 leading-relaxed">
                                Recupere a conexão com seu filho e elimine as birras e a agitação das telas em apenas uma semana. Aplique o método que o Nathan Lima usa com o Bernardo para restaurar a paz e a autoridade no seu lar com muito amor.
                            </p>
                            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100 mt-auto">
                                <span className="text-gray-500 line-through text-sm mr-2">De R$ 47,00</span>
                                <span className="text-green-700 font-bold">por R$ 0,00</span>
                            </div>
                        </div>

                        {/* Box 2 */}
                        <div className="bg-white rounded-3xl p-6 shadow-soft border-2 border-purple-100 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300">
                            <div className="rounded-2xl h-64 overflow-hidden mb-6 shadow-sm flex items-center justify-center">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/18passosparadefendersuafe.webp"
                                    alt="18 passos para defender sua Fé"
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span>⚔️</span> 18 Passos para Defender sua Fé
                            </h3>
                            <p className="text-gray-600 text-sm flex-grow mb-6 leading-relaxed">
                                Dê ao seu filho as respostas inteligentes para as perguntas mais difíceis da escola sem ele parecer o "chato". Um guia prático de inteligência bíblica para blindar a mente dos pequenos contra as ideologias do mundo.
                            </p>
                            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100 mt-auto">
                                <span className="text-gray-500 line-through text-sm mr-2">De R$ 47,00</span>
                                <span className="text-green-700 font-bold">por R$ 0,00</span>
                            </div>
                        </div>

                        {/* Box 3 */}
                        <div className="bg-white rounded-3xl p-6 shadow-soft border-2 border-purple-100 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300">
                            <div className="rounded-2xl h-64 overflow-hidden mb-6 shadow-sm flex items-center justify-center">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/3diasparavenceraansiedade.webp"
                                    alt="3 Dias para Vencer a Ansiedade"
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span>🧠</span> 3 Dias para Vencer a Ansiedade
                            </h3>
                            <p className="text-gray-600 text-sm flex-grow mb-6 leading-relaxed">
                                O protocolo definitivo para quebrar o vício da dopamina digital e devolver o foco e o sono tranquilo ao seu filho. Use armas espirituais e técnicas simples para acalmar o sistema nervoso e restaurar o equilíbrio emocional.
                            </p>
                            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100 mt-auto">
                                <span className="text-gray-500 line-through text-sm mr-2">De R$ 47,00</span>
                                <span className="text-green-700 font-bold">por R$ 0,00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gamification Section */}
            <section className="py-20 bg-gradient-to-br from-yellow-50 to-orange-100 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-10 left-10 w-60 h-60 bg-orange-200/40 rounded-full blur-3xl"></div>
                </div>
                <div className="container max-w-6xl mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-block bg-orange-100 text-orange-800 font-bold px-4 py-2 rounded-full text-sm mb-2 shadow-sm uppercase tracking-wide">
                                Meta Gamificada — Sistema de Conquistas e Recompensas
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                                Transforme Obediência em Superpoder com Nosso Sistema de Recompensas
                            </h2>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                O seu filho não vai apenas "assistir". Ele vai conquistar. Criamos um ambiente onde cada tarefa cumprida gera um estímulo positivo real:
                            </p>
                            <div className="space-y-6 mt-8">
                                <div className="flex gap-4 items-start bg-white/60 p-5 rounded-2xl shadow-sm border border-orange-50">
                                    <div className="text-3xl mt-1">⭐</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">Ganho de XP e Medalhas</h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            A cada missão concluída (como arrumar o quarto ou orar), ele ganha pontos de experiência.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start bg-white/60 p-5 rounded-2xl shadow-sm border border-orange-50">
                                    <div className="text-3xl mt-1">🎁</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">O Grande Banquete da Vitória</h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            Ao final de cada jornada de 7 ou 14 dias, o app libera o acesso a uma recompensa definida pelo pai — um momento especial para a família com jogos exclusivos e celebração.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={scrollToOffer} className="bg-orange-700 hover:bg-orange-800 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 mt-4">
                                Quero esse superpoder para meu filho
                            </button>
                        </div>
                        <div className="flex justify-center xl:justify-end">
                            <div className="relative">
                                {/* Imagem ilustrativa de um alvo */}
                                <div className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-full flex items-center justify-center shadow-xl border-8 border-orange-200 relative">
                                    <div className="w-48 h-48 md:w-60 md:h-60 bg-orange-100 rounded-full flex items-center justify-center border-4 border-orange-300">
                                        <div className="w-32 h-32 md:w-40 md:h-40 bg-orange-500 rounded-full flex items-center justify-center shadow-inner">
                                            <Trophy className="w-16 h-16 md:w-20 md:h-20 text-orange-200 fill-orange-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
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

                    <div className="relative group/carousel">
                        {/* Navigation Buttons */}
                        <button
                            onClick={() => scroll(gamesScrollRef, 'left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 p-3 rounded-full bg-white shadow-xl text-purple-600 hover:bg-purple-600 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 hidden md:flex active:scale-90"
                            aria-label="Anterior"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                        <button
                            onClick={() => scroll(gamesScrollRef, 'right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 p-3 rounded-full bg-white shadow-xl text-purple-600 hover:bg-purple-600 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 hidden md:flex active:scale-90"
                            aria-label="Próximo"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>

                        <div
                            ref={gamesScrollRef}
                            className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide px-4 -mx-4"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {games.map((game, idx) => (
                                <div
                                    key={idx}
                                    className="min-w-[280px] md:min-w-[400px] snap-center rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-500 group/card relative aspect-video bg-white"
                                >
                                    <img
                                        src={game.image}
                                        alt={game.title}
                                        className="w-full h-full object-cover transform group-hover/card:scale-110 transition-transform duration-700"
                                        loading="lazy"
                                    />
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover/card:opacity-90 transition-opacity"></div>

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${game.color.replace('text-', 'text-white bg-').replace('-100', '-600')}`}>
                                                {game.tag}
                                            </span>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-bold leading-tight">
                                            {game.title}
                                        </h3>
                                    </div>

                                    {/* Play Button Indicator (Netflix Style) */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all scale-75 group-hover/card:scale-100">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-xl">
                                                <Play className="w-6 h-6 fill-current ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <button onClick={scrollToOffer} className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-10 py-5 rounded-full text-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto group">
                            <Play className="w-6 h-6 fill-current" />
                            QUERO MEU FILHO MAIS INTELIGENTE E CONECTADO
                        </button>
                    </div>
                </div>
            </section>

            {/* Videos Section */}
            <section className="py-20 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 overflow-hidden">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Vídeos, filmes e aprendizado seguro para seu filho.
                        </h2>
                        <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
                            Mais de 20h de conteúdo Seguro e Sem Ideologias. Só valores cristãos e aprendizado de verdade. Enquanto o YouTube expõe, a gente protege.
                        </p>
                    </div>

                    <div className="relative group/carousel">
                        {/* Navigation Buttons */}
                        <button
                            onClick={() => scroll(videosScrollRef, 'left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 p-3 rounded-full bg-white shadow-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 hidden md:flex active:scale-90"
                            aria-label="Anterior"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                        <button
                            onClick={() => scroll(videosScrollRef, 'right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 p-3 rounded-full bg-white shadow-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 hidden md:flex active:scale-90"
                            aria-label="Próximo"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>

                        <div
                            ref={videosScrollRef}
                            className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide px-4 -mx-4"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {videos.map((video, idx) => (
                                <div
                                    key={idx}
                                    className="min-w-[280px] md:min-w-[400px] snap-center rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-500 group/card relative aspect-video bg-white"
                                >
                                    <img
                                        src={video.image}
                                        alt={video.title}
                                        className="w-full h-full object-cover transform group-hover/card:scale-110 transition-transform duration-700"
                                        loading="lazy"
                                    />
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover/card:opacity-90 transition-opacity"></div>

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${video.color.replace('text-', 'text-white bg-').replace('-100', '-600')}`}>
                                                {video.tag}
                                            </span>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-bold leading-tight">
                                            {video.title}
                                        </h3>
                                    </div>

                                    {/* Play Button Indicator (Netflix Style) */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all scale-75 group-hover/card:scale-100">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl">
                                                <Play className="w-6 h-6 fill-current ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <button onClick={scrollToOffer} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-10 py-5 rounded-full text-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto group">
                            <Play className="w-6 h-6 fill-current" />
                            QUERO PROTEGER MEU FILHO COM CONTEÚDO SEGURO
                        </button>
                    </div>
                </div>
            </section>

            {/* Activities Section */}
            <section className="py-20 bg-gradient-to-br from-pink-100 to-purple-100">
                <div className="container max-w-5xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
                        Atividades para colorir - Fé também fora da tela
                    </h2>
                    <p className="text-center text-gray-700 mb-12">
                        Lançamento do Volume 1 - A História de Jesus para Colorir
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { img: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/Biblia%20para%20Colorir%20A%20historia%20de%20jesus%20-%20Volume%201%20(2).webp", title: "A História de Jesus" },
                            { img: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/bibliajeusnomar.webp", title: "Jesus acalma a tempestade" },
                            { img: "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/pinturasnt.webp", title: "Milagres de Jesus" }
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-3xl p-4 shadow-soft border-2 border-purple-200 group hover:-translate-y-2 transition-transform duration-300">
                                <div className="rounded-2xl aspect-[3/4] overflow-hidden mb-4 shadow-md">
                                    <img
                                        src={item.img}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                </div>
                                <p className="text-center font-bold text-gray-800">{item.title}</p>
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

            {/* Exclusive Bonus Section */}
            <section className="py-20 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-10 w-64 h-64 bg-yellow-200/40 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl"></div>
                </div>

                <div className="container max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16 space-y-4">
                        <div className="inline-block bg-orange-100 text-orange-800 font-bold px-4 py-2 rounded-full text-sm mb-2 shadow-sm uppercase tracking-wide">
                            Bônus Exclusivos: Um Arsenal de Atividades Para a Sua Família
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                            Ganhe R$ 158,00 em Presentes do Tio Natan ao Garantir sua Vaga Hoje
                        </h2>
                        <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
                            Não queremos apenas que seu filho assista; queremos que ele viva a Palavra. Por isso, ao entrar agora, você recebe gratuitamente estes materiais premium para imprimir e usar em casa:
                        </p>
                    </div>

                    {/* Grid Container */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">

                        {/* Bonus 1 */}
                        <div className="bg-white rounded-3xl p-6 shadow-soft border-2 border-orange-100 flex flex-col hover:-translate-y-2 transition-transform duration-300 relative">
                            <div className="absolute -top-4 -right-4 bg-red-700 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow-lg transform rotate-6 z-10">
                                Bônus 1
                            </div>
                            <div className="rounded-2xl aspect-[4/3] overflow-hidden mb-6 shadow-sm flex items-center justify-center bg-gray-50">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/60atividades.webp"
                                    alt="60 Atividades Bíblicas"
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span>🎨</span> 60 Atividades Bíblicas (Combo Completo)
                            </h3>
                            <p className="text-gray-600 text-sm flex-grow mb-6 leading-relaxed">
                                O arsenal definitivo para tirar seu filho da frente das telas. Pinte, recorte e monte cenários épicos como a Cova de Daniel ou a Harpa de Davi. Estimule a criatividade e a coordenação motora com propósito bíblico em cada página.
                            </p>
                            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100 mt-auto">
                                <span className="text-gray-500 line-through text-xs md:text-sm mr-2 block xl:inline">De R$ 47,00</span>
                                <span className="text-green-700 font-bold block xl:inline">por R$ 0,00</span>
                            </div>
                        </div>

                        {/* Bonus 2 */}
                        <div className="bg-white rounded-3xl p-6 shadow-soft border-2 border-orange-100 flex flex-col hover:-translate-y-2 transition-transform duration-300 relative">
                            <div className="absolute -top-4 -right-4 bg-red-700 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow-lg transform rotate-6 z-10">
                                Bônus 2
                            </div>
                            <div className="rounded-2xl aspect-[4/3] overflow-hidden mb-6 shadow-sm flex items-center justify-center bg-gray-50">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/17quebra-cabecas.webp"
                                    alt="17 Quebra-cabeças para Colorir e Montar"
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span>🧩</span> 17 Quebra-cabeças para Colorir e Montar
                            </h3>
                            <p className="text-gray-600 text-sm flex-grow mb-6 leading-relaxed">
                                Treine o raciocínio lógico e a paciência do seu pequeno com desafios visuais que ensinam histórias do Antigo e Novo Testamento. Cada peça montada é uma oportunidade única para fixar um valor cristão e gerar memórias afetivas valiosas entre pais e filhos.
                            </p>
                            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100 mt-auto">
                                <span className="text-gray-500 line-through text-xs md:text-sm mr-2 block xl:inline">De R$ 37,00</span>
                                <span className="text-green-700 font-bold block xl:inline">por R$ 0,00</span>
                            </div>
                        </div>

                        {/* Bonus 3 */}
                        <div className="bg-white rounded-3xl p-6 shadow-soft border-2 border-orange-100 flex flex-col hover:-translate-y-2 transition-transform duration-300 relative">
                            <div className="absolute -top-4 -right-4 bg-red-700 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow-lg transform rotate-6 z-10">
                                Bônus 3
                            </div>
                            <div className="rounded-2xl aspect-[4/3] overflow-hidden mb-6 shadow-sm flex items-center justify-center bg-gray-50">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/boxamaisbela.webp"
                                    alt="Box: As Mais Belas Histórias da Bíblia"
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span>📚</span> Box: As Mais Belas Histórias da Bíblia
                            </h3>
                            <p className="text-gray-600 text-sm flex-grow mb-6 leading-relaxed">
                                Uma curadoria especial com as narrativas mais impactantes das Escrituras, adaptadas com linguagem simples e envolvente. Perfeito para o momento da leitura antes de dormir, garantindo que a última semente no coração do seu filho, antes do sono, seja do Reino.
                            </p>
                            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100 mt-auto">
                                <span className="text-gray-500 line-through text-xs md:text-sm mr-2 block xl:inline">De R$ 37,00</span>
                                <span className="text-green-700 font-bold block xl:inline">por R$ 0,00</span>
                            </div>
                        </div>

                        {/* Bonus 4 */}
                        <div className="bg-white rounded-3xl p-6 shadow-soft border-2 border-orange-100 flex flex-col hover:-translate-y-2 transition-transform duration-300 relative">
                            <div className="absolute -top-4 -right-4 bg-red-700 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow-lg transform rotate-6 z-10">
                                Bônus 4
                            </div>
                            <div className="rounded-2xl aspect-[4/3] overflow-hidden mb-6 shadow-sm flex items-center justify-center bg-gray-50">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/animaisdaarca.webp"
                                    alt="Os Animais da Arca de Noé (Novo!)"
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span>🦁</span> Os Animais da Arca de Noé (Novo!)
                            </h3>
                            <p className="text-gray-600 text-sm flex-grow mb-6 leading-relaxed">
                                Embarque nessa jornada épica de salvação e descubra como Noé protegeu cada espécie sob a direção divina. Um material rico que ensina sobre fidelidade e cuidado com a natureza, ideal para despertar a curiosidade e o amor pelos animais e pela criação.
                            </p>
                            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100 mt-auto">
                                <span className="text-gray-500 line-through text-xs md:text-sm mr-2 block xl:inline">De R$ 37,00</span>
                                <span className="text-green-700 font-bold block xl:inline">por R$ 0,00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WhatsApp Section */}
            <section className="py-16 bg-white border-t border-purple-100">
                <div className="container max-w-4xl mx-auto px-6 text-center space-y-6">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Ficou com alguma dúvida?
                    </h2>
                    <p className="text-lg text-gray-600">
                        Nossa equipe está pronta para te ajudar. Fale com a gente!
                    </p>
                    <a
                        href="https://wa.me/5513997666181?text=Oii%20Tio%20Natan%2C%20vim%20do%20site%20do%20Meu%20amiguito%20e%20gostaria%20de%20tirar%20umas%20d%C3%BAvidas%20antes%20de%20fazer%20parte%20da%20comunidade%21"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-3 bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                        Tirar Dúvidas no WhatsApp
                    </a>
                </div>
            </section>

            {/* Closing CTA */}
            <section id="oferta" className="py-20 bg-gradient-to-br from-purple-600 to-indigo-700 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>
                </div>

                <div className="container max-w-6xl mx-auto px-6 relative z-10">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-white/20">
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* Product Image Side */}
                            <div className="relative group overflow-hidden bg-purple-50 flex items-center justify-center">
                                <img
                                    src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/todososprodutosamuiguitopro.webp"
                                    alt="Pacote Completo Meu Amiguito"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    loading="lazy"
                                />
                                <div className="absolute bottom-6 right-6 bg-yellow-400 text-purple-900 font-bold px-6 py-3 rounded-xl shadow-2xl transform rotate-3 animate-bounce z-10">
                                    Oferta Especial!
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="p-8 md:p-12 md:pl-8 flex flex-col justify-center space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                                        Dê agora o próximo passo e proteja o futuro dos seus filhos.
                                    </h2>
                                    <p className="text-lg text-gray-600 font-medium">
                                        O que você recebe hoje por apenas <span className="text-purple-600 font-bold">R$ 1,86 por semana</span>:
                                    </p>
                                </div>

                                <ul className="space-y-3">
                                    {[
                                        "🎬 20h+ de Conteúdo Seguro: Séries e vídeos sem ideologias (Midinho, Neemias e mais).",
                                        "📖 70+ Histórias Bíblicas: Uma biblioteca completa com a vida de Jesus e heróis da fé.",
                                        "🎮 5 Jogos Educativos: Treino de foco e memória com propósito cristão e diversão.",
                                        "🛡️ 4 Jornadas de Missão: Roteiros práticos para vencer a ansiedade e as birras em casa.",
                                        "🎨 Kit 60 Atividades (PDF): Materiais para montar, como a Harpa de Davi e a Cova de Daniel.",
                                        "🎁 4 Bônus Exclusivos: R$ 158,00 em presentes (Quebra-cabeças, Box de Histórias e mais)."
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-gray-700 text-sm md:text-base">
                                            <div className="flex-shrink-0 w-6 h-6 mt-0.5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
                                            </div>
                                            <span className="font-medium leading-tight">{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="space-y-2 mt-4 text-gray-800 font-bold text-center md:text-left">
                                    <p>Um investimento na eternidade do seu filho.</p>
                                    <p className="text-blue-800">Zero Ideologia.</p>
                                    <p className="text-green-800">Zero Bagunça Digital.</p>
                                </div>

                                <div className="space-y-6 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                        <div className="text-3xl">🛡️</div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Garantia de 7 dias</p>
                                            <p className="text-xs text-gray-600">Se não amar, devolvemos seu dinheiro. Sem perguntas.</p>
                                        </div>
                                    </div>

                                    <div className="text-center md:text-left">
                                        <div className="mb-6">
                                            <div className="mb-4">
                                                <h3 className="text-lg font-bold text-purple-900 block">Assinatura Anual Premium:</h3>
                                                <p className="text-gray-600 text-sm">1 ano inteiro de proteção e conteúdo por apenas</p>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm text-gray-500 font-medium">12x de</span>
                                                <span className="text-5xl font-bold text-purple-600 leading-none">R$ 10,03</span>
                                            </div>
                                            <div className="text-sm text-gray-500 font-medium">
                                                (Ou R$ 97,00 à vista)
                                            </div>
                                            <div className="mt-6 pt-6 border-t border-purple-100">
                                                <p className="text-sm text-gray-600 leading-relaxed italic">
                                                    "O Meu Amiguito é uma plataforma viva! Sua assinatura anual garante novos desenhos, atividades e atualizações constantes para o seu filho, além de manter nossos servidores rodando sem anúncios e 100% seguros."
                                                </p>
                                            </div>
                                        </div>

                                        <a
                                            href="https://pay.kiwify.com.br/6UbyckE"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full bg-green-700 hover:bg-green-800 text-white text-center px-8 py-5 rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-green-500/30 hover:-translate-y-1 group"
                                        >
                                            QUERO MEU FILHO PROTEGIDO
                                        </a>
                                        <p className="text-center text-xs text-gray-500 mt-3">
                                            Compra 100% segura • Acesso imediato
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>


            {/* Footer */}
            <footer className="bg-purple-900 text-white py-12 border-t border-purple-800">
                <div className="container max-w-4xl mx-auto px-6 text-center space-y-6">
                    <img
                        src="https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/logo%20meu%20amiguito%20por%20extenso.webp"
                        alt="Meu Amiguito"
                        className="h-10 w-auto mx-auto"
                        width="649"
                        height="293"
                        loading="lazy"
                    />
                    <div className="text-purple-300 text-xs leading-relaxed space-y-4">
                        <p>
                            © 2026 Meu Amiguito. Todos os direitos reservados.
                        </p>
                        <p>
                            O Meu Amiguito é uma plataforma de curadoria de conteúdo infantojuvenil. Os vídeos, episódios e músicas disponíveis são de propriedade de seus respectivos criadores e estão originalmente publicados em plataformas como YouTube, em acesso gratuito. O aplicativo mantém todas as atribuições, logomarcas e anúncios originais, garantindo que as visualizações sejam contabilizadas nos canais oficiais. Não nos responsabilizamos por indisponibilidade ou alteração de conteúdos de terceiros. Ao utilizar o aplicativo, você concorda que o serviço prestado é de curadoria e organização, e não de licenciamento das obras. Respeitamos a propriedade intelectual. Se você for o detentor de algum direito e desejar a remoção do conteúdo, entre em contato com contato@meuamiguito.com.br e atenderemos em até 24h.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
