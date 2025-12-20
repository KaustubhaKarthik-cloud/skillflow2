-- Add 'testing' to task_status enum
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'testing';

-- Create task_videos table
CREATE TABLE public.task_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  url TEXT NOT NULL,
  watched BOOLEAN NOT NULL DEFAULT false,
  watched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, video_id)
);

-- Enable RLS
ALTER TABLE public.task_videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_videos
CREATE POLICY "Users can view their task videos"
ON public.task_videos FOR SELECT
USING (EXISTS (
  SELECT 1 FROM tasks t
  JOIN milestones m ON m.id = t.milestone_id
  JOIN roadmaps r ON r.id = m.roadmap_id
  WHERE t.id = task_videos.task_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can insert their task videos"
ON public.task_videos FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM tasks t
  JOIN milestones m ON m.id = t.milestone_id
  JOIN roadmaps r ON r.id = m.roadmap_id
  WHERE t.id = task_videos.task_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can update their task videos"
ON public.task_videos FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM tasks t
  JOIN milestones m ON m.id = t.milestone_id
  JOIN roadmaps r ON r.id = m.roadmap_id
  WHERE t.id = task_videos.task_id AND r.user_id = auth.uid()
));

-- Create video_summaries_cache table (public cache)
CREATE TABLE public.video_summaries_cache (
  video_id TEXT NOT NULL PRIMARY KEY,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read, system write)
ALTER TABLE public.video_summaries_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached summaries"
ON public.video_summaries_cache FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert summaries"
ON public.video_summaries_cache FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create testing_attempts table
CREATE TABLE public.testing_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reflection_text TEXT NOT NULL,
  reflection_score INTEGER,
  reflection_feedback TEXT,
  passed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testing_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their testing attempts"
ON public.testing_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their testing attempts"
ON public.testing_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their testing attempts"
ON public.testing_attempts FOR UPDATE
USING (auth.uid() = user_id);

-- Create testing_questions table
CREATE TABLE public.testing_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.testing_attempts(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testing_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their testing questions"
ON public.testing_questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM testing_attempts ta
  WHERE ta.id = testing_questions.attempt_id AND ta.user_id = auth.uid()
));

CREATE POLICY "Users can insert testing questions"
ON public.testing_questions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM testing_attempts ta
  WHERE ta.id = testing_questions.attempt_id AND ta.user_id = auth.uid()
));

-- Create testing_answers table
CREATE TABLE public.testing_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.testing_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testing_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their testing answers"
ON public.testing_answers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM testing_questions tq
  JOIN testing_attempts ta ON ta.id = tq.attempt_id
  WHERE tq.id = testing_answers.question_id AND ta.user_id = auth.uid()
));

CREATE POLICY "Users can insert their testing answers"
ON public.testing_answers FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM testing_questions tq
  JOIN testing_attempts ta ON ta.id = tq.attempt_id
  WHERE tq.id = testing_answers.question_id AND ta.user_id = auth.uid()
));

CREATE POLICY "Users can update their testing answers"
ON public.testing_answers FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM testing_questions tq
  JOIN testing_attempts ta ON ta.id = tq.attempt_id
  WHERE tq.id = testing_answers.question_id AND ta.user_id = auth.uid()
));