import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export interface DailyTask {
  id: string;
  template_id: string;
  status: 'pending' | 'completed_pending_review' | 'approved' | 'grace_approved' | 'failed';
  evidence_url?: string;
  justification?: string;
  completed_at?: string;
  template: {
    title: string;
    is_mandatory: boolean;
    requires_photo: boolean;
    linked_content_url?: string;
  };
}

export function useChildTasks(childId: string | null) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no child is selected yet, stop loading immediately and show empty
    if (!childId || !userId) {
      setLoading(false);
      setTasks([]);
      return;
    }

    let cancelled = false;

    async function loadTasks() {
      setLoading(true);
      try {
        // 1. Get today's date string (YYYY-MM-DD)
        const todayStr = new Date().toISOString().split('T')[0];

        // 2. Fetch existing daily tasks for today, filtered by child_id directly in the query
        const { data: existingTasks, error: fetchError } = await supabase
          .from('daily_tasks')
          .select(`
            *,
            template:routine_templates (
              title, is_mandatory, requires_photo, linked_content_url, child_id
            )
          `)
          .eq('child_id', childId)
          .eq('date', todayStr);

        if (fetchError) {
          console.error('Error fetching daily tasks:', fetchError);
          if (!cancelled) setLoading(false);
          return;
        }

        const childTasks: any[] = existingTasks || [];

        // 3. Fetch templates to see if we need to generate new tasks for today
        const { data: templates } = await supabase
          .from('routine_templates')
          .select('*')
          .eq('child_id', childId);

        if (templates && templates.length > 0) {
          const currentDayOfWeek = new Date().getDay() || 7; // Sunday=0 → 7, Mon=1...Sat=6

          const missingTemplates = templates.filter(template => {
            // Check if it should run today
            if (template.schedule_days && template.schedule_days.length > 0) {
              if (!template.schedule_days.includes(currentDayOfWeek)) return false;
            }
            // Check if it already has an entry for today
            return !childTasks.find(t => t.template_id === template.id);
          });

          if (missingTemplates.length > 0) {
            const newTasksToInsert = missingTemplates.map(t => ({
              template_id: t.id,
              child_id: childId,
              date: todayStr,
              status: 'pending',
            }));

            const { data: insertedTasks, error: insertError } = await supabase
              .from('daily_tasks')
              .insert(newTasksToInsert)
              .select(`
                *,
                template:routine_templates (
                  title, is_mandatory, requires_photo, linked_content_url, child_id
                )
              `);

            if (insertError) {
              console.error('Error inserting daily tasks:', insertError);
            } else if (insertedTasks) {
              childTasks.push(...insertedTasks);
            }
          }
        }

        if (!cancelled) {
          setTasks(childTasks as DailyTask[]);
        }
      } catch (err) {
        console.error('Error loading child tasks', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTasks();

    return () => {
      cancelled = true;
    };
    // Use userId (string) not session (object) to avoid infinite re-renders
  }, [childId, userId]);

  const updateTaskStatus = async (taskId: string, status: string, evidenceUrl?: string, justification?: string) => {
    const updates: any = { status, completed_at: new Date().toISOString() };
    if (evidenceUrl) updates.evidence_url = evidenceUrl;
    if (justification) updates.justification = justification;

    const { error } = await supabase
      .from('daily_tasks')
      .update(updates)
      .eq('id', taskId);

    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    }
    return { error };
  };

  return { tasks, loading, updateTaskStatus };
}
