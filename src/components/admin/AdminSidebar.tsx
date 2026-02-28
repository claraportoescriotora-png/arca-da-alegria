import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Video, Gamepad2, Target, Download, Home, LogOut, Sparkles, ShoppingCart, Film, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const menuItems = [
    { label: 'Histórias', icon: BookOpen, path: '/admin/stories' },
    { label: 'Vídeos', icon: Video, path: '/admin/videos' },
    { label: 'Filmes', icon: Film, path: '/admin/movies' },
    { label: 'Séries', icon: Layers, path: '/admin/series' },
    { label: 'Jogos', icon: Gamepad2, path: '/admin/games' },
    { label: 'Missões', icon: Target, path: '/admin/missions' },
    { label: 'Downloads', icon: Download, path: '/admin/downloads' },
    { label: 'Agente IA', icon: Sparkles, path: '/admin/agent' },
    { label: 'Suite de Testes', icon: ShoppingCart, path: '/admin/test-suite' },
];

export function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-slate-100">
                <h1 className="font-fredoka font-bold text-xl text-blue-600 flex items-center gap-2">
                    🛡️ Admin
                </h1>
            </div>

            <nav className="p-4 space-y-2 flex-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                                isActive
                                    ? "bg-blue-50 text-blue-600 shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 space-y-2">
                <button
                    onClick={() => navigate('/home')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                    <Home className="w-5 h-5" />
                    Voltar ao App
                </button>
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
                >
                    <LogOut className="w-5 h-5" />
                    Sair
                </button>
            </div>
        </aside>
    );
}
