import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface FavoritesContextType {
  favorites: string[]; // List of content IDs
  toggleFavorite: (id: string, type: 'story' | 'video') => Promise<void>;
  isFavorite: (id: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load favorites when user changes
  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select('content_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(data.map(f => f.content_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string, type: 'story' | 'video') => {
    if (!user) {
      toast.error('Faça login para salvar favoritos');
      return;
    }

    const isFav = favorites.includes(id);

    // Optimistic Update
    setFavorites(prev =>
      isFav ? prev.filter(f => f !== id) : [...prev, id]
    );

    try {
      if (isFav) {
        // Remove
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, content_id: id });

        if (error) throw error;
      } else {
        // Add
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, content_id: id, content_type: type });

        if (error) throw error;
        toast.success('Adicionado aos favoritos!');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favoritos');
      // Revert Optimistic Update
      setFavorites(prev =>
        isFav ? [...prev, id] : prev.filter(f => f !== id)
      );
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
