import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserStats {
  id: string;
  user_id: string;
  target_role: string | null;
  readiness_score: number;
  weakest_skills: string[];
  task_completion_rate: number;
  testing_pass_rate: number;
  avg_ai_scores: number;
  streak_days: number;
  updated_at: string;
}

interface ReadinessInsights {
  summary: string;
  top_risks: string[];
  top_actions: string[];
}

export function useSkillReadiness() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserStats | null;
    },
    enabled: !!user,
  });

  // Calculate stats from task data
  const calculateStats = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Get all tasks for user's roadmap
      const { data: roadmaps } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('user_id', user.id);

      if (!roadmaps?.length) return null;

      const { data: milestones } = await supabase
        .from('milestones')
        .select('id')
        .in('roadmap_id', roadmaps.map(r => r.id));

      if (!milestones?.length) return null;

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status')
        .in('milestone_id', milestones.map(m => m.id));

      if (!tasks?.length) return null;

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const taskCompletionRate = (completedTasks / totalTasks) * 100;

      // Get testing attempts
      const { data: attempts } = await supabase
        .from('task_attempts')
        .select('passed, score')
        .eq('user_id', user.id);

      const passedAttempts = attempts?.filter(a => a.passed).length || 0;
      const totalAttempts = attempts?.length || 1;
      const testingPassRate = (passedAttempts / totalAttempts) * 100;

      // Calculate average AI scores
      const avgScores = attempts?.length 
        ? attempts.reduce((acc, a) => acc + (Number(a.score) || 0), 0) / attempts.length 
        : 0;

      // Calculate readiness score (weighted average)
      const readinessScore = Math.round(
        (taskCompletionRate * 0.4) + 
        (testingPassRate * 0.4) + 
        (avgScores * 10 * 0.2)
      );

      // Find weakest skills based on failed attempts
      const { data: rubrics } = await supabase
        .from('rubric_reviews')
        .select('clarity, correctness, completeness')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const weakestSkills: string[] = [];
      if (rubrics?.length) {
        const avgClarity = rubrics.reduce((acc, r) => acc + r.clarity, 0) / rubrics.length;
        const avgCorrectness = rubrics.reduce((acc, r) => acc + r.correctness, 0) / rubrics.length;
        const avgCompleteness = rubrics.reduce((acc, r) => acc + r.completeness, 0) / rubrics.length;
        
        if (avgClarity < 3) weakestSkills.push('Code Clarity');
        if (avgCorrectness < 3) weakestSkills.push('Correctness');
        if (avgCompleteness < 3) weakestSkills.push('Completeness');
      }

      // Upsert stats
      const { data: newStats, error } = await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          readiness_score: Math.min(100, Math.max(0, readinessScore)),
          task_completion_rate: taskCompletionRate,
          testing_pass_rate: testingPassRate,
          avg_ai_scores: avgScores,
          weakest_skills: weakestSkills,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return newStats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] });
    },
  });

  // Get AI insights
  const getInsights = useMutation({
    mutationFn: async (): Promise<ReadinessInsights> => {
      if (!stats) throw new Error('No stats available');

      const { data, error } = await supabase.functions.invoke('ai-readiness-insights', {
        body: {
          readiness_score: stats.readiness_score,
          weakest_skills: stats.weakest_skills,
          target_role: stats.target_role,
          recent_metrics: {
            testing_pass_rate: stats.testing_pass_rate,
            completion_rate: stats.task_completion_rate,
            streak_days: stats.streak_days,
            avg_ai_scores: stats.avg_ai_scores,
          },
        },
      });

      if (error) throw error;
      return data as ReadinessInsights;
    },
  });

  return {
    stats,
    isLoading: statsLoading,
    calculateStats,
    getInsights,
  };
}
