import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTestingFlow, TestingPhase } from '@/hooks/useTestingFlow';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  Loader2, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  HelpCircle,
  Award,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface TaskTestingPanelProps {
  taskId: string;
  taskTitle: string;
  videoSummaries: string[];
  onComplete: (passed: boolean) => void;
  onBack: () => void;
}

const TaskTestingPanel = ({ 
  taskId, 
  taskTitle, 
  videoSummaries, 
  onComplete,
  onBack 
}: TaskTestingPanelProps) => {
  const {
    phase,
    questions,
    learningEvaluation,
    answerEvaluation,
    submitReflection,
    submitAnswers,
    reset,
    isRestoring,
    savedAnswers,
  } = useTestingFlow(taskId);

  const [reflection, setReflection] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Restore saved answers when they become available
  useEffect(() => {
    if (savedAnswers && Object.keys(savedAnswers).length > 0) {
      setAnswers(prev => ({ ...savedAnswers, ...prev }));
    }
  }, [savedAnswers]);

  const minReflectionLength = 80;
  const isReflectionValid = reflection.trim().length >= minReflectionLength;

  const handleSubmitReflection = async () => {
    if (!isReflectionValid) {
      toast.error(`Please write at least ${minReflectionLength} characters`);
      return;
    }

    try {
      await submitReflection.mutateAsync({
        reflection,
        videoSummaries,
        taskTitle,
      });
      toast.success('Reflection evaluated! Now answer some questions.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit reflection');
    }
  };

  const handleSubmitAnswers = async () => {
    const allAnswered = questions.every(q => answers[q.id]?.trim().length > 0);
    if (!allAnswered) {
      toast.error('Please answer all questions');
      return;
    }

    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        question: q.question_text,
        answer: answers[q.id],
      }));

      const result = await submitAnswers.mutateAsync({
        answers: formattedAnswers,
        videoSummaries,
        taskTitle,
      });

      if (result.passed) {
        toast.success('Congratulations! You passed!');
      } else {
        toast.info('Keep practicing! Review the feedback and try again.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit answers');
    }
  };

  const handleComplete = () => {
    const passed = answerEvaluation?.passed ?? false;
    onComplete(passed);
    reset();
  };

  // Show loading while restoring state
  if (isRestoring) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Restoring your progress...</span>
      </div>
    );
  }

  // Render based on phase
  if (phase === 'reflection') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            What Did You Learn?
          </h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Reflect on the videos you watched. Explain the key concepts in your own words.
        </p>

        <div>
          <Textarea
            placeholder="Describe what you learned from the videos..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <div className="flex justify-between mt-2 text-xs">
            <span className={reflection.length >= minReflectionLength ? 'text-primary' : 'text-muted-foreground'}>
              {reflection.length} / {minReflectionLength} characters minimum
            </span>
            {reflection.length >= minReflectionLength && (
              <span className="text-primary">✓ Ready to submit</span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            Back to Videos
          </Button>
          <Button
            onClick={handleSubmitReflection}
            disabled={!isReflectionValid || submitReflection.isPending}
            variant="gradient"
          >
            {submitReflection.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Reflection
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'questions') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Comprehension Questions
            </h3>
          </div>
          <Badge variant="outline">
            {Object.values(answers).filter(a => a.trim()).length} / {questions.length} answered
          </Badge>
        </div>

        {learningEvaluation && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">
                  Reflection Score: {learningEvaluation.score}/10
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {learningEvaluation.feedback}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Question {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-foreground">{question.question_text}</p>
                  <Textarea
                    placeholder="Type your answer..."
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers(prev => ({
                      ...prev,
                      [question.id]: e.target.value
                    }))}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Button
          onClick={handleSubmitAnswers}
          disabled={submitAnswers.isPending || questions.some(q => !answers[q.id]?.trim())}
          className="w-full"
          variant="gradient"
          size="lg"
        >
          {submitAnswers.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Submit Answers
        </Button>
      </div>
    );
  }

  if (phase === 'results') {
    const passed = answerEvaluation?.passed ?? false;

    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            {passed ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            ) : (
              <XCircle className="w-16 h-16 text-orange-500 mx-auto" />
            )}
          </motion.div>
          
          <h3 className="text-2xl font-bold text-foreground mt-4">
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </h3>
          
          <p className="text-muted-foreground mt-2">
            {passed 
              ? 'You have demonstrated understanding of this topic.'
              : 'Review the feedback and try again when ready.'}
          </p>
        </div>

        {answerEvaluation && (
          <>
            <Card className={passed ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/20'}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-foreground">Overall Score</span>
                  <Badge variant={passed ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                    {answerEvaluation.overall_score}/10
                  </Badge>
                </div>
                <p className="text-muted-foreground">{answerEvaluation.summary_feedback}</p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Question Feedback</h4>
              {answerEvaluation.evaluations.map((evaluation, index) => (
                <Card key={evaluation.question_id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Question {index + 1}
                      </span>
                      <Badge variant={evaluation.score >= 6 ? 'default' : 'secondary'}>
                        {evaluation.score}/10
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <Button
          onClick={handleComplete}
          className="w-full"
          variant="gradient"
          size="lg"
        >
          {passed ? 'Complete Task' : 'Try Again Later'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return null;
};

export default TaskTestingPanel;
