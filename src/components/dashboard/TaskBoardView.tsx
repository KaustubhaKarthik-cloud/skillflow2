import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Roadmap, Task, useRoadmap } from "@/hooks/useRoadmap";
import { useAIUsage } from "@/hooks/useAIUsage";
import { useTestingFlow } from "@/hooks/useTestingFlow";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Clock, Circle, Star, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import TaskLearningPanel from "./TaskLearningPanel";
import TaskTestingPanel from "./TaskTestingPanel";

interface TaskBoardViewProps {
  roadmap: Roadmap | null;
}

const statusColumns = [
  { id: 'todo', label: 'To Do', icon: Circle },
  { id: 'in_progress', label: 'In Progress', icon: Clock },
  { id: 'testing', label: 'Testing', icon: FlaskConical },
  { id: 'done', label: 'Done', icon: Check },
] as const;

type TaskStatus = 'todo' | 'in_progress' | 'testing' | 'done';

const TaskBoardView = ({ roadmap }: TaskBoardViewProps) => {
  const { updateTaskStatus } = useRoadmap();
  const { checkLimit } = useAIUsage();
  
  const [selectedTask, setSelectedTask] = useState<(Task & { milestoneName: string }) | null>(null);
  const [dialogMode, setDialogMode] = useState<'learning' | 'testing'>('learning');
  const [videoSummaries, setVideoSummaries] = useState<string[]>([]);
  
  // Use testing flow to get stored summaries
  const { storedSummaries } = useTestingFlow(selectedTask?.id || null);
  
  // Update videoSummaries when stored summaries are loaded
  useEffect(() => {
    if (storedSummaries && storedSummaries.length > 0 && videoSummaries.length === 0) {
      setVideoSummaries(storedSummaries);
    }
  }, [storedSummaries, videoSummaries.length]);

  if (!roadmap) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">No Tasks Yet</h2>
        <p className="text-muted-foreground">Generate a roadmap first to see your tasks.</p>
      </div>
    );
  }

  const allTasks = roadmap.milestones.flatMap(m => 
    m.tasks.map(t => ({ ...t, milestoneName: m.title }))
  );

  const getTasksByStatus = (status: string) => 
    allTasks.filter(t => t.status === status);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus.mutateAsync({ taskId, status: newStatus });
      toast.success("Task updated!");
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const handleTaskClick = (task: Task & { milestoneName: string }) => {
    if (task.status === 'done') return;
    setSelectedTask(task);
    // For testing status, check if we have stored summaries, otherwise show learning
    if (task.status === 'testing') {
      setDialogMode('testing');
    } else {
      setDialogMode('learning');
    }
    setVideoSummaries([]);
  };

  const handleReadyForTesting = (summaries: string[]) => {
    setVideoSummaries(summaries);
    setDialogMode('testing');
    if (selectedTask) {
      handleStatusChange(selectedTask.id, 'testing');
    }
  };

  const handleTestingComplete = async (passed: boolean) => {
    if (selectedTask) {
      await handleStatusChange(selectedTask.id, passed ? 'done' : 'testing');
    }
    setSelectedTask(null);
    setVideoSummaries([]);
  };

  const { remaining } = checkLimit('project_review');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Task Board</h1>
          <p className="text-muted-foreground">Learn by watching, then prove your understanding</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="w-4 h-4" />
          <span>{remaining} AI reviews left today</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statusColumns.map((column) => (
          <div key={column.id} className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <column.icon className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">{column.label}</h3>
              <span className="text-sm text-muted-foreground">
                ({getTasksByStatus(column.id).length})
              </span>
            </div>

            <div className="space-y-2 min-h-[200px]">
              {getTasksByStatus(column.id).map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleTaskClick(task)}
                >
                  <h4 className="font-medium text-foreground text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  <p className="text-xs text-primary mt-2">{task.milestoneName}</p>
                  
                  {column.id === 'todo' && (
                    <Button size="sm" variant="outline" className="mt-2 w-full" onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(task.id, 'in_progress');
                    }}>
                      Start Learning
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedTask && dialogMode === 'learning' && (
            <TaskLearningPanel
              taskId={selectedTask.id}
              taskTitle={selectedTask.title}
              onReadyForTesting={handleReadyForTesting}
            />
          )}

          {selectedTask && dialogMode === 'testing' && (
            <TaskTestingPanel
              taskId={selectedTask.id}
              taskTitle={selectedTask.title}
              videoSummaries={videoSummaries.length > 0 ? videoSummaries : storedSummaries}
              onComplete={handleTestingComplete}
              onBack={() => setDialogMode('learning')}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskBoardView;
