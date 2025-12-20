import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TestingQuestion {
  id: string;
  attempt_id: string;
  question_text: string;
  order_index: number;
  created_at: string;
}

export interface TestingAttempt {
  id: string;
  task_id: string;
  user_id: string;
  reflection_text: string;
  reflection_score: number | null;
  reflection_feedback: string | null;
  passed: boolean | null;
  created_at: string;
}

export interface LearningEvaluation {
  score: number;
  strengths: string;
  missing_concepts: string;
  feedback: string;
  passed: boolean;
}

export interface AnswerEvaluation {
  evaluations: Array<{
    question_id: string;
    score: number;
    feedback: string;
  }>;
  overall_score: number;
  passed: boolean;
  summary_feedback: string;
}

export type TestingPhase = 'reflection' | 'questions' | 'answers' | 'results';

export function useTestingFlow(taskId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [phase, setPhase] = useState<TestingPhase>('reflection');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestingQuestion[]>([]);
  const [learningEvaluation, setLearningEvaluation] = useState<LearningEvaluation | null>(null);
  const [answerEvaluation, setAnswerEvaluation] = useState<AnswerEvaluation | null>(null);

  const submitReflection = useMutation({
    mutationFn: async ({ reflection, videoSummaries, taskTitle }: { 
      reflection: string; 
      videoSummaries: string[];
      taskTitle: string;
    }) => {
      if (!taskId || !user) throw new Error('Missing task or user');

      // Create testing attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('testing_attempts')
        .insert({
          task_id: taskId,
          user_id: user.id,
          reflection_text: reflection,
        })
        .select()
        .single();

      if (attemptError) throw attemptError;
      setAttemptId(attempt.id);

      // Evaluate learning
      const { data: evalData, error: evalError } = await supabase.functions.invoke('ai-evaluate-learning', {
        body: {
          attemptId: attempt.id,
          reflection,
          videoSummaries,
          taskTitle,
        },
      });

      if (evalError) throw evalError;
      if (evalData.error) throw new Error(evalData.error);

      setLearningEvaluation(evalData.evaluation);

      // Generate questions
      const { data: questionsData, error: questionsError } = await supabase.functions.invoke('ai-generate-questions', {
        body: {
          attemptId: attempt.id,
          videoSummaries,
          taskTitle,
        },
      });

      if (questionsError) throw questionsError;
      if (questionsData.error) throw new Error(questionsData.error);

      setQuestions(questionsData.questions);
      setPhase('questions');

      return evalData.evaluation;
    },
  });

  const submitAnswers = useMutation({
    mutationFn: async ({ answers, videoSummaries, taskTitle }: {
      answers: Array<{ questionId: string; question: string; answer: string }>;
      videoSummaries: string[];
      taskTitle: string;
    }) => {
      if (!attemptId) throw new Error('No attempt ID');

      const { data, error } = await supabase.functions.invoke('ai-evaluate-answers', {
        body: {
          attemptId,
          answers,
          videoSummaries,
          taskTitle,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnswerEvaluation(data.evaluation);
      setPhase('results');

      return data.evaluation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
    },
  });

  const reset = () => {
    setPhase('reflection');
    setAttemptId(null);
    setQuestions([]);
    setLearningEvaluation(null);
    setAnswerEvaluation(null);
  };

  return {
    phase,
    setPhase,
    attemptId,
    questions,
    learningEvaluation,
    answerEvaluation,
    submitReflection,
    submitAnswers,
    reset,
  };
}
