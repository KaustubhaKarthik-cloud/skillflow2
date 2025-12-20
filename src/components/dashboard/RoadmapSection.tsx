import { motion } from "framer-motion";
import { Check, Lock, ArrowRight, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const milestones = [
  {
    week: 1,
    title: "Development Environment Setup",
    description: "Set up your local development environment and understand basic tooling.",
    status: "completed",
    tasks: ["Install VS Code & extensions", "Setup Git & GitHub account", "Create first repository"],
    progress: 100,
  },
  {
    week: 2,
    title: "Git Fundamentals",
    description: "Master essential Git commands and workflows used in real teams.",
    status: "current",
    tasks: ["Learn branching strategies", "Practice commit messages", "Understand pull requests"],
    progress: 45,
  },
  {
    week: 3,
    title: "Agile & Task Management",
    description: "Learn how real development teams organize and track work.",
    status: "locked",
    tasks: ["Understand sprints", "Use Kanban boards", "Write user stories"],
    progress: 0,
  },
  {
    week: 4,
    title: "Code Review Practices",
    description: "Learn to give and receive constructive code feedback.",
    status: "locked",
    tasks: ["Review best practices", "Write review comments", "Address feedback"],
    progress: 0,
  },
  {
    week: 5,
    title: "Documentation & Deployment",
    description: "Create professional documentation and understand deployment basics.",
    status: "locked",
    tasks: ["Write README files", "API documentation", "Deployment simulation"],
    progress: 0,
  },
];

const RoadmapSection = () => {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Your Learning Roadmap</h1>
        <p className="text-muted-foreground">
          Follow this personalized path to become job-ready. Complete each milestone to unlock the next.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">1</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">Week 2</div>
              <div className="text-sm text-muted-foreground">Current</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">4 weeks</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <motion.div
            key={milestone.week}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`p-6 rounded-2xl border transition-all duration-300 ${
              milestone.status === "completed"
                ? "bg-success/5 border-success/30"
                : milestone.status === "current"
                  ? "bg-primary/5 border-primary/30 shadow-lg"
                  : "bg-card border-border opacity-60"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Status indicator */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                milestone.status === "completed"
                  ? "bg-success text-success-foreground"
                  : milestone.status === "current"
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}>
                {milestone.status === "completed" ? (
                  <Check className="w-6 h-6" />
                ) : milestone.status === "locked" ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <span className="text-lg font-bold">{milestone.week}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Week {milestone.week}
                  </span>
                  {milestone.status === "current" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      In Progress
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{milestone.title}</h3>
                <p className="text-muted-foreground mb-4">{milestone.description}</p>

                {/* Tasks preview */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {milestone.tasks.map((task) => (
                    <span key={task} className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                      {task}
                    </span>
                  ))}
                </div>

                {/* Progress bar */}
                {milestone.status !== "locked" && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          milestone.status === "completed" ? "bg-success" : "bg-gradient-primary"
                        }`}
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{milestone.progress}%</span>
                  </div>
                )}

                {/* Action button for current milestone */}
                {milestone.status === "current" && (
                  <Button variant="gradient" size="sm" className="mt-4 gap-2">
                    Continue Learning
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapSection;
