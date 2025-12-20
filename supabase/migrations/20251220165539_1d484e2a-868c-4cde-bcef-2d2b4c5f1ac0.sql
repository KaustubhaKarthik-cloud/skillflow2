-- Create user_stats table for Skill Readiness Score
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_role TEXT,
  readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  weakest_skills TEXT[] DEFAULT '{}',
  task_completion_rate NUMERIC(5,2) DEFAULT 0,
  testing_pass_rate NUMERIC(5,2) DEFAULT 0,
  avg_ai_scores NUMERIC(5,2) DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create task_attempts table to track all attempts
CREATE TABLE public.task_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('testing', 'submission')),
  score NUMERIC(4,2) DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create revision_tasks table for adaptive roadmap
CREATE TABLE public.revision_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  new_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_templates table for role-based templates
CREATE TABLE public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('frontend', 'backend', 'devops')),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[] DEFAULT '{}',
  estimated_hours INTEGER DEFAULT 2,
  acceptance_criteria TEXT[] DEFAULT '{}',
  workflow_habit TEXT,
  resources_hint TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hint_logs table
CREATE TABLE public.hint_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  hint_level INTEGER NOT NULL CHECK (hint_level IN (1, 2, 3)),
  hint_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rubric_reviews table
CREATE TABLE public.rubric_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  clarity INTEGER DEFAULT 0 CHECK (clarity >= 0 AND clarity <= 5),
  correctness INTEGER DEFAULT 0 CHECK (correctness >= 0 AND correctness <= 5),
  completeness INTEGER DEFAULT 0 CHECK (completeness >= 0 AND completeness <= 5),
  overall_score NUMERIC(4,2) DEFAULT 0,
  strengths TEXT,
  issues TEXT,
  next_steps TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create next_task_suggestions table
CREATE TABLE public.next_task_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  generated_for_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  suggestions_json JSONB NOT NULL DEFAULT '[]',
  focus_areas TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hint_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.next_task_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS for user_stats
CREATE POLICY "Users can view their own stats" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

-- RLS for task_attempts
CREATE POLICY "Users can view their own attempts" ON public.task_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts" ON public.task_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for revision_tasks
CREATE POLICY "Users can view their own revision tasks" ON public.revision_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own revision tasks" ON public.revision_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for task_templates (public read, admin write)
CREATE POLICY "Anyone can view templates" ON public.task_templates FOR SELECT USING (true);

-- RLS for hint_logs
CREATE POLICY "Users can view their own hints" ON public.hint_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own hints" ON public.hint_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for rubric_reviews
CREATE POLICY "Users can view their own reviews" ON public.rubric_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reviews" ON public.rubric_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for next_task_suggestions
CREATE POLICY "Users can view their own suggestions" ON public.next_task_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own suggestions" ON public.next_task_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for user_stats
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default task templates for each role
INSERT INTO public.task_templates (role, title, description, difficulty, tags, estimated_hours, acceptance_criteria, workflow_habit, resources_hint, order_index) VALUES
-- Frontend templates
('frontend', 'React Component Basics', 'Create reusable React components with props and state management', 'easy', ARRAY['react', 'components', 'jsx'], 3, ARRAY['Component renders correctly', 'Props are properly typed', 'State updates work'], 'Write component documentation in README', ARRAY['React docs', 'Component patterns'], 1),
('frontend', 'Form Handling & Validation', 'Build forms with proper validation and error handling using React Hook Form', 'medium', ARRAY['react', 'forms', 'validation'], 4, ARRAY['Form validates all inputs', 'Error messages display correctly', 'Submit handles success/failure'], 'Add form validation tests', ARRAY['React Hook Form docs', 'Zod validation'], 2),
('frontend', 'API Integration', 'Connect frontend to REST APIs with loading states and error handling', 'medium', ARRAY['react', 'api', 'fetch', 'tanstack-query'], 5, ARRAY['API calls work correctly', 'Loading states show', 'Errors are handled gracefully'], 'Document API endpoints used', ARRAY['TanStack Query docs', 'REST API patterns'], 3),
('frontend', 'Authentication UI', 'Implement login/signup forms with protected routes', 'medium', ARRAY['react', 'auth', 'routing'], 6, ARRAY['Login/signup forms work', 'Protected routes redirect', 'Session persists'], 'Test auth flow end-to-end', ARRAY['Auth patterns', 'React Router docs'], 4),
('frontend', 'Responsive Design', 'Make components responsive across all device sizes', 'easy', ARRAY['css', 'tailwind', 'responsive'], 3, ARRAY['Works on mobile', 'Works on tablet', 'Works on desktop'], 'Test on multiple screen sizes', ARRAY['Tailwind responsive docs', 'Mobile-first design'], 5),

