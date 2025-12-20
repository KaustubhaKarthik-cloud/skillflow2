import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoadmap } from "@/hooks/useRoadmap";
import { useProfile } from "@/hooks/useProfile";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import RoadmapView from "@/components/dashboard/RoadmapView";
import TaskBoardView from "@/components/dashboard/TaskBoardView";
import ProgressDashboard from "@/components/dashboard/ProgressDashboard";
import AIChatbot from "@/components/dashboard/AIChatbot";
import { Loader2 } from "lucide-react";

type ActiveView = "roadmap" | "tasks" | "progress";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { roadmap, isLoading: roadmapLoading } = useRoadmap();
  const [activeView, setActiveView] = useState<ActiveView>("roadmap");

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

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="flex-1 overflow-auto">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 lg:p-8"
        >
          {renderContent()}
        </motion.div>
      </main>

      <AIChatbot />
    </div>
  );
};

export default Dashboard;
