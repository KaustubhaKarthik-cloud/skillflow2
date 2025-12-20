import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const [isRestoring, setIsRestoring] = useState(true);
  const [storedSummaries, setStoredSummaries] = useState<string[]>([]);

  // Query to fetch existing incomplete attempt for this task
  const { data: existingAttempt } = useQuery({
    queryKey: ['testing-attempt', taskId, user?.id],
    queryFn: async () => {
      if (!taskId || !user) return null;

      // Find the most recent incomplete attempt (passed is null)
      const { data, error } = await supabase
        .from('testing_attempts')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .is('passed', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching attempt:', error);
        return null;
      }

      return data as (TestingAttempt & { video_summaries?: string[] | null }) | null;
    },
    enabled: !!taskId && !!user,
  });

  // Query to fetch questions for existing attempt
  const { data: existingQuestions } = useQuery({
    queryKey: ['testing-questions', existingAttempt?.id],
    queryFn: async () => {
      if (!existingAttempt?.id) return [];

      const { data, error } = await supabase
        .from('testing_questions')
        .select('*')
        .eq('attempt_id', existingAttempt.id)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching questions:', error);
        return [];
      }

      return data as TestingQuestion[];
    },
    enabled: !!existingAttempt?.id,
  });

  // Query to fetch existing answers
  const { data: existingAnswers } = useQuery({
    queryKey: ['testing-answers', existingAttempt?.id],
    queryFn: async () => {
      if (!existingAttempt?.id || !existingQuestions?.length) return [];

      const questionIds = existingQuestions.map(q => q.id);
      const { data, error } = await supabase
        .from('testing_answers')
        .select('*')
        .in('question_id', questionIds);

      if (error) {
        console.error('Error fetching answers:', error);
        return [];
      }

      return data;
    },
    enabled: !!existingAttempt?.id && !!existingQuestions?.length,
  });

  // Restore state from database when data is loaded
  useEffect(() => {
    if (!taskId || !user) {
      setIsRestoring(false);
      return;
    }

    // Wait for queries to complete
    if (existingAttempt === undefined) return;

    if (existingAttempt && existingQuestions) {
      // Restore the attempt
      setAttemptId(existingAttempt.id);
      
      // Restore video summaries if available
      const attemptWithSummaries = existingAttempt as (TestingAttempt & { video_summaries?: string[] | null });
      if (attemptWithSummaries.video_summaries && attemptWithSummaries.video_summaries.length > 0) {
        setStoredSummaries(attemptWithSummaries.video_summaries);
      }
      
      // Restore learning evaluation if available
      if (existingAttempt.reflection_score !== null) {
        setLearningEvaluation({
          score: existingAttempt.reflection_score,
          feedback: existingAttempt.reflection_feedback || '',
          strengths: '',
          missing_concepts: '',
          passed: existingAttempt.reflection_score >= 6,
        });
      }

      // Restore questions
      if (existingQuestions.length > 0) {
        setQuestions(existingQuestions);
        
        // Check if all questions have answers
        const answeredCount = existingAnswers?.length || 0;
        
        if (answeredCount >= existingQuestions.length && existingAnswers?.some(a => a.score !== null)) {
          // All questions answered and evaluated - go to results
          const evaluations = existingAnswers?.map(a => ({
            question_id: a.question_id,
            score: a.score || 0,
            feedback: a.feedback || '',
          })) || [];
          
          const overallScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
          setAnswerEvaluation({
            evaluations,
            overall_score: overallScore,
            passed: overallScore >= 6,
            summary_feedback: 'Your answers have been evaluated.',
          });
          setPhase('results');
        } else {
          // Questions exist but not all answered - go to questions phase
          setPhase('questions');
        }
      } else {
        // Attempt exists but no questions yet - reflection was submitted
        setPhase('reflection');
      }
    } else {
      // No existing attempt - start fresh
      setPhase('reflection');
    }

    setIsRestoring(false);
  }, [existingAttempt, existingQuestions, existingAnswers, taskId, user]);

  const submitReflection = useMutation({
    mutationFn: async ({ reflection, videoSummaries, taskTitle }: { 
      reflection: string; 
      videoSummaries: string[];
      taskTitle: string;
    }) => {
      if (!taskId || !user) throw new Error('Missing task or user');

      // Create testing attempt with video summaries stored
      const { data: attempt, error: attemptError } = await supabase
        .from('testing_attempts')
        .insert({
          task_id: taskId,
          user_id: user.id,
          reflection_text: reflection,
          video_summaries: videoSummaries, // Store summaries for later restoration
        })
        .select()
        .single();

      if (attemptError) throw attemptError;
      setAttemptId(attempt.id);
      setStoredSummaries(videoSummaries);

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

      // Invalidate queries to refresh state
      queryClient.invalidateQueries({ queryKey: ['testing-attempt', taskId, user.id] });
      queryClient.invalidateQueries({ queryKey: ['testing-questions'] });

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

      // Invalidate queries to refresh state
      queryClient.invalidateQueries({ queryKey: ['testing-answers'] });

      return data.evaluation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
    },
  });

  const reset = useCallback(() => {
    setPhase('reflection');
    setAttemptId(null);
    setQuestions([]);
    setLearningEvaluation(null);
    setAnswerEvaluation(null);
    setStoredSummaries([]);
    
    // Invalidate queries to force refresh on next open
    if (taskId && user) {
      queryClient.invalidateQueries({ queryKey: ['testing-attempt', taskId, user.id] });
      queryClient.invalidateQueries({ queryKey: ['testing-questions'] });
      queryClient.invalidateQueries({ queryKey: ['testing-answers'] });
    }
  }, [taskId, user, queryClient]);

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
    isRestoring,
    storedSummaries, // Expose stored summaries for restoration
    // Expose saved answers for restoration
    savedAnswers: existingAnswers?.reduce((acc, a) => {
      const question = existingQuestions?.find(q => q.id === a.question_id);
      if (question) {
        acc[a.question_id] = a.answer_text;
      }
      return acc;
    }, {} as Record<string, string>) || {},
  };
}