-- Backend templates
('backend', 'REST API CRUD', 'Build CRUD endpoints with proper HTTP methods and status codes', 'medium', ARRAY['api', 'rest', 'crud'], 5, ARRAY['All CRUD operations work', 'Proper status codes returned', 'Input validation exists'], 'Document API with examples', ARRAY['REST best practices', 'HTTP status codes'], 1),
('backend', 'Database Schema Design', 'Design normalized database schema with relationships', 'medium', ARRAY['database', 'sql', 'schema'], 4, ARRAY['Schema is normalized', 'Relationships are correct', 'Indexes are added'], 'Create ER diagram', ARRAY['Database normalization', 'PostgreSQL docs'], 2),
('backend', 'Input Validation & Sanitization', 'Implement server-side validation and data sanitization', 'medium', ARRAY['validation', 'security', 'api'], 4, ARRAY['All inputs validated', 'SQL injection prevented', 'XSS prevented'], 'Write validation test cases', ARRAY['OWASP guidelines', 'Zod server validation'], 3),
('backend', 'Authentication & Authorization', 'Implement JWT auth with role-based access control', 'hard', ARRAY['auth', 'jwt', 'rbac', 'security'], 8, ARRAY['JWT tokens work', 'Roles are enforced', 'Passwords are hashed'], 'Security review checklist', ARRAY['JWT best practices', 'RBAC patterns'], 4),
('backend', 'Error Handling & Logging', 'Add comprehensive error handling and logging', 'easy', ARRAY['errors', 'logging', 'debugging'], 3, ARRAY['Errors are caught', 'Logs are meaningful', 'No sensitive data leaked'], 'Set up log monitoring', ARRAY['Error handling patterns', 'Logging best practices'], 5),

-- DevOps templates
('devops', 'Docker Basics', 'Containerize an application with Docker', 'medium', ARRAY['docker', 'containers', 'devops'], 4, ARRAY['Dockerfile works', 'Container runs locally', 'Environment vars configured'], 'Document docker commands', ARRAY['Docker docs', 'Dockerfile best practices'], 1),
('devops', 'CI/CD Pipeline Setup', 'Configure automated testing and deployment pipeline', 'hard', ARRAY['ci-cd', 'github-actions', 'automation'], 6, ARRAY['Tests run on push', 'Build succeeds', 'Deploy works'], 'Document pipeline stages', ARRAY['GitHub Actions docs', 'CI/CD patterns'], 2),
('devops', 'Environment Configuration', 'Set up development, staging, and production environments', 'medium', ARRAY['environments', 'config', 'secrets'], 4, ARRAY['Env vars managed', 'Secrets are secure', 'Configs are separate'], 'Create environment checklist', ARRAY['12-factor app', 'Secret management'], 3),
('devops', 'Monitoring & Alerts', 'Set up application monitoring and alerting', 'medium', ARRAY['monitoring', 'alerts', 'observability'], 5, ARRAY['Metrics collected', 'Alerts configured', 'Dashboard created'], 'Document alert thresholds', ARRAY['Monitoring best practices', 'Observability'], 4),
('devops', 'Deployment Checklist', 'Create and follow a deployment verification checklist', 'easy', ARRAY['deployment', 'checklist', 'verification'], 2, ARRAY['Checklist is complete', 'Rollback plan exists', 'Health checks work'], 'Review after each deploy', ARRAY['Deployment strategies', 'Rollback patterns'], 5);