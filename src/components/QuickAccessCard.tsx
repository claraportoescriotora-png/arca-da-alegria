import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAccessCardProps {
  icon: LucideIcon;
  label: string;
  path: string;
  gradient: 'primary' | 'secondary' | 'accent' | 'success';
}

const gradientClasses = {
  primary: 'gradient-primary',
  secondary: 'gradient-secondary',
  accent: 'gradient-accent',
  success: 'gradient-success',
};

export function QuickAccessCard({ icon: Icon, label, path, gradient }: QuickAccessCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl ${gradientClasses[gradient]} text-white shadow-lg card-hover aspect-square`}
    >
      <Icon className="w-8 h-8" />
      <span className="text-xs font-semibold text-center">{label}</span>
    </button>
  );
}
