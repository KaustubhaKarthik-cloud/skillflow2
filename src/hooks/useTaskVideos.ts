import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TaskVideo {
  id: string;
  task_id: string;
  video_id: string;
  title: string;
  channel: string;
  url: string;
  watched: boolean;
  watched_at: string | null;
  created_at: string;
}

export function useTaskVideos(taskId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['task-videos', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from('task_videos')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TaskVideo[];
    },
    enabled: !!taskId && !!user,
  });

  const fetchVideos = useMutation({
    mutationFn: async ({ taskId, query }: { taskId: string; query: string }) => {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { taskId, query },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.videos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-videos', taskId] });
    },
  });

  const markWatched = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from('task_videos')
        .update({ watched: true, watched_at: new Date().toISOString() })
        .eq('id', videoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-videos', taskId] });
    },
  });

  const watchedCount = videos?.filter(v => v.watched).length || 0;
  const totalCount = videos?.length || 0;
  const canStartTesting = watchedCount >= 2;

  return {
    videos,
    isLoading,
    error,
    fetchVideos,
    markWatched,
    watchedCount,
    totalCount,
    canStartTesting,
  };
}
