import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
}

export function SearchBar({ value, onChange, placeholder = "Buscar...", onFilterClick }: SearchBarProps) {
  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>
      
      {onFilterClick && (
        <button 
          onClick={onFilterClick}
          className="p-3 bg-card border border-border rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
