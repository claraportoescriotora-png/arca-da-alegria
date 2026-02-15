import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/home", icon: "home", label: "Início" },
  { path: "/stories", icon: "auto_stories", label: "Histórias" },
  { path: "/videos", icon: "smart_display", label: "Vídeos" },
  { path: "/games", icon: "sports_esports", label: "Jogos" },
  { path: "/profile", icon: "person", label: "Perfil" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-6 left-1/2 z-50 flex h-16 w-[calc(100%-3rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-full bg-[hsl(var(--bottom-nav))] px-6 shadow-2xl"
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