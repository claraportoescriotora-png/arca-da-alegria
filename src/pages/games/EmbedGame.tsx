import { useState, useEffect } from 'react';
import { ArrowLeft, Maximize2, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface EmbedGameData {
  id: string;
  title: string;
  game_url: string;
  config: { width: number; height: number } | null;
}

export default function EmbedGame() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<EmbedGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('games')
      .select('id, title, game_url, config')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setGame(data as EmbedGameData);
        setLoading(false);
      });
  }, [id]);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70 font-medium">Carregando jogo...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <p className="text-xl font-bold mb-4">Jogo não encontrado</p>
          <button onClick={() => navigate(-1)} className="text-purple-400 underline">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800/80 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <h1 className="text-white font-bold text-base truncate max-w-[180px] text-center">{game.title}</h1>

        <button
          onClick={() => setIframeKey(k => k + 1)}
          className="flex items-center gap-1 text-white/60 hover:text-white transition-colors"
          title="Reiniciar jogo"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {/* Game Area */}
      <div className="flex-1 w-full h-full p-0 overflow-hidden relative bg-black">
        <iframe
          key={iframeKey}
          src={game.game_url}
          className="absolute inset-0 w-full h-full border-0"
          scrolling="no"
          allowFullScreen
          title={game.title}
        />
      </div>

      {/* Footer hint */}
      <div className="text-center py-2 flex-shrink-0">
        <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">
          Meu Amiguito — Jogos
        </p>
      </div>
    </div>
  );
}
