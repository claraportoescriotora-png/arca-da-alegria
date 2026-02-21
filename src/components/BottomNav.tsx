import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, BookOpen, PlayCircle, Gamepad2 } from "lucide-react";

const navItems = [
  { path: "/home", icon: Home, label: "Início" },
  { path: "/missions", icon: Trophy, label: "Missões" },
  { path: "/stories", icon: BookOpen, label: "Histórias" },
  { path: "/videos", icon: PlayCircle, label: "Vídeos" },
  { path: "/games", icon: Gamepad2, label: "Jogos" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav
        aria-label="Navegação principal"
        className="w-[95%] max-w-md h-16 bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] rounded-[2rem] flex items-center justify-around px-2 pointer-events-auto"
      >
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;

          return (
            <Link
              key={path}
              to={path}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 ${isActive
                  ? "text-primary scale-110 -translate-y-1"
                  : "text-muted-foreground hover:text-primary active:scale-95"
                }`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? "bg-primary/10" : ""}`}>
                <Icon className={`w-6 h-6 ${isActive ? "drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]" : ""}`} />
              </div>
              <span className={`text-[10px] font-fredoka font-bold mt-0.5 transition-all duration-300 ${isActive ? "opacity-100 scale-100" : "opacity-40 scale-90"}`}>
                {label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full animate-in zoom-in duration-300" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
