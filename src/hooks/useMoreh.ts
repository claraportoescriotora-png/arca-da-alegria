import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export interface Child {
  id: string;
  name: string;
  avatar_url: string;
  talent_points: number;
}

export function useMoreh() {
  const { session } = useAuth();
  const [morehPin, setMorehPin] = useState<string | null>(null);
  const [hygieneDays, setHygieneDays] = useState<number>(30);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchData() {
      setLoading(true);
      try {
        // Fetch Moreh settings from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('moreh_pin, hygiene_days')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setMorehPin(profile.moreh_pin);
          setHygieneDays(profile.hygiene_days || 30);
        }

        // Fetch children
        const { data: childrenData } = await supabase
          .from('children')
          .select('*')
          .order('created_at', { ascending: true });

        if (childrenData) {
          setChildren(childrenData);
        }

        // Run lazy cleanup for old evidences
        if (profile && childrenData && childrenData.length > 0) {
          const childIds = childrenData.map(c => c.id);
          runHygieneCleanup(childIds, profile.hygiene_days || 30);
        }
      } catch (err) {
        console.error('Error fetching Moreh data', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session]);

  const runHygieneCleanup = async (childIds: string[], days: number) => {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - days);

      // Find tasks older than threshold with an evidence_url
      const { data: oldTasks } = await supabase
        .from('daily_tasks')
        .select('id, evidence_url')
        .in('child_id', childIds)
        .lt('created_at', thresholdDate.toISOString())
        .not('evidence_url', 'is', null);

      if (oldTasks && oldTasks.length > 0) {
        // Extract filenames from the full publicUrl
        const filesToDelete = oldTasks.map(t => {
          const parts = t.evidence_url!.split('/evidences/');
          return parts.length > 1 ? parts[1] : null;
        }).filter(Boolean) as string[];

        if (filesToDelete.length > 0) {
          // Delete from storage
          await supabase.storage.from('evidences').remove(filesToDelete);

          // Remove URL from tasks
          const taskIds = oldTasks.map(t => t.id);
          await supabase
            .from('daily_tasks')
            .update({ evidence_url: null })
            .in('id', taskIds);

          console.log(`Hygiene cleanup complete. Removed ${filesToDelete.length} files.`);
        }
      }
    } catch (err) {
      console.error('Failed to run hygiene cleanup', err);
    }
  };

  const updatePin = async (newPin: string) => {
    if (!session?.user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ moreh_pin: newPin })
      .eq('id', session.user.id);
    
    if (!error) setMorehPin(newPin);
    return { error };
  };

  const updateHygieneDays = async (days: number) => {
    if (!session?.user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ hygiene_days: days })
      .eq('id', session.user.id);
    
    if (!error) setHygieneDays(days);
    return { error };
  };

  const addChild = async (name: string, avatar_url: string) => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('children')
      .insert([{ user_id: session.user.id, name, avatar_url }])
      .select()
      .single();
    
    if (data && !error) setChildren([...children, data]);
    return { data, error };
  };

  return {
    morehPin,
    hygieneDays,
    children,
    loading,
    updatePin,
    updateHygieneDays,
    addChild
  };
}
