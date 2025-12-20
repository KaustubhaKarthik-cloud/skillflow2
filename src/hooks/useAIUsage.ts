import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AIActionType = 'roadmap_generation' | 'project_review';

interface AIUsage {
  id: string;
  user_id: string;
  action: AIActionType;
  usage_date: string;
  count: number;
}

const LIMITS = {
  roadmap_generation: 1,
  project_review: 3,
};

export function useAIUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: usage, isLoading } = useQuery({
    queryKey: ['ai-usage', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('ai_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', today);

      if (error) throw error;
      return data as AIUsage[];
    },
    enabled: !!user,
  });

  const checkLimit = (action: AIActionType): { canUse: boolean; remaining: number } => {
    const actionUsage = usage?.find(u => u.action === action);
    const currentCount = actionUsage?.count || 0;
    const limit = LIMITS[action];
    
    return {
      canUse: currentCount < limit,
      remaining: Math.max(0, limit - currentCount),
    };
  };

  const incrementUsage = useMutation({
    mutationFn: async (action: AIActionType) => {
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];
      
      // Try to update existing record
      const { data: existing } = await supabase
        .from('ai_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', action)
        .eq('usage_date', today)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('ai_usage')
          .update({ count: existing.count + 1 })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ai_usage')
          .insert({
            user_id: user.id,
            action,
            usage_date: today,
            count: 1,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage', user?.id] });
    },
  });

  return {
    usage,
    isLoading,
    checkLimit,
    incrementUsage,
    limits: LIMITS,
  };
}
