import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface HintResult {
  hint_level: number;
  hint: string;
  common_mistakes: string[];
  next_check: string;
}

interface HintLog {
  id: string;
  user_id: string;
  task_id: string;
  hint_level: number;
  hint_content: string | null;
  created_at: string;
}

const DAILY_HINT_LIMIT = 10;

export function useHints(taskId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get today's hint count
  const { data: todayHints, isLoading: hintsLoading } = useQuery({
    queryKey: ['hint-logs', user?.id, 'today'],
    queryFn: async () => {
      if (!user) return [];

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('hint_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00Z`);

      if (error) throw error;
      return data as HintLog[];
    },
    enabled: !!user,
  });

  // Get hints for current task
  const { data: taskHints } = useQuery({
    queryKey: ['hint-logs', user?.id, taskId],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('hint_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as HintLog[];
    },
    enabled: !!user && !!taskId,
  });

  const hintsUsedToday = todayHints?.length || 0;
  const hintsRemaining = Math.max(0, DAILY_HINT_LIMIT - hintsUsedToday);
  const canUseHint = hintsRemaining > 0;

  // Get highest hint level used for this task
  const highestHintLevel = taskHints?.reduce((max, h) => Math.max(max, h.hint_level), 0) || 0;

  const requestHint = useMutation({
    mutationFn: async ({ 
      task_title, 
      task_description, 
      user_context, 
      hint_level 
    }: { 
      task_title: string; 
      task_description?: string; 
      user_context?: string; 
      hint_level: 1 | 2 | 3;
    }): Promise<HintResult> => {
      if (!user) throw new Error('Not authenticated');
      if (!canUseHint) throw new Error('Daily hint limit reached');

      const { data, error } = await supabase.functions.invoke('ai-hint', {
        body: { task_title, task_description, user_context, hint_level },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Log the hint usage
      await supabase.from('hint_logs').insert({
        user_id: user.id,
        task_id: taskId,
        hint_level,
        hint_content: data.hint,
      });

      return data as HintResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hint-logs', user?.id] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to get hint');
    },
  });

  return {
    taskHints,
    hintsUsedToday,
    hintsRemaining,
    canUseHint,
    highestHintLevel,
    requestHint,
    isLoading: hintsLoading,
    dailyLimit: DAILY_HINT_LIMIT,
  };
}
