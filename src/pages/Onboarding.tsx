import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check, Code, Database, Globe, Smartphone, Brain, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

type SkillLevel = "beginner" | "intermediate" | "advanced";
type TechStack = "frontend" | "backend" | "fullstack" | "mobile" | "data";
type CareerGoal = "sde" | "frontend" | "backend" | "fullstack" | "devops";

const techStackOptions = [
  { id: "frontend", label: "Frontend", icon: Globe, description: "React, Vue, HTML/CSS" },
  { id: "backend", label: "Backend", icon: Database, description: "Node, Python, Java" },
  { id: "fullstack", label: "Full Stack", icon: Code, description: "End-to-end development" },
  { id: "mobile", label: "Mobile", icon: Smartphone, description: "React Native, Flutter" },
  { id: "data", label: "Data/ML", icon: Brain, description: "Python, TensorFlow, SQL" },
];

const careerGoalOptions = [
  { id: "sde", label: "Software Developer", description: "General SDE role" },
  { id: "frontend", label: "Frontend Engineer", description: "UI/UX focused development" },
  { id: "backend", label: "Backend Engineer", description: "APIs and infrastructure" },
  { id: "fullstack", label: "Full Stack Developer", description: "End-to-end ownership" },
  { id: "devops", label: "DevOps Engineer", description: "CI/CD and cloud" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [techStack, setTechStack] = useState<TechStack | null>(null);
  const [careerGoal, setCareerGoal] = useState<CareerGoal | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const canProceed = () => {
    if (step === 1) return skillLevel !== null;
    if (step === 2) return techStack !== null;
    if (step === 3) return careerGoal !== null;
    return false;
  };

  const handleComplete = () => {
    // Store preferences and navigate to dashboard
    localStorage.setItem("skillflow_onboarding", JSON.stringify({
      skillLevel,
      techStack,
      careerGoal,
      completed: true
    }));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-hero dark flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-glow opacity-30" />
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">SkillFlow</span>
        </Link>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step 
                  ? "w-8 bg-gradient-primary" 
                  : s < step 
                    ? "w-8 bg-primary/50" 
                    : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Skill Level */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">What's your current skill level?</h2>
                <p className="text-muted-foreground mb-8">This helps us create the right starting point for you.</p>

                <div className="space-y-3">
                  {[
                    { id: "beginner", label: "Beginner", description: "Just starting out with programming" },
                    { id: "intermediate", label: "Intermediate", description: "Know the basics, building projects" },
                    { id: "advanced", label: "Advanced", description: "Comfortable with complex problems" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSkillLevel(option.id as SkillLevel)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        skillLevel === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                        {skillLevel === option.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Tech Stack */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">What's your preferred tech stack?</h2>
                <p className="text-muted-foreground mb-8">Choose the area you want to focus on.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {techStackOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTechStack(option.id as TechStack)}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        techStack === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          techStack === option.id ? "bg-primary" : "bg-secondary"
                        }`}>
                          <option.icon className={`w-5 h-5 ${
                            techStack === option.id ? "text-primary-foreground" : "text-foreground"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Career Goal */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">What's your career goal?</h2>
                <p className="text-muted-foreground mb-8">We'll tailor your roadmap to help you get there.</p>

                <div className="space-y-3">
                  {careerGoalOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setCareerGoal(option.id as CareerGoal)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        careerGoal === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                        {careerGoal === option.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {step < 3 ? (
              <Button
                variant="gradient"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={handleComplete}
                disabled={!canProceed()}
                className="gap-2"
              >
                Create My Roadmap
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
