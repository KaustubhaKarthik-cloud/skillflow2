import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, GitBranch, Kanban, Code } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero dark">
      {/* Background effects */}
      <div className="absolute inset-0 bg-glow opacity-50" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/90">Learn by doing, not watching</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6"
          >
            Master real-world{" "}
            <span className="text-gradient">dev workflows</span>
            <br />
            before your first job
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            SkillFlow simulates real engineering workflows — Git, Agile, code reviews, deployments — so you're job-ready from day one.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link to="/onboarding">
              <Button variant="hero" size="xl" className="group">
                Start Learning Free
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="heroOutline" size="xl">
                View Demo
              </Button>
            </Link>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {[
              { icon: GitBranch, label: "Git Workflows" },
              { icon: Kanban, label: "Agile Sprints" },
              { icon: Code, label: "Code Reviews" },
            ].map((feature, index) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground/80"
              >
                <feature.icon className="w-4 h-4 text-primary" />
                {feature.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Floating cards preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="relative">
            {/* Main dashboard preview */}
            <div className="glass-strong rounded-2xl p-1 shadow-2xl">
              <div className="rounded-xl bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/80" />
                    <div className="w-3 h-3 rounded-full bg-warning/80" />
                    <div className="w-3 h-3 rounded-full bg-success/80" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono ml-4">skillflow.dev/dashboard</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Task card */}
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-xs font-medium text-muted-foreground">In Progress</span>
                    </div>
                    <h4 className="font-medium text-foreground mb-1">Setup Git Repository</h4>
                    <p className="text-xs text-muted-foreground">Initialize project with proper structure</p>
                  </div>
                  {/* Progress card */}
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground">Week 1 Progress</span>
                      <span className="text-xs font-bold text-primary">67%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-2/3 bg-gradient-primary rounded-full" />
                    </div>
                  </div>
                  {/* Commit card */}
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <GitBranch className="w-4 h-4 text-success" />
                      <span className="text-xs font-medium text-muted-foreground">Latest Commit</span>
                    </div>
                    <code className="text-xs font-mono text-foreground/80">feat: add user auth module</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
