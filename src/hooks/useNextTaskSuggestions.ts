import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface TaskSuggestion {
  task_id: string;
  title: string;
  why: string;
  expected_impact: 'high' | 'medium' | 'low';
}

interface SuggestionResult {
  suggestions: TaskSuggestion[];
  focus_areas: string[];
}

interface StoredSuggestion {
  id: string;
  user_id: string;
  generated_for_task_id: string | null;
  suggestions_json: SuggestionResult;
  focus_areas: string[];
  created_at: string;
}

export function useNextTaskSuggestions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get latest suggestions
  const { data: latestSuggestion, isLoading } = useQuery({
    queryKey: ['next-task-suggestions', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('next_task_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        suggestions_json: data.suggestions_json as unknown as SuggestionResult,
      } as StoredSuggestion;
    },
    enabled: !!user,
  });

  const generateSuggestions = useMutation({
    mutationFn: async ({
      target_role,
      roadmap_tasks,
      recent_results,
      generated_for_task_id,
    }: {
      target_role?: string;
      roadmap_tasks: Array<{
        task_id: string;
        title: string;
        status: string;
        tags?: string[];
        difficulty?: string;
      }>;
      recent_results?: {
        failed_concepts?: string[];
        rubric_scores?: { clarity: number; correctness: number; completeness: number };
        testing_outcomes?: { passed: boolean; score: number }[];
      };
      generated_for_task_id?: string;
    }): Promise<SuggestionResult> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('ai-next-task', {
        body: { target_role, roadmap_tasks, recent_results },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const result = data as SuggestionResult;

      // Save to database - use type assertion to bypass strict typing
      const insertData = {
        user_id: user.id,
        generated_for_task_id: generated_for_task_id || null,
        suggestions_json: result as unknown as Record<string, unknown>,
        focus_areas: result.focus_areas || [],
      };
      
      const { error: insertError } = await supabase
        .from('next_task_suggestions')
        .insert(insertData as any);

      if (insertError) throw insertError;

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-task-suggestions', user?.id] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate suggestions');
    },
  });

  return {
    latestSuggestion,
    suggestions: latestSuggestion?.suggestions_json?.suggestions || [],
    focusAreas: latestSuggestion?.focus_areas || [],
    isLoading,
    generateSuggestions,
  };
}
