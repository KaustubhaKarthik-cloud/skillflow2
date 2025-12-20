import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TaskTemplate {
  id: string;
  role: 'frontend' | 'backend' | 'devops';
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  estimated_hours: number;
  acceptance_criteria: string[];
  workflow_habit: string | null;
  resources_hint: string[];
  order_index: number;
}

export function useTaskTemplates(role?: 'frontend' | 'backend' | 'devops') {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['task-templates', role],
    queryFn: async () => {
      let query = supabase
        .from('task_templates')
        .select('*')
        .order('order_index', { ascending: true });

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TaskTemplate[];
    },
  });

  // Group templates by role
  const templatesByRole = templates?.reduce((acc, template) => {
    if (!acc[template.role]) {
      acc[template.role] = [];
    }
    acc[template.role].push(template);
    return acc;
  }, {} as Record<string, TaskTemplate[]>) || {};

  return {
    templates,
    templatesByRole,
    isLoading,
    frontendTemplates: templatesByRole['frontend'] || [],
    backendTemplates: templatesByRole['backend'] || [],
    devopsTemplates: templatesByRole['devops'] || [],
  };
}
