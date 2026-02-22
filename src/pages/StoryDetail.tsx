import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Volume2, Square, PlayCircle, CheckCircle, HelpCircle, Trophy } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useUser } from '@/contexts/UserContext';
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { isContentLocked } from '@/lib/drip';
import { DripLockModal } from '@/components/DripLockModal';
import { cn } from '@/lib/utils';

interface Story {
  id: string;
  title: string;
  image: string;
  content: string;
  category: string;
  duration: string;
  unlock_delay_days?: number;
  required_mission_day?: number;
}

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addXp } = useUser();
  const { toast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speech, setSpeech] = useState<SpeechSynthesisUtterance | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const [isDripLocked, setIsDripLocked] = useState(false);
  const [dripDaysRemaining, setDripDaysRemaining] = useState(0);
  const [unlockDelayDays, setUnlockDelayDays] = useState(0);
  const [requiredMissionDay, setRequiredMissionDay] = useState(0);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [id]);

  useEffect(() => {
    if (showQuiz && story) {
      fetchQuiz();
    }
  }, [showQuiz, story]);

  // Re-check drip whenever profile or story changes
  useEffect(() => {
    if (!story || !profile) return;

    const { isLocked, daysRemaining } = isContentLocked(profile?.created_at, {
      unlockDelayDays: story.unlock_delay_days,
      requiredMissionDay: story.required_mission_day
    });

    setIsDripLocked(isLocked);
    setDripDaysRemaining(daysRemaining);
    setUnlockDelayDays(story.unlock_delay_days || 0);
    setRequiredMissionDay(story.required_mission_day || 0);
  }, [story, profile]);

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
          duration: data.duration || '5 min',
          unlock_delay_days: data.unlock_delay_days || 0,
          required_mission_day: data.required_mission_day || 0
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
    if (!story || isDripLocked) return;

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
    if (isDripLocked) return;
    addXp(50);
    toast({
      title: "Parabéns! 🎉",
      description: "Você ganhou 50 XP por ler esta história!",
    });
  };

  const favorite = story ? isFavorite(story.id) : false;

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

  const fetchQuiz = async () => {
    setLoadingQuiz(true);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);

    try {
      // Fetch Questions
      const { data: questions, error: qError } = await supabase
        .from('quiz_questions')
        .select(`
          id,
          question,
          order_index,
          quiz_alternatives (
            id,
            text,
            is_correct
          )
        `)
        .eq('content_id', story?.id)
        .order('order_index', { ascending: true });

      if (qError) throw qError;

      if (questions) {
        setQuizQuestions(questions);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar o quiz.",
        variant: "destructive"
      });
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(s => s + 1);
      toast({
        title: "Correto! 🌟",
        description: "Muito bem!",
        className: "bg-green-500 text-white border-none"
      });
    } else {
      toast({
        title: "Ops!",
        description: "Não foi dessa vez.",
        variant: "destructive"
      });
    }

    // Next Question
    setTimeout(() => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setQuizCompleted(true);
        if (score + (isCorrect ? 1 : 0) === quizQuestions.length) {
          addXp(20); // Bonus XP for perfect score
        }
      }
    }, 1000);
  };

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
        <div className="absolute top-0 left-0 right-0 p-6 z-20 pointer-events-none">
          <div className="container max-w-md mx-auto flex items-center justify-between pointer-events-none">
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                navigate(-1);
              }}
              className="p-3 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-white transition-all pointer-events-auto active:scale-95"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>

            <div className="flex gap-3 pointer-events-auto">
              <button className="p-3 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-white transition-all active:scale-95">
                <Share2 className="w-6 h-6 text-slate-700" />
              </button>
              <button
                onClick={() => toggleFavorite(story.id, 'story')}
                className={`p-3 rounded-full shadow-lg transition-all active:scale-95 ${favorite
                  ? 'bg-danger text-white border-2 border-white'
                  : 'bg-white/90 backdrop-blur-md hover:bg-white text-slate-700'
                  }`}
              >
                <Heart className={`w-6 h-6 ${favorite ? 'fill-current' : ''}`} />
              </button>
            </div>
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
            disabled={isDripLocked}
            className={cn(
              "w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-semibold mb-6 transition-all duration-300",
              isPlaying ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'gradient-primary text-white hover:opacity-90',
              isDripLocked && "opacity-50 cursor-not-allowed"
            )}
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
              {isDripLocked ? "Conteúdo bloqueado. Retorne em breve para ler esta história!" : story.content}
            </p>
          </div>

          {/* Progress & Actions */}
          <div className="mt-8 pt-6 border-t border-border space-y-4">

            {/* Dynamic Quiz Button */}
            <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
              <DialogTrigger asChild>
                <button
                  disabled={isDripLocked}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 p-4 bg-yellow-100 text-yellow-700 rounded-2xl font-bold hover:bg-yellow-200 transition-colors",
                    isDripLocked && "opacity-50 cursor-not-allowed"
                  )}>
                  <HelpCircle className="w-5 h-5" />
                  Responder Quiz
                </button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Quiz: {story.title}</DialogTitle>
                  <DialogDescription>
                    Teste seus conhecimentos sobre esta história!
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  {loadingQuiz ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : quizQuestions.length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">Nenhuma pergunta encontrada para esta história.</p>
                      <Button onClick={() => setShowQuiz(false)} className="mt-4">Fechar</Button>
                    </div>
                  ) : quizCompleted ? (
                    <div className="text-center space-y-4 py-6 animate-in zoom-in duration-500">
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-xl relative z-10 animate-bounce">
                          <Trophy className="w-12 h-12 text-white drop-shadow-md" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                          PARABÉNS!
                        </h3>
                        <p className="text-lg font-medium text-muted-foreground">
                          Você completou o desafio!
                        </p>
                      </div>

                      <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
                        <span className="block text-sm text-muted-foreground uppercase tracking-wider font-semibold">Sua Pontuação</span>
                        <span className="block text-4xl font-black text-secondary mt-1">
                          {score}/{quizQuestions.length}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Questão {currentQuestionIndex + 1} de {quizQuestions.length}</span>
                        <span>Pontos: {score}</span>
                      </div>

                      <p className="font-medium text-lg text-center">
                        {quizQuestions[currentQuestionIndex].question}
                      </p>

                      <div className="grid gap-3">
                        {quizQuestions[currentQuestionIndex].quiz_alternatives.map((alt: any) => (
                          <Button
                            key={alt.id}
                            variant="outline"
                            className="justify-start h-auto py-3 px-4 text-left whitespace-normal hover:bg-primary/5 hover:text-primary transition-colors"
                            onClick={() => handleAnswer(alt.is_correct)}
                          >
                            {alt.text}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <button
              onClick={handleFinish}
              disabled={isDripLocked}
              className={cn(
                "w-full flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-2xl font-semibold hover:bg-green-600 transition-colors",
                isDripLocked && "opacity-50 cursor-not-allowed"
              )}
            >
              <CheckCircle className="w-5 h-5" />
              Terminei de Ler!
            </button>
          </div>

        </div>
      </main>

      <DripLockModal
        isOpen={isDripLocked}
        onOpenChange={(open) => {
          setIsDripLocked(open);
          if (!open) navigate('/stories');
        }}
        daysRemaining={dripDaysRemaining}
        unlockDelayDays={unlockDelayDays}
        requiredMissionDay={requiredMissionDay}
      />
      <BottomNav />
    </div>
  );
}
