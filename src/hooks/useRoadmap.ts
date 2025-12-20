import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  milestone_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  roadmap_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  tasks: Task[];
}

export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  milestones: Milestone[];
}

export function useRoadmap() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: roadmap, isLoading, error } = useQuery({
    queryKey: ['roadmap', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: roadmaps, error: roadmapError } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (roadmapError) throw roadmapError;
      if (!roadmaps || roadmaps.length === 0) return null;

      const roadmapData = roadmaps[0];

      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('roadmap_id', roadmapData.id)
        .order('order_index', { ascending: true });

      if (milestonesError) throw milestonesError;

      const milestonesWithTasks: Milestone[] = await Promise.all(
        (milestones || []).map(async (milestone) => {
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('milestone_id', milestone.id)
            .order('order_index', { ascending: true });

          if (tasksError) throw tasksError;

          return {
            ...milestone,
            tasks: (tasks || []) as Task[],
          };
        })
      );

      return {
        ...roadmapData,
        milestones: milestonesWithTasks,
      } as Roadmap;
    },
    enabled: !!user,
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', user?.id] });
    },
  });

  return {
    roadmap,
    isLoading,
    error,
    updateTaskStatus,
  };
}
