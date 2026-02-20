import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/home", icon: "home", label: "Início" },
  { path: "/missions", icon: "emoji_events", label: "Missões" },
  { path: "/stories", icon: "auto_stories", label: "Histórias" },
  { path: "/videos", icon: "smart_display", label: "Vídeos" },
  { path: "/games", icon: "sports_esports", label: "Jogos" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-between bg-[hsl(var(--bottom-nav))] px-8 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-border/50"
    >
      {navItems.map(({ path, icon, label }) => {
        const isActive = location.pathname === path;
        const linkClass = isActive
          ? "flex h-10 w-10 -translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md glow-primary transition-transform"
          : "flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-primary";

        return (
          <Link
            key={path}
            to={path}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={linkClass}
          >
            <span className="material-icons-round text-xl leading-none">{icon}</span>
          </Link>
        );
      })}
    </nav>
  );
}