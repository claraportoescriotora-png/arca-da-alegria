import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
  type: 'achievement' | 'info' | 'reminder';
}

interface UserContextType {
  name: string;
  setName: (name: string) => void;
  avatarId: string;
  setAvatarId: (id: string) => void;
  xp: number;
  addXp: (amount: number) => void;
  level: number;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  updateName: (name: string) => void;
  customAvatar: string | null;
  setCustomAvatar: (image: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Avatar options mapped to IDs
export const AVATARS = {
  'bear': { type: 'emoji', value: '🐻', label: 'Ursinho', bg: 'bg-amber-100' },
  'cat': { type: 'emoji', value: '🐱', label: 'Gatinho', bg: 'bg-orange-100' },
  'lion': { type: 'emoji', value: '🦁', label: 'Leãozinho', bg: 'bg-yellow-100' },
  'rabbit': { type: 'emoji', value: '🐰', label: 'Coelhinho', bg: 'bg-pink-100' },
};

const LEVELS = [
  { level: 1, minXp: 0, title: 'Iniciante' },
  { level: 2, minXp: 200, title: 'Aprendiz' },
  { level: 3, minXp: 500, title: 'Explorador' },
  { level: 4, minXp: 1000, title: 'Mestre' },
  { level: 5, minXp: 2000, title: 'Lenda' },
];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();

  // Initialize state from profile or defaults
  const [name, setNameState] = useState(() => profile?.full_name || localStorage.getItem('user_name') || 'Visitante');
  const [avatarId, setAvatarIdState] = useState(() => localStorage.getItem('user_avatar') || 'bear');
  const [customAvatar, setCustomAvatarState] = useState<string | null>(() => localStorage.getItem('user_custom_avatar'));
  const [xp, setXpState] = useState(() => profile?.xp || parseInt(localStorage.getItem('user_xp') || '0'));

  const [notifications, setNotificationsState] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('user_notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        title: 'Bem-vindo!',
        message: 'Que bom ter você aqui. Vamos aprender muito!',
        read: false,
        date: new Date().toISOString(),
        type: 'info'
      }
    ];
  });

  // Sync with Profile from Supabase
  useEffect(() => {
    if (profile) {
      setNameState(profile.full_name || 'Visitante');
      setXpState(profile.xp);
    }
  }, [profile]);

  // Derived state for level
  const level = LEVELS.reduce((acc, curr) => xp >= curr.minXp ? curr.level : acc, 1);

  // Persistence effects
  useEffect(() => localStorage.setItem('user_name', name), [name]);
  useEffect(() => localStorage.setItem('user_avatar', avatarId), [avatarId]);
  useEffect(() => {
    if (customAvatar) {
      localStorage.setItem('user_custom_avatar', customAvatar);
    } else {
      localStorage.removeItem('user_custom_avatar');
    }
  }, [customAvatar]);
  useEffect(() => localStorage.setItem('user_xp', xp.toString()), [xp]);
  useEffect(() => localStorage.setItem('user_notifications', JSON.stringify(notifications)), [notifications]);

  const setName = (newName: string) => {
    setNameState(newName);
  };

  const updateName = (newName: string) => {
    setNameState(newName);
  };

  const setCustomAvatar = (image: string | null) => {
    setCustomAvatarState(image);
    if (image) {
      setAvatarIdState('custom');
    }
  };

  const setAvatarId = (newId: string) => {
    setAvatarIdState(newId);
    if (newId !== 'custom') {
      setCustomAvatarState(null);
    }
  };

  const addXp = (amount: number) => {
    // Optimistic update
    const oldLevel = LEVELS.reduce((acc, curr) => xp >= curr.minXp ? curr.level : acc, 1);
    const newXp = xp + amount;
    const newLevel = LEVELS.reduce((acc, curr) => newXp >= curr.minXp ? curr.level : acc, 1);

    setXpState(newXp);

    // Level up notification
    if (newLevel > oldLevel) {
      const levelTitle = LEVELS.find(l => l.level === newLevel)?.title;
      const notification: Notification = {
        id: Date.now().toString(),
        title: '🎉 Subiu de Nível!',
        message: `Parabéns! Você agora é um ${levelTitle}!`,
        read: false,
        date: new Date().toISOString(),
        type: 'achievement'
      };
      setNotificationsState(prev => [notification, ...prev]);
      toast.success(`+${amount} XP! Você subiu para o nível ${newLevel}!`);
    } else {
      toast.success(`+${amount} XP! Continue assim!`);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotificationsState(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotificationsState([]);
  };

  return (
    <UserContext.Provider value={{
      name,
      setName,
      avatarId,
      setAvatarId,
      xp,
      addXp,
      level,
      notifications,
      markNotificationAsRead,
      clearNotifications,
      updateName,
      customAvatar,
      setCustomAvatar
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
