import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Tell us about yourself",
    description: "Share your current skills, preferred tech stack, and career goals. Takes 2 minutes."
  },
  {
    number: "02",
    title: "Get your personalized roadmap",
    description: "We create a custom learning path with weekly milestones and real tasks to complete."
  },
  {
    number: "03",
    title: "Work like a real developer",
    description: "Complete tasks on your Kanban board, make commits, write docs — just like on the job."
  },
  {
    number: "04",
    title: "Get AI-powered feedback",
    description: "Receive instant reviews on your code and work. Learn from mistakes before they matter."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Start learning in <span className="text-gradient">4 simple steps</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No complex setup. No overwhelming content. Just practical learning.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/50 to-transparent hidden md:block" />
            
            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative flex gap-6 items-start"
                >
                  {/* Step number */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow z-10">
                    <span className="text-xl font-bold text-primary-foreground">{step.number}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
