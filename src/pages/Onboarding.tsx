import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check, Code, Database, Globe, Zap, Loader2, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, BranchType, SkillLevel, TargetRole } from "@/hooks/useProfile";
import { useAIUsage } from "@/hooks/useAIUsage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const branchOptions = [
  { id: "CSE", label: "Computer Science", description: "CS fundamentals & algorithms" },
  { id: "IT", label: "Information Technology", description: "Systems & networking focus" },
  { id: "ECE", label: "Electronics & Communication", description: "Hardware & embedded systems" },
];

const skillLevelOptions = [
  { id: "Beginner", label: "Beginner", description: "Just starting out with programming" },
  { id: "Intermediate", label: "Intermediate", description: "Know the basics, building projects" },
  { id: "Advanced", label: "Advanced", description: "Comfortable with complex problems" },
];

const targetRoleOptionsByBranch: Record<BranchType, { id: string; label: string; icon: typeof Globe; description: string }[]> = {
  CSE: [
    { id: "Frontend", label: "Frontend Developer", icon: Globe, description: "React, Vue, HTML/CSS" },
    { id: "Backend", label: "Backend Developer", icon: Database, description: "Node, Python, APIs" },
    { id: "Full Stack", label: "Full Stack Developer", icon: Code, description: "End-to-end development" },
  ],
  IT: [
    { id: "Frontend", label: "IT Systems Administrator", icon: Database, description: "Networks, servers, infrastructure" },
    { id: "Backend", label: "Cloud Engineer", icon: Globe, description: "AWS, Azure, DevOps" },
    { id: "Full Stack", label: "IT Support Specialist", icon: Code, description: "Technical support & troubleshooting" },
  ],
  ECE: [
    { id: "Frontend", label: "Embedded Systems Developer", icon: Code, description: "Microcontrollers, firmware" },
    { id: "Backend", label: "IoT Engineer", icon: Globe, description: "Connected devices, sensors" },
    { id: "Full Stack", label: "Hardware Design Engineer", icon: Database, description: "Circuit design, PCB layout" },
  ],
};

const weeklyHoursOptions = [5, 10, 15, 20, 25, 30];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();
  const { checkLimit, incrementUsage } = useAIUsage();
  
  const [step, setStep] = useState(1);
  const [branch, setBranch] = useState<BranchType | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [targetRole, setTargetRole] = useState<TargetRole | null>(null);
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // If onboarding completed, go to dashboard
  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigate("/dashboard");
    }
  }, [profile, navigate]);

  // Pre-fill form if profile exists
  useEffect(() => {
    if (profile) {
      if (profile.branch) setBranch(profile.branch);
      if (profile.skill_level) setSkillLevel(profile.skill_level);
      if (profile.target_role) setTargetRole(profile.target_role);
      if (profile.weekly_hours) setWeeklyHours(profile.weekly_hours);
    }
  }, [profile]);

  const canProceed = () => {
    if (step === 1) return branch !== null;
    if (step === 2) return skillLevel !== null;
    if (step === 3) return targetRole !== null;
    if (step === 4) return weeklyHours > 0;
    return false;
  };

  const handleComplete = async () => {
    if (!branch || !skillLevel || !targetRole) return;

    // Check AI usage limit
    const { canUse } = checkLimit('roadmap_generation');
    if (!canUse) {
      toast.error("You've reached your daily limit for roadmap generation. Try again tomorrow!");
      return;
    }

    setGenerating(true);

    try {
      // Update profile
      await updateProfile.mutateAsync({
        branch,
        skill_level: skillLevel,
        target_role: targetRole,
        weekly_hours: weeklyHours,
        onboarding_completed: true,
      });

      // Increment usage
      await incrementUsage.mutateAsync('roadmap_generation');

      // Generate roadmap
      const { data, error } = await supabase.functions.invoke('generate-roadmap', {
        body: {
          branch,
          skillLevel,
          targetRole,
          weeklyHours,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`Roadmap "${data.title}" created!`);
      navigate("/dashboard");
    } catch (err) {
      console.error('Error creating roadmap:', err);
      toast.error(err instanceof Error ? err.message : "Failed to create roadmap");
      setGenerating(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          {[1, 2, 3, 4].map((s) => (
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
            {/* Step 1: Branch */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">What's your branch?</h2>
                <p className="text-muted-foreground mb-8">This helps us understand your background.</p>

                <div className="space-y-3">
                  {branchOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setBranch(option.id as BranchType)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        branch === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                        {branch === option.id && (
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

            {/* Step 2: Skill Level */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">What's your skill level?</h2>
                <p className="text-muted-foreground mb-8">We'll tailor the difficulty accordingly.</p>

                <div className="space-y-3">
                  {skillLevelOptions.map((option) => (
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

            {/* Step 3: Target Role */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">What role do you want?</h2>
                <p className="text-muted-foreground mb-8">Choose your target career path.</p>

                <div className="space-y-3">
                  {(branch ? targetRoleOptionsByBranch[branch] : []).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTargetRole(option.id as TargetRole)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        targetRole === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          targetRole === option.id ? "bg-primary" : "bg-secondary"
                        }`}>
                          <option.icon className={`w-5 h-5 ${
                            targetRole === option.id ? "text-primary-foreground" : "text-foreground"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                        {targetRole === option.id && (
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

            {/* Step 4: Weekly Hours */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">How many hours per week?</h2>
                <p className="text-muted-foreground mb-8">We'll size tasks based on your availability.</p>

                <div className="grid grid-cols-3 gap-3">
                  {weeklyHoursOptions.map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setWeeklyHours(hours)}
                      className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                        weeklyHours === hours
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Clock className={`w-5 h-5 ${weeklyHours === hours ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-bold text-xl text-foreground">{hours}</span>
                        <span className="text-xs text-muted-foreground">hours</span>
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
              disabled={step === 1 || generating}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {step < 4 ? (
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
                disabled={!canProceed() || generating}
                className="gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Roadmap...
                  </>
                ) : (
                  <>
                    Create My Roadmap
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
