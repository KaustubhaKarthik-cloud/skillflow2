-- Add column to store video summaries for testing restoration
ALTER TABLE public.testing_attempts 
ADD COLUMN IF NOT EXISTS video_summaries text[] DEFAULT NULL;