import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoadmap } from "@/hooks/useRoadmap";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import RoadmapView from "@/components/dashboard/RoadmapView";
import TaskBoardView from "@/components/dashboard/TaskBoardView";
import ProgressDashboard from "@/components/dashboard/ProgressDashboard";
import AIChatbot from "@/components/dashboard/AIChatbot";
import { Loader2, Menu, X } from "lucide-react";

type ActiveView = "roadmap" | "tasks" | "progress";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { roadmap, isLoading: roadmapLoading } = useRoadmap();
  const [activeView, setActiveView] = useState<ActiveView>("roadmap");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

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

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!profileLoading && profile && !profile.onboarding_completed) {
      navigate("/onboarding");
    }
  }, [profile, profileLoading, navigate]);

  if (authLoading || profileLoading || roadmapLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case "roadmap":
        return <RoadmapView roadmap={roadmap} />;
      case "tasks":
        return <TaskBoardView roadmap={roadmap} />;
      case "progress":
        return <ProgressDashboard roadmap={roadmap} />;
      default:
        return <RoadmapView roadmap={roadmap} />;
    }
  };

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar border border-sidebar-border shadow-lg"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - always visible on desktop, conditional on mobile */}
      <div className={`${isMobile ? 'fixed z-40 transition-transform duration-300' : ''} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <DashboardSidebar activeView={activeView} setActiveView={handleViewChange} />
      </div>
      
      <main className={`flex-1 overflow-auto ${!isMobile ? 'ml-0' : ''}`}>
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`p-6 lg:p-8 ${isMobile ? 'pt-16' : ''}`}
        >
          {renderContent()}
        </motion.div>
      </main>

      <AIChatbot />
    </div>
  );
};

export default Dashboard;
