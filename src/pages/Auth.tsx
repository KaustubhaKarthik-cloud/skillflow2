import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Zap, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import InteractiveBackground from "@/components/auth/InteractiveBackground";
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
type AuthMode = "login" | "signup" | "forgot";
const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    signIn,
    signUp,
    resetPassword,
    user,
    loading: authLoading
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "signup") return "signup";
    if (urlMode === "forgot" || urlMode === "reset") return "forgot";
    return "login";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/onboarding");
    }
  }, [user, authLoading, navigate]);
  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    if (mode !== "forgot") {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        const {
          error
        } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
          navigate("/onboarding");
        }
      } else if (mode === "signup") {
        const {
          error
        } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please login instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created successfully!");
          navigate("/onboarding");
        }
      } else if (mode === "forgot") {
        const {
          error
        } = await resetPassword(email);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Password reset email sent! Check your inbox.");
          setMode("login");
        }
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  if (authLoading) {
    return <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen bg-background dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Interactive Background */}
      <InteractiveBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo with glow */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6
      }}>
          <Link to="/" className="flex items-center gap-3 justify-center mb-10 group">
            <motion.div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg" whileHover={{
            scale: 1.1,
            rotate: 5
          }} transition={{
            type: "spring",
            stiffness: 400
          }}>
              <div className="absolute inset-0 rounded-xl bg-primary/50 blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-6 h-6 text-primary-foreground relative z-10" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              SkillFlow
            </span>
          </Link>
        </motion.div>

        {/* Card with enhanced glassmorphism */}
        <motion.div initial={{
        opacity: 0,
        y: 30,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} transition={{
        duration: 0.5,
        delay: 0.2
      }} className="relative group">
          {/* Animated border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-3xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500" />
          <motion.div className="absolute -inset-[1px] rounded-3xl opacity-50" style={{
          background: "linear-gradient(90deg, hsl(var(--primary)/0.3), hsl(var(--accent)/0.3), hsl(var(--primary)/0.3))",
          backgroundSize: "200% 100%"
        }} animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
        }} transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear"
        }} />
          
          <div className="relative backdrop-blur-xl bg-card/40 border border-border/50 rounded-3xl p-8 shadow-2xl">
            {/* Inner glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            <div className="relative z-10">
              {/* Header with animation */}
              <motion.div className="text-center mb-8" initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.4
            }}>
                
                
                <h1 className="text-3xl font-bold bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent mb-3">
                  {mode === "login" && "Sign in to SkillFlow"}
                  {mode === "signup" && "Create your account"}
                  {mode === "forgot" && "Reset your password"}
                </h1>
                <p className="text-muted-foreground/80">
                  {mode === "login" && "Continue your learning journey"}
                  {mode === "signup" && "Start your personalized learning path today"}
                  {mode === "forgot" && "We'll send you reset instructions"}
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div className="space-y-2" initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: 0.5
              }}>
                  <Label htmlFor="email" className="text-foreground/90 text-sm font-medium">Email address</Label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-focus-within/input:opacity-100 blur-xl transition-opacity" />
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors" />
                      <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40" />
                    </div>
                  </div>
                  {errors.email && <motion.p className="text-sm text-destructive flex items-center gap-1" initial={{
                  opacity: 0,
                  y: -5
                }} animate={{
                  opacity: 1,
                  y: 0
                }}>
                      {errors.email}
                    </motion.p>}
                </motion.div>

                {mode !== "forgot" && <motion.div className="space-y-2" initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: 0.6
              }}>
                    <Label htmlFor="password" className="text-foreground/90 text-sm font-medium">Password</Label>
                    <div className="relative group/input">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-focus-within/input:opacity-100 blur-xl transition-opacity" />
                      <div className="relative flex items-center">
                        <Lock className="absolute left-4 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors" />
                        <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40" />
                      </div>
                    </div>
                    {errors.password && <motion.p className="text-sm text-destructive" initial={{
                  opacity: 0,
                  y: -5
                }} animate={{
                  opacity: 1,
                  y: 0
                }}>
                        {errors.password}
                      </motion.p>}
                  </motion.div>}

                {mode === "login" && <motion.div initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                delay: 0.7
              }}>
                    <button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary/80 hover:text-primary transition-colors">
                      Forgot password?
                    </button>
                  </motion.div>}

                <motion.div initial={{
                opacity: 0,
                y: 10
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                delay: 0.8
              }}>
                  <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group/btn" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2">
                        {mode === "login" && "Sign In"}
                        {mode === "signup" && "Create Account"}
                        {mode === "forgot" && "Send Reset Email"}
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </span>}
                  </Button>
                </motion.div>
              </form>

              <motion.div className="mt-8 pt-6 border-t border-border/30 text-center" initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} transition={{
              delay: 0.9
            }}>
                {mode === "login" && <p className="text-muted-foreground/70">
                    Don't have an account?{" "}
                    <button onClick={() => setMode("signup")} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                      Sign up for free
                    </button>
                  </p>}
                {mode === "signup" && <p className="text-muted-foreground/70">
                    Already have an account?{" "}
                    <button onClick={() => setMode("login")} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                      Sign in
                    </button>
                  </p>}
                {mode === "forgot" && <p className="text-muted-foreground/70">
                    Remember your password?{" "}
                    <button onClick={() => setMode("login")} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                      Sign in
                    </button>
                  </p>}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div className="mt-8 flex items-center justify-center gap-6 text-muted-foreground/50" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 1
      }}>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-success" />
            </div>
            <span>Secure login</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <span>Free to start</span>
          </div>
        </motion.div>
      </div>
    </div>;
};
export default Auth;