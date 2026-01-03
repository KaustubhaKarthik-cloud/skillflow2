import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const handleDashboardClick = () => {
    setIsMenuOpen(false);
    if (!loading && !user) {
      navigate("/auth");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4">
        <nav className="glass-strong rounded-2xl px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SkillFlow</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection("features")} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection("how-it-works")} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How it works
              </button>
              <button 
                onClick={handleDashboardClick} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </button>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/onboarding">
                <Button variant="gradient" size="sm">Get Started</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden pt-4 border-t border-border mt-4"
              >
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => scrollToSection("features")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => scrollToSection("how-it-works")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    How it works
                  </button>
                  <button 
                    onClick={handleDashboardClick}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    Dashboard
                  </button>
                  <div className="flex gap-3 pt-2">
                    <Link to="/auth" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">Log in</Button>
                    </Link>
                    <Link to="/onboarding" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="gradient" size="sm" className="w-full">Get Started</Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </header>
  );
};

export default Header;
