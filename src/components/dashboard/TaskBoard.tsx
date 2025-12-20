import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreHorizontal, Clock, Tag, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  type: "coding" | "docs" | "setup" | "review";
  status: "todo" | "in_progress" | "review" | "done";
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Create feature branch",
    description: "Create a new branch for the user authentication feature",
    priority: "high",
    type: "setup",
    status: "todo",
  },
  {
    id: "2",
    title: "Write commit message guidelines",
    description: "Document the team's commit message conventions",
    priority: "medium",
    type: "docs",
    status: "todo",
  },
  {
    id: "3",
    title: "Implement login form",
    description: "Build the login form component with validation",
    priority: "high",
    type: "coding",
    status: "in_progress",
  },
  {
    id: "4",
    title: "Setup .gitignore",
    description: "Configure gitignore for the project",
    priority: "low",
    type: "setup",
    status: "in_progress",
  },
  {
    id: "5",
    title: "Review PR #42",
    description: "Code review for the authentication module",
    priority: "medium",
    type: "review",
    status: "review",
  },
  {
    id: "6",
    title: "Initialize repository",
    description: "Create and configure the Git repository",
    priority: "high",
    type: "setup",
    status: "done",
  },
];

const columns = [
  { id: "todo", title: "To Do", color: "bg-muted-foreground" },
  { id: "in_progress", title: "In Progress", color: "bg-primary" },
  { id: "review", title: "Review", color: "bg-warning" },
  { id: "done", title: "Done", color: "bg-success" },
];

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
};

const typeIcons = {
  coding: "💻",
  docs: "📝",
  setup: "⚙️",
  review: "🔍",
};

const TaskBoard = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: Task["status"]) => {
    if (draggedTask) {
      setTasks(tasks.map(t => 
        t.id === draggedTask.id ? { ...t, status } : t
      ));
      setDraggedTask(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Task Board</h1>
          <p className="text-muted-foreground">
            Manage your tasks using Agile workflow. Drag cards to update status.
          </p>
        </div>
        <Button variant="gradient" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Sprint info */}
      <div className="p-4 rounded-xl bg-card border border-border mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sprint 1 • Week 2</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">1 of 6 tasks completed</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-1/6 bg-gradient-primary rounded-full" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">17%</span>
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter(t => t.status === column.id);
          
          return (
            <div
              key={column.id}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id as Task["status"])}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${column.color}`} />
                <h3 className="font-medium text-foreground">{column.title}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks container */}
              <div className="flex-1 min-h-[200px] p-2 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                <AnimatePresence>
                  {columnTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className="p-4 rounded-xl bg-card border border-border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-lg">{typeIcons[task.type]}</span>
                        <button className="p-1 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="font-medium text-foreground mb-1">{task.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {task.type}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;
