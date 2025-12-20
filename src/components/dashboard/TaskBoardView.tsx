import { useState } from "react";
import { motion } from "framer-motion";
import { Roadmap, Task, useRoadmap } from "@/hooks/useRoadmap";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useAIUsage } from "@/hooks/useAIUsage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, Clock, Circle, Send, Loader2, Star, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TaskBoardViewProps {
  roadmap: Roadmap | null;
}

const statusColumns = [
  { id: 'todo', label: 'To Do', icon: Circle },
  { id: 'in_progress', label: 'In Progress', icon: Clock },
  { id: 'done', label: 'Done', icon: Check },
] as const;

const TaskBoardView = ({ roadmap }: TaskBoardViewProps) => {
  const { updateTaskStatus } = useRoadmap();
  const { createSubmission, submissions } = useSubmissions();
  const { checkLimit, incrementUsage } = useAIUsage();
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  if (!roadmap) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">No Tasks Yet</h2>
        <p className="text-muted-foreground">Generate a roadmap first to see your tasks.</p>
      </div>
    );
  }

  // Flatten all tasks
  const allTasks = roadmap.milestones.flatMap(m => 
    m.tasks.map(t => ({ ...t, milestoneName: m.title }))
  );

  const getTasksByStatus = (status: string) => 
    allTasks.filter(t => t.status === status);

  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      await updateTaskStatus.mutateAsync({ taskId, status: newStatus });
      toast.success("Task updated!");
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const handleSubmit = async () => {
    if (!selectedTask || !submissionContent.trim()) return;

    const { canUse, remaining } = checkLimit('project_review');
    if (!canUse) {
      toast.error("You've used all 3 AI reviews for today. Try again tomorrow!");
      return;
    }

    setSubmitting(true);
    try {
      const submission = await createSubmission.mutateAsync({
        taskId: selectedTask.id,
        content: submissionContent,
        githubLink: githubLink || undefined,
      });

      // Increment usage and request review
      await incrementUsage.mutateAsync('project_review');
      
      setReviewing(true);
      const { data, error } = await supabase.functions.invoke('review-submission', {
        body: {
          submissionId: submission.id,
          taskTitle: selectedTask.title,
          content: submissionContent,
          githubLink: githubLink || null,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Mark task as done
      await handleStatusChange(selectedTask.id, 'done');

      toast.success(`Review complete! Score: ${data.review.score}/10`);
      setSelectedTask(null);
      setSubmissionContent("");
      setGithubLink("");
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
      setReviewing(false);
    }
  };

  const { remaining } = checkLimit('project_review');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Task Board</h1>
          <p className="text-muted-foreground">Manage your learning tasks</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="w-4 h-4" />
          <span>{remaining} AI reviews left today</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusColumns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <column.icon className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">{column.label}</h3>
              <span className="text-sm text-muted-foreground">
                ({getTasksByStatus(column.id).length})
              </span>
            </div>

            <div className="space-y-3">
              {getTasksByStatus(column.id).map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => column.id !== 'done' && setSelectedTask(task)}
                >
                  <h4 className="font-medium text-foreground mb-1">{task.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                  <p className="text-xs text-primary mt-2">{task.milestoneName}</p>
                  
                  {column.id !== 'done' && (
                    <div className="flex gap-2 mt-3">
                      {column.id === 'todo' && (
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task.id, 'in_progress');
                        }}>
                          Start
                        </Button>
                      )}
                      {column.id === 'in_progress' && (
                        <Button size="sm" variant="gradient" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}>
                          Submit
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submission Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit: {selectedTask?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Explanation</label>
              <Textarea
                placeholder="Describe what you learned and how you completed this task..."
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                rows={5}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">GitHub Link (optional)</label>
              <Input
                placeholder="https://github.com/..."
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>AI will review your submission and provide feedback</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>Cancel</Button>
            <Button 
              variant="gradient" 
              onClick={handleSubmit}
              disabled={!submissionContent.trim() || submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {reviewing ? "Getting Review..." : "Submit for Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskBoardView;
