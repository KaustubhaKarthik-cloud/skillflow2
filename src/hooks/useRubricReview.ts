import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface RubricReview {
  id: string;
  user_id: string;
  task_id: string;
  submission_id: string | null;
  clarity: number;
  correctness: number;
  completeness: number;
  overall_score: number;
  strengths: string | null;
  issues: string | null;
  next_steps: string | null;
  created_at: string;
}

interface RubricResult {
  clarity: number;
  correctness: number;
  completeness: number;
  overall_score_10: number;
  strengths: string[];
  issues: string[];
  next_steps: string[];
}

export function useRubricReview(taskId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get existing reviews for this task
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['rubric-reviews', user?.id, taskId],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('rubric_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RubricReview[];
    },
    enabled: !!user && !!taskId,
  });

  const latestReview = reviews?.[0] || null;

  const submitForReview = useMutation({
    mutationFn: async ({
      task_title,
      task_description,
      acceptance_criteria,
      user_submission,
      reference_summary,
      submission_id,
    }: {
      task_title: string;
      task_description?: string;
      acceptance_criteria?: string[];
      user_submission: string;
      reference_summary?: string;
      submission_id?: string;
    }): Promise<RubricResult> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('ai-rubric-review', {
        body: { task_title, task_description, acceptance_criteria, user_submission, reference_summary },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const result = data as RubricResult;

      // Save review to database
      await supabase.from('rubric_reviews').insert({
        user_id: user.id,
        task_id: taskId,
        submission_id: submission_id || null,
        clarity: result.clarity,
        correctness: result.correctness,
        completeness: result.completeness,
        overall_score: result.overall_score_10,
        strengths: JSON.stringify(result.strengths),
        issues: JSON.stringify(result.issues),
        next_steps: JSON.stringify(result.next_steps),
      });

      // Also log as task attempt
      await supabase.from('task_attempts').insert({
        user_id: user.id,
        task_id: taskId,
        attempt_type: 'submission',
        score: result.overall_score_10,
        passed: result.overall_score_10 >= 7,
        feedback: JSON.stringify(result),
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubric-reviews', user?.id, taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-attempts', user?.id] });
      toast.success('Review completed!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit for review');
    },
  });

  return {
    reviews,
    latestReview,
    isLoading,
    submitForReview,
  };
}
