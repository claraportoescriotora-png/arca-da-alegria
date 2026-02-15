import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import devocionalBg from '@/assets/devocional-bg.png';

interface DevotionalCardProps {
  title: string;
  subtitle: string;
}

export function DevotionalCard({ title, subtitle }: DevotionalCardProps) {
  const navigate = useNavigate();

  return (
    <div 
      className="relative overflow-hidden rounded-3xl p-6 cursor-pointer card-hover"
      onClick={() => navigate('/devotional')}
    >
      <img 
        src={devocionalBg} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(90deg, #9C6ADE 0%, #8A60D9 35%, #734FCC 65%, #5B3AAE 100%)',
          opacity: 0.95
        }}
      />
      
      <div className="relative z-10 text-white">
        <span className="inline-block px-3 py-1 text-xs font-semibold bg-white/20 rounded-full mb-3">
          🙏 DEVOCIONAL
        </span>
        <h3 className="font-fredoka text-xl font-bold mb-1">{title}</h3>
        <p className="text-white/80 text-sm mb-4">{subtitle}</p>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-white text-secondary rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">
          Continuar Aventura
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
