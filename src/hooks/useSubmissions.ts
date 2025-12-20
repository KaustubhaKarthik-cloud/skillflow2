import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Submission {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  github_link: string | null;
  created_at: string;
}

export interface AIReview {
  id: string;
  submission_id: string;
  score: number;
  strengths: string | null;
  improvements: string | null;
  next_action: string | null;
  created_at: string;
}

export interface SubmissionWithReview extends Submission {
  review: AIReview | null;
}

export function useSubmissions(taskId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['submissions', user?.id, taskId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data: submissionsData, error: submissionsError } = await query;

      if (submissionsError) throw submissionsError;

      // Get reviews for each submission
      const submissionsWithReviews: SubmissionWithReview[] = await Promise.all(
        (submissionsData || []).map(async (submission) => {
          const { data: review } = await supabase
            .from('ai_reviews')
            .select('*')
            .eq('submission_id', submission.id)
            .maybeSingle();

          return {
            ...submission,
            review: review as AIReview | null,
          };
        })
      );

      return submissionsWithReviews;
    },
    enabled: !!user,
  });

  const createSubmission = useMutation({
    mutationFn: async ({ taskId, content, githubLink }: { taskId: string; content: string; githubLink?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('submissions')
        .insert({
          task_id: taskId,
          user_id: user.id,
          content,
          github_link: githubLink || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', user?.id] });
    },
  });

  return {
    submissions,
    isLoading,
    error,
    createSubmission,
  };
}

export function useAllSubmissions() {
  const { user } = useAuth();

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['all-submissions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Get reviews for each submission
      const submissionsWithReviews: SubmissionWithReview[] = await Promise.all(
        (submissionsData || []).map(async (submission) => {
          const { data: review } = await supabase
            .from('ai_reviews')
            .select('*')
            .eq('submission_id', submission.id)
            .maybeSingle();

          return {
            ...submission,
            review: review as AIReview | null,
          };
        })
      );

      return submissionsWithReviews;
    },
    enabled: !!user,
  });

  return {
    submissions,
    isLoading,
    error,
  };
}
