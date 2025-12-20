import { Roadmap } from "@/hooks/useRoadmap";
import { useAllSubmissions } from "@/hooks/useSubmissions";
import { useAIUsage } from "@/hooks/useAIUsage";
import { CheckCircle, Clock, Target, Star, TrendingUp } from "lucide-react";

interface ProgressDashboardProps {
  roadmap: Roadmap | null;
}

const ProgressDashboard = ({ roadmap }: ProgressDashboardProps) => {
  const { submissions } = useAllSubmissions();
  const { checkLimit } = useAIUsage();

  if (!roadmap) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">No Progress Yet</h2>
        <p className="text-muted-foreground">Complete some tasks to see your progress.</p>
      </div>
    );
  }

  const allTasks = roadmap.milestones.flatMap(m => m.tasks);
  const completedTasks = allTasks.filter(t => t.status === 'done').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const totalTasks = allTasks.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  const reviewedSubmissions = submissions?.filter(s => s.review) || [];
  const averageScore = reviewedSubmissions.length > 0
    ? Math.round(reviewedSubmissions.reduce((acc, s) => acc + (s.review?.score || 0), 0) / reviewedSubmissions.length * 10) / 10
    : 0;

  const lastReview = reviewedSubmissions[0]?.review;

  const { remaining: roadmapRemaining } = checkLimit('roadmap_generation');
  const { remaining: reviewRemaining } = checkLimit('project_review');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Progress Dashboard</h1>
        <p className="text-muted-foreground">Track your learning journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <span className="text-muted-foreground">Progress</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{progressPercent}%</p>
          <p className="text-sm text-muted-foreground">{completedTasks} of {totalTasks} tasks</p>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <span className="text-muted-foreground">Completed</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{completedTasks}</p>
          <p className="text-sm text-muted-foreground">Tasks finished</p>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <span className="text-muted-foreground">In Progress</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{inProgressTasks}</p>
          <p className="text-sm text-muted-foreground">Currently working</p>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-accent" />
            </div>
            <span className="text-muted-foreground">Avg Score</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{averageScore}/10</p>
          <p className="text-sm text-muted-foreground">{reviewedSubmissions.length} reviews</p>
        </div>
      </div>

      {/* AI Usage */}
      <div className="glass rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-foreground mb-4">AI Usage Today</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Roadmap Generations</p>
            <p className="text-lg font-semibold text-foreground">{roadmapRemaining}/1 remaining</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Project Reviews</p>
            <p className="text-lg font-semibold text-foreground">{reviewRemaining}/3 remaining</p>
          </div>
        </div>
      </div>

      {/* Last Review */}
      {lastReview && (
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Latest AI Feedback
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-primary">{lastReview.score}/10</span>
            </div>
            <div>
              <p className="text-sm font-medium text-success mb-1">Strengths</p>
              <p className="text-sm text-muted-foreground">{lastReview.strengths}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-warning mb-1">Areas to Improve</p>
              <p className="text-sm text-muted-foreground">{lastReview.improvements}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary mb-1">Next Step</p>
              <p className="text-sm text-muted-foreground">{lastReview.next_action}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard;
