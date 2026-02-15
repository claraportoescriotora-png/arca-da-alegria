import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Volume2, Square, PlayCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useUser } from '@/contexts/UserContext';
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';

interface Story {
  id: string;
  title: string;
  image: string;
  content: string;
  category: string;
  duration: string;
}

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addXp } = useUser();
  const { toast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speech, setSpeech] = useState<SpeechSynthesisUtterance | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setStory({
          id: data.id,
          title: data.title,
          image: data.cover_url || 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=800',
          content: data.content || 'Conteúdo em breve...',
          category: data.category || 'Geral',
          duration: data.duration || '5 min'
        });
      }
    } catch (error) {
      console.error('Error fetching story:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a história.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cancelar fala ao sair da página
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (!story) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(story.content);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; // Um pouco mais lento para crianças
    utterance.pitch = 1.1; // Um pouco mais agudo (voz amigável)

    utterance.onend = () => {
      setIsPlaying(false);
    };

    setSpeech(utterance);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleFinish = () => {
    addXp(50);
    toast({
      title: "Parabéns! 🎉",
      description: "Você ganhou 50 XP por ler esta história!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">História não encontrada</p>
      </div>
    );
  }

  const favorite = isFavorite(story.id);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Image */}
      <div className="relative h-72">
        <img
          src={story.image}
          alt={story.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => {
              window.speechSynthesis.cancel();
              navigate(-1);
            }}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2">
            <button className="p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => toggleFavorite(story.id, 'story')}
              className={`p-2 rounded-full transition-colors ${favorite
                  ? 'bg-danger text-white'
                  : 'bg-card/80 backdrop-blur-sm hover:bg-card'
                }`}
            >
              <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container max-w-md mx-auto px-4 -mt-8 relative z-10 pb-8">
        <div className="bg-card rounded-3xl p-6 shadow-lg">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-secondary/10 text-secondary rounded-full mb-3">
            {story.category}
          </span>

          <h1 className="font-fredoka text-2xl font-bold text-foreground mb-2">{story.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span>📖 {story.duration} de leitura</span>
          </div>

          {/* Audio Player Button */}
          <button
            onClick={handleSpeak}
            className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-semibold mb-6 transition-all duration-300 ${isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'gradient-primary text-white hover:opacity-90'
              }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                Parar Leitura
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                Ouvir História
              </>
            )}
          </button>

          {/* Story Content */}
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-line text-lg">
              {story.content}
            </p>
          </div>

          {/* Progress & Actions */}
          <div className="mt-8 pt-6 border-t border-border space-y-4">

            {/* Botão de Quiz (Novo) */}
            <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-center gap-2 p-4 bg-yellow-100 text-yellow-700 rounded-2xl font-bold hover:bg-yellow-200 transition-colors">
                  <HelpCircle className="w-5 h-5" />
                  Responder Quiz
                </button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Quiz: {story.title}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="font-medium text-center">O que você aprendeu com essa história?</p>
                  <div className="grid gap-2">
                    <Button variant="outline" className="justify-start h-auto py-3 px-4 text-left whitespace-normal" onClick={() => {
                      toast({ title: "Resposta Correta! 🌟", description: "Muito bem! Você prestou atenção." });
                      setShowQuiz(false);
                    }}>
                      A) Deus sempre cuida de nós.
                    </Button>
                    <Button variant="outline" className="justify-start h-auto py-3 px-4 text-left whitespace-normal" onClick={() => {
                      toast({ title: "Tente novamente", description: "Essa não é a principal lição..." });
                    }}>
                      B) Devemos fugir dos problemas.
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-2xl font-semibold hover:bg-green-600 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Terminei de Ler!
            </button>
          </div>

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
