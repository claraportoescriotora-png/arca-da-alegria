interface ProgressCardProps {
  percentage: number;
  label?: string;
}

export function ProgressCard({ percentage, label = "Progresso Diário" }: ProgressCardProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-6 p-6 bg-card rounded-3xl shadow-md">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-fredoka font-bold text-foreground">{percentage}%</span>
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="font-fredoka font-semibold text-lg text-foreground">{label}</h3>
        <p className="text-sm text-muted-foreground mt-1">Continue brilhando!</p>
      </div>
    </div>
  );
}
