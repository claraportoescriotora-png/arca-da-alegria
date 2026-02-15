import { Download, Printer } from 'lucide-react';

interface ActivityCardProps {
  id: string;
  title: string;
  image: string;
  type: string;
}

export function ActivityCard({ id, title, image, type }: ActivityCardProps) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-md card-hover">
      <div className="aspect-[4/3] overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <span className="inline-block px-2 py-1 text-xs font-medium bg-success/10 text-success rounded-full mb-2">
          {type}
        </span>
        <h3 className="font-fredoka font-semibold text-foreground line-clamp-1">{title}</h3>
        
        <div className="flex gap-2 mt-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4" />
            Baixar
          </button>
          <button className="p-2 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-colors">
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
