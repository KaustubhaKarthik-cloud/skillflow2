import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import RoadmapSection from "@/components/dashboard/RoadmapSection";
import TaskBoard from "@/components/dashboard/TaskBoard";
import GitSimulator from "@/components/dashboard/GitSimulator";
import ProgressStats from "@/components/dashboard/ProgressStats";
import AIChatbot from "@/components/dashboard/AIChatbot";

type ActiveView = "roadmap" | "tasks" | "git" | "progress";

const Dashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>("roadmap");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case "roadmap":
        return <RoadmapSection />;
      case "tasks":
        return <TaskBoard />;
      case "git":
        return <GitSimulator />;
      case "progress":
        return <ProgressStats />;
      default:
        return <RoadmapSection />;
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