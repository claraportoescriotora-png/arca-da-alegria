import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { Child } from './useMoreh';

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
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId || !session?.user?.id) return;

    async function loadTasks() {
      setLoading(true);
      try {
        // 1. Get today's date string (YYYY-MM-DD)
        const todayStr = new Date().toISOString().split('T')[0];

        // 2. Fetch existing daily tasks for today
        const { data: existingTasks } = await supabase
          .from('daily_tasks')
          .select(`
            *,
            template:routine_templates (
              title, is_mandatory, requires_photo, linked_content_url, child_id
            )
          `)
          .gte('created_at', `${todayStr}T00:00:00Z`)
          .lte('created_at', `${todayStr}T23:59:59Z`);

        // Filter by child_id
        const childTasks = existingTasks?.filter(t => t.template.child_id === childId) || [];

        // 3. Fetch templates to see if we need to generate new tasks for today
        const { data: templates } = await supabase
          .from('routine_templates')
          .select('*')
          .eq('child_id', childId);

        if (templates) {
          const currentDayOfWeek = new Date().getDay() || 7; // 1-7
          
          const missingTemplates = templates.filter(template => {
            // Check if it should run today
            if (template.schedule_days && template.schedule_days.length > 0) {
              if (!template.schedule_days.includes(currentDayOfWeek)) return false;
            }
            
            // Check if it already exists
            return !childTasks.find(t => t.template_id === template.id);
          });

          if (missingTemplates.length > 0) {
            const newTasksToInsert = missingTemplates.map(t => ({
              template_id: t.id,
              user_id: session!.user!.id,
              status: 'pending'
            }));

            const { data: insertedTasks } = await supabase
              .from('daily_tasks')
              .insert(newTasksToInsert)
              .select(`
                *,
                template:routine_templates (
                  title, is_mandatory, requires_photo, linked_content_url, child_id
                )
              `);
            
            if (insertedTasks) {
              childTasks.push(...insertedTasks);
            }
          }
        }

        setTasks(childTasks as DailyTask[]);
      } catch (err) {
        console.error('Error loading child tasks', err);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [childId, session]);

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
