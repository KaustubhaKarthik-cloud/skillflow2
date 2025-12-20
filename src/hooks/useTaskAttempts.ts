import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface TaskAttempt {
  id: string;
  task_id: string;
  user_id: string;
  attempt_type: 'testing' | 'submission';
  score: number;
  passed: boolean;
  feedback: string | null;
  created_at: string;
}

interface RevisionTask {
  id: string;
  user_id: string;
  original_task_id: string;
  new_task_id: string | null;
  reason: string | null;
  created_at: string;
}

interface AdaptiveResult {
  create_revision_task: boolean;
  revision_task: {
    title: string;
    description: string;
    acceptance_criteria: string[];
    estimated_hours: number;
    resources_hint: string[];
  };
  reason: string;
}

export function useTaskAttempts(taskId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get attempts for a specific task
  const { data: attempts, isLoading } = useQuery({
    queryKey: ['task-attempts', user?.id, taskId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('task_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TaskAttempt[];
    },
    enabled: !!user,
  });

  // Get revision tasks for the current user
  const { data: revisionTasks } = useQuery({
    queryKey: ['revision-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('revision_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RevisionTask[];
    },
    enabled: !!user,
  });

  // Count failures for a specific task
  const getFailureCount = (tid: string) => {
    return attempts?.filter(a => a.task_id === tid && !a.passed).length || 0;
  };

  // Log an attempt
  const logAttempt = useMutation({
    mutationFn: async ({
      task_id,
      attempt_type,
      score,
      passed,
      feedback,
    }: {
      task_id: string;
      attempt_type: 'testing' | 'submission';
      score: number;
      passed: boolean;
      feedback?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('task_attempts')
        .insert({
          user_id: user.id,
          task_id,
          attempt_type,
          score,
          passed,
          feedback: feedback || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attempts', user?.id] });
    },
  });

  // Check if revision task is needed
  const checkRevision = useMutation({
    mutationFn: async ({
      task_title,
      task_description,
      failure_count,
      last_feedback,
      weak_concepts,
    }: {
      task_title: string;
      task_description?: string;
      failure_count: number;
      last_feedback?: any;
      weak_concepts?: string[];
    }): Promise<AdaptiveResult> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('ai-adaptive-roadmap', {
        body: { task_title, task_description, failure_count, last_feedback, weak_concepts },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data as AdaptiveResult;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to check for revision needs');
    },
  });

  // Create revision task in database
  const createRevisionTask = useMutation({
    mutationFn: async ({
      original_task_id,
      milestone_id,
      revision_task,
      reason,
    }: {
      original_task_id: string;
      milestone_id: string;
      revision_task: AdaptiveResult['revision_task'];
      reason: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Create the new task
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          milestone_id,
          title: `📚 ${revision_task.title}`,
          description: revision_task.description,
          status: 'todo',
          order_index: 0,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Link revision task
      const { error: revisionError } = await supabase
        .from('revision_tasks')
        .insert({
          user_id: user.id,
          original_task_id,
          new_task_id: newTask.id,
          reason,
        });

      if (revisionError) throw revisionError;

      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['revision-tasks', user?.id] });
      toast.success('Revision task created!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create revision task');
    },
  });

  return {
    attempts,
    revisionTasks,
    isLoading,
    getFailureCount,
    logAttempt,
    checkRevision,
    createRevisionTask,
  };
}
