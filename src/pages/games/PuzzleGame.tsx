import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Trophy, Settings2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PuzzlePiece {
  id: number;
  currentPos: number;
  originalPos: number;
  url: string;
}

export default function PuzzleGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addXp } = useUser();
  const { toast } = useToast();

  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [gridSize, setGridSize] = useState(3); // Default 3x3

  useEffect(() => {
    if (id) fetchGameConfig();
  }, [id]);

  // Preload image and detect errors before starting the puzzle
  useEffect(() => {
    if (!imageUrl) return; // Keep this check
    // IMAGE LOADING LOGIC
    const img = new Image();
    img.onload = () => {
      setImageLoadError(false);
      initializePuzzle(gridSize);
    };
    img.onerror = () => {
      console.error('Puzzle image load failed:', imageUrl);
      setImageLoadError(true);
    };

    // Crucial: Append timestamp if not already there to bypass potential stale CDN/Cache
    const finalSrc = imageUrl?.includes('?') ? imageUrl : `${imageUrl}?t=${Date.now()}`;
    img.src = finalSrc;
  }, [imageUrl]);

  useEffect(() => {
    if (imageUrl && !imageLoadError) {
      initializePuzzle(gridSize);
    }
  }, [gridSize]);

  const fetchGameConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.status !== 'available') {
        toast({ title: "Jogo Indisponível", description: "Este jogo estará disponível em breve!", variant: "default" });
        navigate('/games');
        return;
      }

      const config = data.config || {};
      const img = config.image || data.image_url;
      const size = Math.sqrt(config.pieces || 9);

      setImageUrl(img);
      setGridSize(Math.max(3, Math.min(size, 6))); // Clamp between 3 and 6
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao carregar jogo.", variant: "destructive" });
      navigate('/games');
    } finally {
      setLoading(false);
    }
  };

  const initializePuzzle = (size: number) => {
    const total = size * size;
    const initialPieces: PuzzlePiece[] = [];

    for (let i = 0; i < total; i++) {
      initialPieces.push({
        id: i,
        currentPos: i, // Initially ordered
        originalPos: i,
        url: ''
      });
    }

    // Shuffle only positions
    for (let i = initialPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [initialPieces[i].currentPos, initialPieces[j].currentPos] = [initialPieces[j].currentPos, initialPieces[i].currentPos];
    }

    // Sort array by currentPos to make rendering grid easy? 
    // No, we render by Index, but display content based on... wait.
    // Let's stick to the previous winning logic:
    // We render the slots 0..N.
    // We need to know WHICH PIECE is in Slot K.
    // Let's map pieces to slots.

    // Better Loop for Shuffle ensuring solvability or just simple swap?
    // Simple swap shuffle is easiest for "swap puzzle".
    const shuffled = [...initialPieces];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setPieces(shuffled);
    setIsComplete(false);
    setSelectedPiece(null);
  };

  const handlePieceClick = (index: number) => {
    if (isComplete) return;

    if (selectedPiece === null) {
      setSelectedPiece(index);
    } else {
      if (selectedPiece === index) {
        setSelectedPiece(null); // Deselect
        return;
      }

      // Swap
      const newPieces = [...pieces];
      const temp = newPieces[selectedPiece];
      newPieces[selectedPiece] = newPieces[index];
      newPieces[index] = temp;

      setPieces(newPieces);
      setSelectedPiece(null);

      checkWin(newPieces);
    }
  };

  const checkWin = (currentPieces: PuzzlePiece[]) => {
    const won = currentPieces.every((p, index) => p.originalPos === index);
    if (won) {
      setIsComplete(true);
      addXp(100);
      toast({
        title: "Parabéns! 🎉",
        description: `Você completou o nível ${gridSize}x${gridSize}!`,
        className: "bg-green-500 text-white"
      });
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  if (imageLoadError) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4 p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
        <ImageIcon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-fredoka font-bold text-foreground">Imagem não encontrada</h2>
      <p className="text-muted-foreground text-sm max-w-xs">A imagem deste quebra-cabeça não pôde ser carregada. Verifique as configurações no painel de administração.</p>
      <button onClick={() => navigate('/games')} className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold">Voltar aos Jogos</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile-Optimized Header */}
      <header className="sticky top-0 z-20 glass border-b border-border/50">
        <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/games')}
            className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors active:scale-95"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          <h1 className="font-fredoka font-bold text-lg text-foreground">Quebra-Cabeça</h1>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors active:scale-95 text-primary">
                  <Settings2 className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Dificuldade</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setGridSize(3)}>
                  <span className={cn("flex-1", gridSize === 3 && "font-bold text-primary")}>Fácil (3x3)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGridSize(4)}>
                  <span className={cn("flex-1", gridSize === 4 && "font-bold text-primary")}>Médio (4x4)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGridSize(5)}>
                  <span className={cn("flex-1", gridSize === 5 && "font-bold text-primary")}>Difícil (5x5)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => initializePuzzle(gridSize)}
              className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors active:scale-95"
              aria-label="Reiniciar"
            >
              <RefreshCw className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">

        {/* Confetti/Win State */}
        {isComplete && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="text-center p-8 bg-card rounded-3xl shadow-2xl border-2 border-primary/20 transform animate-in zoom-in-95">
              <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-fredoka font-bold text-primary mb-2">Parabéns!</h2>
              <p className="text-muted-foreground mb-6">Você montou o quebra-cabeça!</p>
              <button
                onClick={() => initializePuzzle(gridSize)}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Jogar Novamente
              </button>
            </div>
          </div>
        )}

        {/* Puzzle Grid */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg">
          <div
            className="grid gap-1 bg-card p-2 rounded-xl shadow-lg border relative select-none"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              aspectRatio: '1/1',
              width: '100%',
              maxWidth: '400px',
            }}
          >
            {pieces.map((piece, index) => (
              <div
                key={index}
                onClick={() => handlePieceClick(index)}
                className={cn(
                  "relative cursor-pointer transition-all duration-200 rounded-md overflow-hidden bg-muted",
                  selectedPiece === index ? "ring-4 ring-primary z-10 scale-95 shadow-xl" : "hover:brightness-110",
                  isComplete ? "ring-0" : ""
                )}
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`, // Force fill square
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `${(piece.originalPos % gridSize) * (100 / (gridSize - 1))}% ${(Math.floor(piece.originalPos / gridSize)) * (100 / (gridSize - 1))}%`,
                  // Ensure precise pixel rendering
                  imageRendering: 'auto'
                }}
              >
                {/* Configurable Hint: Show numbers if easy? */}
                {/* <span className="absolute top-0.5 left-1 text-[8px] bg-black/50 text-white rounded px-1 opacity-50">{piece.originalPos + 1}</span> */}
              </div>
            ))}
          </div>

          <p className="mt-8 text-muted-foreground text-sm text-center font-medium animate-pulse">
            Toque em duas peças para trocar de lugar 🔄
          </p>
        </div>

      </main>
    </div>
  );
}
