import { motion } from "framer-motion";
import { 
  Route, 
  Kanban, 
  GitCommit, 
  Bot, 
  FileText, 
  TrendingUp,
  CheckCircle2
} from "lucide-react";

const features = [
  {
    icon: Route,
    title: "Personalized Roadmap",
    description: "Get a custom learning path based on your skills, tech stack, and career goals. Dynamic adjustments as you progress.",
    highlights: ["Skill assessment", "Weekly milestones", "Adaptive learning"]
  },
  {
    icon: Kanban,
    title: "Project Task Board",
    description: "Work with a real Kanban board mimicking Agile sprints. Move tasks from To Do → In Progress → Review → Done.",
    highlights: ["Agile workflow", "Sprint planning", "Ticket management"]
  },
  {
    icon: GitCommit,
    title: "Simulated Git Workflow",
    description: "Practice commits, branches, and version control without the complexity. Learn the patterns companies expect.",
    highlights: ["Commit messages", "Branch strategy", "Code history"]
  },
  {
    icon: Bot,
    title: "AI Feedback & Review",
    description: "Get instant feedback on code quality, task completion, and documentation. Like having a senior dev review your work.",
    highlights: ["Code quality", "Best practices", "Actionable tips"]
  },
  {
    icon: FileText,
    title: "Documentation Practice",
    description: "Learn to write READMEs, setup docs, and deployment guides. Essential skills every dev needs.",
    highlights: ["README writing", "API docs", "Setup guides"]
  },
  {
    icon: TrendingUp,
    title: "Progress Dashboard",
    description: "Track your journey from beginner to job-ready. Visual metrics show exactly where you stand.",
    highlights: ["Skill tracking", "Readiness score", "Achievement badges"]
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to be{" "}
            <span className="text-gradient">job-ready</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real workflows, real skills. Not another video course.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground mb-4">
                {feature.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {feature.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                  >
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    {highlight}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
