import { ArrowRight, Heart, Zap, Brain, Users, BookOpen, Gamepad2, Sparkles } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#FFF8F0] font-fredoka">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b-2 border-purple-100">
                <div className="container max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo/arca-logo-2.png"
                            alt="Meu Amiguito"
                            className="h-10 w-auto"
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
                            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center text-3xl">
                                😟
                            </div>
                            <h3 className="font-bold text-gray-900">Mais ansiosas</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Expostas a estímulos rápidos demais, sem descanso.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-soft border-2 border-gray-100">
                            <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center text-3xl">
                                ⚡
                            </div>
                            <h3 className="font-bold text-gray-900">Mais agitadas</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Acostumadas a recompensas instantâneas de conteúdos como TikTok.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-soft border-2 border-gray-100">
                            <div className="w-16 h-16 mx-auto bg-pink-100 rounded-full flex items-center justify-center text-3xl">
                                🧠
                            </div>
                            <h3 className="font-bold text-gray-900">Menos concentradas</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Tudo é rápido… nada ensina a permanecer.
                            </p>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-soft border-2 border-gray-100">
                            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                                👨‍👩‍👧
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
                                <div className="text-center space-y-4">
                                    <div className="text-8xl">👦📖🐑</div>
                                    <p className="text-sm text-gray-600 italic">Ilustração: Criança lendo com ovelhinha</p>
                                </div>
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

                        {/* Phone Mockups */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-100 rounded-3xl aspect-[9/16] p-4 flex flex-col items-center justify-center border-4 border-gray-300">
                                <div className="bg-white rounded-2xl w-full h-full p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-purple-200 rounded-xl aspect-square flex items-center justify-center text-2xl">📖</div>
                                        <div className="bg-blue-200 rounded-xl aspect-square flex items-center justify-center text-2xl">🎵</div>
                                        <div className="bg-green-200 rounded-xl aspect-square flex items-center justify-center text-2xl">🎨</div>
                                        <div className="bg-yellow-200 rounded-xl aspect-square flex items-center justify-center text-2xl">🎮</div>
                                    </div>
                                    <p className="text-[8px] text-center text-gray-500">Tela Principal</p>
                                </div>
                            </div>

                            <div className="bg-gray-100 rounded-3xl aspect-[9/16] p-4 flex flex-col items-center justify-center border-4 border-gray-300">
                                <div className="bg-white rounded-2xl w-full h-full p-4 space-y-2">
                                    <div className="space-y-2">
                                        <div className="bg-purple-100 rounded-xl p-2 text-[8px]">
                                            <div className="font-bold">História 1</div>
                                        </div>
                                        <div className="bg-blue-100 rounded-xl p-2 text-[8px]">
                                            <div className="font-bold">História 2</div>
                                        </div>
                                        <div className="bg-green-100 rounded-xl p-2 text-[8px]">
                                            <div className="font-bold">História 3</div>
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-center text-gray-500">Biblioteca</p>
                                </div>
                            </div>
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
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl aspect-square flex items-center justify-center text-3xl shadow-soft">
                                    📖
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
            <section className="py-20 bg-gradient-to-br from-green-100 to-green-200">
                <div className="container max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
                        Missões diárias — O coração do Meu Amiguito
                    </h2>
                    <p className="text-center text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Antes de cada missão ser criada, ela nasce em oração. Buscando aquilo que pode gerar frutos reais
                        na vida da criança e da família.
                    </p>

                    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 border-2 border-green-200 mb-8">
                        {/* Journey Visualization */}
                        <div className="flex items-center justify-center gap-4 mb-8 overflow-x-auto pb-4">
                            <div className="flex flex-col items-center min-w-[120px]">
                                <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center text-3xl shadow-lg">
                                    ❤️
                                </div>
                                <div className="text-sm font-bold mt-2 text-gray-800">Gratidão</div>
                            </div>

                            <div className="w-12 h-1 bg-green-300 rounded-full"></div>

                            <div className="flex flex-col items-center min-w-[120px]">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-3xl shadow-lg">
                                    🙏
                                </div>
                                <div className="text-sm font-bold mt-2 text-gray-800">Oração</div>
                            </div>

                            <div className="w-12 h-1 bg-green-300 rounded-full"></div>

                            <div className="flex flex-col items-center min-w-[120px]">
                                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-3xl shadow-lg">
                                    ⭐
                                </div>
                                <div className="text-sm font-bold mt-2 text-gray-800">Amor</div>
                            </div>

                            <div className="w-12 h-1 bg-gray-300 rounded-full opacity-50"></div>

                            <div className="flex flex-col items-center min-w-[120px]">
                                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-3xl">
                                    🎯
                                </div>
                                <div className="text-sm font-bold mt-2 text-gray-500">Próxima</div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-8">
                            <div className="bg-green-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">✔</span>
                                    <span className="font-semibold text-gray-800">Missões de gratidão</span>
                                </div>
                            </div>
                            <div className="bg-green-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">✔</span>
                                    <span className="font-semibold text-gray-800">Campanhas de oração em família</span>
                                </div>
                            </div>
                            <div className="bg-green-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">✔</span>
                                    <span className="font-semibold text-gray-800">Atitudes práticas de amor</span>
                                </div>
                            </div>
                            <div className="bg-green-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">✔</span>
                                    <span className="font-semibold text-gray-800">Momentos guiados para viver a fé</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-lg font-bold text-gray-900 mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl py-4">
                            Não é assistir. É <span className="text-green-600">participar.</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Games Section */}
            <section className="py-20 bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100">
                <div className="container max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
                        Jogos que desenvolvem a mente — e unem pais e filhos
                    </h2>
                    <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
                        Nada de jogos vazios. Aqui, brincar também ensina.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        {[
                            { emoji: '🧩', name: 'Quebra-cabeça bíblico', color: 'from-blue-200 to-blue-300' },
                            { emoji: '🐑', name: 'O Bom Pastor', color: 'from-green-200 to-green-300' },
                            { emoji: '🧠', name: 'Jogo da memória', color: 'from-purple-200 to-purple-300' },
                            { emoji: '🔑', name: 'Encontre Jesus', color: 'from-yellow-200 to-yellow-300' },
                            { emoji: '🎵', name: 'No Ritmo do Céu', color: 'from-pink-200 to-pink-300' },
                            { emoji: '👨‍👩‍👧', name: 'Quem Estou Imitando?', color: 'from-orange-200 to-orange-300' },
                        ].map((game, i) => (
                            <div key={i} className={`bg-gradient-to-br ${game.color} rounded-3xl p-6 text-center space-y-3 shadow-soft`}>
                                <div className="text-5xl mb-2">{game.emoji}</div>
                                <h3 className="font-bold text-sm text-gray-900">{game.name}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="bg-orange-50 rounded-3xl p-8 border-2 border-orange-200">
                        <p className="text-center text-gray-800 leading-relaxed">
                            <strong className="text-orange-600 text-xl">👨‍👩‍👧 Especial:</strong><br />
                            Um jogo feito para pais e filhos rirem juntos. Se olharem. Se reconectarem.<br />
                            Porque <strong>fortalecer vínculos também é missão.</strong>
                        </p>
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
