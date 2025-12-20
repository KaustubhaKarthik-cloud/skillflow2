import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Clock, 
  GitCommit,
  FileText,
  Award,
  Zap
} from "lucide-react";

const skillProgress = [
  { name: "Git Fundamentals", progress: 75, level: "Intermediate" },
  { name: "Agile Workflow", progress: 45, level: "Learning" },
  { name: "Code Review", progress: 20, level: "Beginner" },
  { name: "Documentation", progress: 60, level: "Intermediate" },
  { name: "Deployment", progress: 10, level: "Not Started" },
];

const recentActivity = [
  { icon: GitCommit, text: "Made 3 commits with proper format", time: "2 hours ago", type: "success" },
  { icon: CheckCircle2, text: "Completed 'Setup Git Repository' task", time: "Yesterday", type: "success" },
  { icon: FileText, text: "Wrote README documentation", time: "2 days ago", type: "success" },
  { icon: Clock, text: "Started Week 2 milestone", time: "3 days ago", type: "info" },
];

const achievements = [
  { icon: "🚀", title: "First Commit", description: "Made your first properly formatted commit" },
  { icon: "📚", title: "Documentation Pro", description: "Completed documentation task" },
  { icon: "🔥", title: "3-Day Streak", description: "Practiced for 3 consecutive days" },
];

const ProgressStats = () => {
  const overallProgress = Math.round(
    skillProgress.reduce((acc, skill) => acc + skill.progress, 0) / skillProgress.length
  );

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your journey from beginner to job-ready developer.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-5 rounded-2xl bg-gradient-primary text-primary-foreground"
        >
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{overallProgress}%</span>
          </div>
          <div className="text-sm opacity-90">Overall Readiness</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-5 rounded-2xl bg-card border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-primary" />
            <span className="text-3xl font-bold text-foreground">2</span>
          </div>
          <div className="text-sm text-muted-foreground">Current Week</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-5 rounded-2xl bg-card border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <span className="text-3xl font-bold text-foreground">7</span>
          </div>
          <div className="text-sm text-muted-foreground">Tasks Completed</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="p-5 rounded-2xl bg-card border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <GitCommit className="w-8 h-8 text-accent" />
            <span className="text-3xl font-bold text-foreground">12</span>
          </div>
          <div className="text-sm text-muted-foreground">Commits Made</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="p-6 rounded-2xl bg-card border border-border"
        >
          <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Skill Progress
          </h3>

          <div className="space-y-5">
            {skillProgress.map((skill, index) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{skill.name}</span>
                  <span className="text-xs text-muted-foreground">{skill.level}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                    className={`h-full rounded-full ${
                      skill.progress >= 70 
                        ? "bg-success" 
                        : skill.progress >= 40 
                          ? "bg-gradient-primary" 
                          : "bg-muted-foreground/50"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="p-6 rounded-2xl bg-card border border-border"
        >
          <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>

          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  activity.type === "success" ? "bg-success/10" : "bg-primary/10"
                }`}>
                  <activity.icon className={`w-4 h-4 ${
                    activity.type === "success" ? "text-success" : "text-primary"
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{activity.text}</p>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="mt-6 p-6 rounded-2xl bg-card border border-border"
      >
        <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Achievements
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-secondary/50 border border-border/50 text-center"
            >
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <h4 className="font-medium text-foreground mb-1">{achievement.title}</h4>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProgressStats;
