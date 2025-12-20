import { motion } from "framer-motion";
import { Roadmap } from "@/hooks/useRoadmap";
import { Check, Clock, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoadmapViewProps {
  roadmap: Roadmap | null;
}

const RoadmapView = ({ roadmap }: RoadmapViewProps) => {
  if (!roadmap) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">No Roadmap Yet</h2>
        <p className="text-muted-foreground">Complete onboarding to generate your personalized roadmap.</p>
      </div>
    );
  }

  const getMilestoneStatus = (index: number) => {
    const milestone = roadmap.milestones[index];
    const allDone = milestone.tasks.every(t => t.status === 'done');
    const anyInProgress = milestone.tasks.some(t => t.status === 'in_progress' || t.status === 'done');
    
    if (allDone) return 'completed';
    if (anyInProgress) return 'current';
    
    // Check if previous milestones are done
    if (index > 0) {
      const prevMilestone = roadmap.milestones[index - 1];
      const prevAllDone = prevMilestone.tasks.every(t => t.status === 'done');
      if (!prevAllDone) return 'locked';
    }
    
    return index === 0 ? 'current' : 'locked';
  };

  const getProgress = (milestone: typeof roadmap.milestones[0]) => {
    const done = milestone.tasks.filter(t => t.status === 'done').length;
    return Math.round((done / milestone.tasks.length) * 100);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{roadmap.title}</h1>
        <p className="text-muted-foreground">{roadmap.description}</p>
      </div>

      <div className="space-y-6">
        {roadmap.milestones.map((milestone, index) => {
          const status = getMilestoneStatus(index);
          const progress = getProgress(milestone);

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass rounded-xl p-6 ${status === 'locked' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  status === 'completed' ? 'bg-success' :
                  status === 'current' ? 'bg-primary' :
                  'bg-muted'
                }`}>
                  {status === 'completed' ? <Check className="w-5 h-5 text-success-foreground" /> :
                   status === 'locked' ? <Lock className="w-5 h-5 text-muted-foreground" /> :
                   <Clock className="w-5 h-5 text-primary-foreground" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Week {index + 1}: {milestone.title}
                    </h3>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4">{milestone.description}</p>

                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-gradient-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Tasks preview */}
                  <div className="space-y-2">
                    {milestone.tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span className={task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}>
                          {task.title}
                        </span>
                        {task.status === 'done' && <Check className="w-4 h-4 text-success" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapView;
