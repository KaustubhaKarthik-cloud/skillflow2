-- Create enums for user profile
CREATE TYPE public.branch_type AS ENUM ('CSE', 'IT', 'ECE');
CREATE TYPE public.skill_level AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE public.target_role AS ENUM ('Frontend', 'Backend', 'Full Stack');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE public.ai_action_type AS ENUM ('roadmap_generation', 'project_review');

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  branch branch_type,
  skill_level skill_level,
  target_role target_role,
  weekly_hours INTEGER DEFAULT 10,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create roadmaps table
CREATE TABLE public.roadmaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  github_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_reviews table
CREATE TABLE public.ai_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  strengths TEXT,
  improvements TEXT,
  next_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_usage table
CREATE TABLE public.ai_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action ai_action_type NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, action, usage_date)
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for roadmaps
CREATE POLICY "Users can view their own roadmaps" ON public.roadmaps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roadmaps" ON public.roadmaps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmaps" ON public.roadmaps
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for milestones (through roadmap ownership)
CREATE POLICY "Users can view milestones of their roadmaps" ON public.milestones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create milestones in their roadmaps" ON public.milestones
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );

-- RLS Policies for tasks (through milestone -> roadmap ownership)
CREATE POLICY "Users can view tasks of their milestones" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.milestones m
      JOIN public.roadmaps r ON r.id = m.roadmap_id
      WHERE m.id = tasks.milestone_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their milestones" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.milestones m
      JOIN public.roadmaps r ON r.id = m.roadmap_id
      WHERE m.id = milestone_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.milestones m
      JOIN public.roadmaps r ON r.id = m.roadmap_id
      WHERE m.id = tasks.milestone_id AND r.user_id = auth.uid()
    )
  );

-- RLS Policies for submissions
CREATE POLICY "Users can view their own submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_reviews (through submission ownership)
CREATE POLICY "Users can view reviews of their submissions" ON public.ai_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid())
  );

CREATE POLICY "System can create reviews" ON public.ai_reviews
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid())
  );

-- RLS Policies for ai_usage
CREATE POLICY "Users can view their own usage" ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON public.ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON public.ai_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();