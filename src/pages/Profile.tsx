import { ArrowLeft, Settings, ChevronRight, Moon, Bell, Shield, HelpCircle, LogOut, Sun, Edit, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { BottomNav } from '@/components/BottomNav';
import { UserAvatar } from '@/components/UserAvatar';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const menuItems = [
  { icon: Bell, label: 'Notificações', path: '/notifications' },
  { icon: Shield, label: 'Privacidade', path: '/privacy' },
  { icon: HelpCircle, label: 'Ajuda', path: '/help' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { name, level, avatarId, xp, updateName, setCustomAvatar } = useUser();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name);

  const nextLevelXp = level === 1 ? 200 : level === 2 ? 500 : level === 3 ? 1000 : level === 4 ? 2000 : 5000;
  const currentLevelMinXp = level === 1 ? 0 : level === 2 ? 200 : level === 3 ? 500 : level === 4 ? 1000 : 2000;
  const progress = Math.min(100, Math.max(0, ((xp - currentLevelMinXp) / (nextLevelXp - currentLevelMinXp)) * 100));
  const remainingXp = nextLevelXp - xp;

  const handleSaveName = () => {
    if (newName.trim()) {
      updateName(newName);
      setIsEditing(false);
      toast({
        title: "Nome atualizado!",
        description: "Seu nome foi alterado com sucesso.",
      });
    }
  };

  const handlePhotoUpload = () => {
    document.getElementById('profile-photo-upload')?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatar(reader.result as string);
        toast({
          title: "Foto atualizada!",
          description: "Sua foto de perfil foi alterada.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hidden file input */}
      <input 
        type="file" 
        id="profile-photo-upload" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileChange}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-full bg-card hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-fredoka text-xl font-bold text-foreground">Perfil</h1>
            </div>
            <SettingsDialog>
              <button className="p-2 rounded-full bg-card hover:bg-muted transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </SettingsDialog>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-card rounded-3xl p-6 text-center shadow-md">
          <div className="relative inline-block mb-4">
            <UserAvatar avatarId={avatarId} className="w-24 h-24 border-4 mx-auto" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
              {level}
            </div>
            <button 
              onClick={handlePhotoUpload}
              className="absolute top-0 right-0 p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          {isEditing ? (
            <div className="flex items-center gap-2 justify-center mb-2">
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                className="max-w-[150px] text-center"
              />
              <Button size="sm" onClick={handleSaveName}>OK</Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="font-fredoka text-2xl font-bold text-foreground">{name}</h2>
              <button onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <p className="text-muted-foreground">
            {level === 1 ? 'Iniciante' : level === 2 ? 'Aprendiz' : level === 3 ? 'Explorador' : 'Mestre'}
          </p>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-around">
              <div className="text-center">
                <p className="font-fredoka font-bold text-xl text-foreground">{xp}</p>
                <p className="text-xs text-muted-foreground">XP Total</p>
              </div>
              <div className="text-center">
                <p className="font-fredoka font-bold text-xl text-foreground">12</p>
                <p className="text-xs text-muted-foreground">Histórias</p>
              </div>
              <div className="text-center">
                <p className="font-fredoka font-bold text-xl text-foreground">5</p>
                <p className="text-xs text-muted-foreground">Dias</p>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-foreground">Nível {level}</span>
            <span className="text-sm text-muted-foreground">{xp} / {nextLevelXp} XP</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Faltam {remainingXp} XP para o próximo nível!</p>
        </div>

        {/* Theme Toggle */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
              <span className="font-medium text-foreground">Tema {theme === 'light' ? 'Claro' : 'Escuro'}</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full transition-colors flex items-center ${
                theme === 'dark' ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {menuItems.map(({ icon: Icon, label, path }, index) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-full flex items-center justify-between p-4 hover:bg-muted transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">{label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button 
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 p-4 bg-danger/10 text-danger rounded-2xl font-medium hover:bg-danger/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
