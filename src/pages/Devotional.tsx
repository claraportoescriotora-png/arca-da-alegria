import { ArrowLeft, Sparkles, Send, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { BottomNav } from '@/components/BottomNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Imagens dos ícones
import morningIcon from '@/assets/morning-icon.jpg';
import nightIcon from '@/assets/night-icon.jpg';
import heartIcon from '@/assets/heart-icon.jpg';
import devocionalIcon from '@/assets/devocional-icon.jpg';

// Dados para o "Monte Sua Oração"
const prayerParts = {
  start: [
    "Querido Deus,",
    "Papai do Céu,",
    "Senhor Jesus,",
    "Meu Amigo Deus,"
  ],
  middle: [
    "obrigado por este dia lindo.",
    "por favor, cuide da minha família.",
    "ajude-me a ser uma criança obediente.",
    "abençoe meus amiguinhos da escola."
  ],
  end: [
    "Eu te amo muito! Amém.",
    "Em nome de Jesus, Amém.",
    "Fica comigo sempre. Amém.",
    "Obrigado por tudo! Amém."
  ]
};

// Dados para Categorias
const categories = [
  { id: 1, title: "Ao Acordar", image: morningIcon, color: "bg-orange-100", prayer: "Bom dia, Deus! Obrigado por eu acordar com saúde. Que meu dia seja feliz e cheio de brincadeiras. Amém!" },
  { id: 2, title: "Antes de Dormir", image: nightIcon, color: "bg-indigo-100", prayer: "Papai do Céu, a noite chegou. Proteja meu sono e me dê sonhos lindos. Cuide de todos que eu amo. Boa noite, Jesus!" },
  { id: 3, title: "Agradecer", image: heartIcon, color: "bg-pink-100", prayer: "Senhor, obrigado pela minha comida, pela minha casa e pelos meus brinquedos. Obrigado pelo Seu amor. Amém!" },
  { id: 4, title: "Proteção", image: devocionalIcon, color: "bg-yellow-100", prayer: "Deus forte, me proteja de todo mal. Quando eu sentir medo, me lembre que Você está comigo. Eu confio em Ti! Amém." },
];

export default function Devotional() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedStart, setSelectedStart] = useState("");
  const [selectedMiddle, setSelectedMiddle] = useState("");
  const [selectedEnd, setSelectedEnd] = useState("");
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState<{ title: string, text: string } | null>(null);
  const [dailyVerse, setDailyVerse] = useState<{ text: string, ref: string } | null>(null);

  useEffect(() => {
    fetchDailyVerse();
  }, []);

  const fetchDailyVerse = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_verses')
        .select('verse_text, reference')
        .order('active_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setDailyVerse({ text: data.verse_text, ref: data.reference });
      }
    } catch (err) {
      console.error('Error fetching verse:', err);
    }
  };

  const handleCreatePrayer = () => {
    if (!selectedStart || !selectedMiddle || !selectedEnd) {
      toast({
        title: "Ops!",
        description: "Escolha todas as partes para montar sua oração.",
        variant: "destructive"
      });
      return;
    }

    const fullPrayer = `${selectedStart} ${selectedMiddle} ${selectedEnd}`;
    setCurrentPrayer({ title: "Sua Oração Especial", text: fullPrayer });
    setShowPrayerModal(true);

    // Confetti effect or success sound could go here
    toast({
      title: "Que lindo! ✨",
      description: "Sua oração foi criada com sucesso.",
    });
  };

  const handleOpenCategory = (category: typeof categories[0]) => {
    setCurrentPrayer({ title: category.title, text: category.prayer });
    setShowPrayerModal(true);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-card hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-fredoka text-xl font-bold text-foreground">Pequenas Orações</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-8">

        {/* Seção 0: Versículo do Dia */}
        {dailyVerse && (
          <section className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/80">Versículo do Dia</span>
              </div>
              <p className="text-lg font-medium italic mb-4 leading-relaxed">
                "{dailyVerse.text}"
              </p>
              <p className="text-sm font-bold text-right text-indigo-100">
                — {dailyVerse.ref}
              </p>
            </div>
          </section>
        )}

        {/* Seção 1: Monte Sua Oração */}
        <section className="bg-card rounded-3xl p-6 shadow-sm border-2 border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <h2 className="font-fredoka text-xl font-bold text-foreground">Monte Sua Oração</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">Escolha os bloquinhos para falar com Deus:</p>

          <div className="space-y-4">
            {/* Parte 1 */}
            <div>
              <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Como começar?</p>
              <div className="grid grid-cols-1 gap-2">
                {prayerParts.start.map((text) => (
                  <button
                    key={text}
                    onClick={() => setSelectedStart(text)}
                    className={`p-3 rounded-xl text-left text-sm transition-all ${selectedStart === text
                        ? 'bg-primary text-white shadow-md scale-[1.02]'
                        : 'bg-muted/50 hover:bg-muted text-foreground'
                      }`}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Parte 2 */}
            <div>
              <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">O que dizer?</p>
              <div className="grid grid-cols-1 gap-2">
                {prayerParts.middle.map((text) => (
                  <button
                    key={text}
                    onClick={() => setSelectedMiddle(text)}
                    className={`p-3 rounded-xl text-left text-sm transition-all ${selectedMiddle === text
                        ? 'bg-secondary text-white shadow-md scale-[1.02]'
                        : 'bg-muted/50 hover:bg-muted text-foreground'
                      }`}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Parte 3 */}
            <div>
              <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Como terminar?</p>
              <div className="grid grid-cols-1 gap-2">
                {prayerParts.end.map((text) => (
                  <button
                    key={text}
                    onClick={() => setSelectedEnd(text)}
                    className={`p-3 rounded-xl text-left text-sm transition-all ${selectedEnd === text
                        ? 'bg-accent text-white shadow-md scale-[1.02]'
                        : 'bg-muted/50 hover:bg-muted text-foreground'
                      }`}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreatePrayer}
            className="w-full mt-8 h-12 text-lg font-fredoka bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 transition-opacity rounded-xl shadow-lg"
          >
            <Send className="w-5 h-5 mr-2" />
            Criar Minha Oração
          </Button>
        </section>

        {/* Seção 2: Categorias */}
        <section>
          <h2 className="font-fredoka text-lg font-semibold text-foreground mb-4">Momentos de Oração</h2>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleOpenCategory(cat)}
                className="bg-card p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-3 border border-transparent hover:border-primary/20"
              >
                <div className={`w-16 h-16 rounded-2xl overflow-hidden ${cat.color} flex items-center justify-center`}>
                  <img src={cat.image} alt={cat.title} className="w-full h-full object-cover" />
                </div>
                <span className="font-medium text-sm text-foreground">{cat.title}</span>
              </button>
            ))}
          </div>
        </section>

      </main>

      <BottomNav />

      {/* Modal de Leitura da Oração */}
      <Dialog open={showPrayerModal} onOpenChange={setShowPrayerModal}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto bg-card border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-center font-fredoka text-2xl text-primary flex items-center justify-center gap-2">
              <Heart className="fill-current" /> {currentPrayer?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-xl leading-relaxed font-medium text-foreground">
              "{currentPrayer?.text}"
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setShowPrayerModal(false)} className="rounded-full px-8">
              Amém! 🙏
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}