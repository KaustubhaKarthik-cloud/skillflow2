import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, GitCommit, Check, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAIChat } from "@/hooks/useAIChat";

interface Commit {
  id: string;
  message: string;
  branch: string;
  timestamp: string;
  status: "valid" | "needs_improvement" | "pending";
  feedback?: string;
}

const sampleCommits: Commit[] = [
  {
    id: "1",
    message: "feat: add user authentication module",
    branch: "feature/auth",
    timestamp: "2 hours ago",
    status: "valid",
  },
  {
    id: "2",
    message: "fix login button not working",
    branch: "feature/auth",
    timestamp: "1 hour ago",
    status: "needs_improvement",
    feedback: "Commit message should follow conventional commits format. Use 'fix: login button not responding to clicks'",
  },
  {
    id: "3",
    message: "docs: update README with setup instructions",
    branch: "main",
    timestamp: "30 mins ago",
    status: "valid",
  },
];

const branches = [
  { name: "main", type: "default", commits: 24 },
  { name: "feature/auth", type: "feature", commits: 8 },
  { name: "feature/dashboard", type: "feature", commits: 3 },
];

const GitSimulator = () => {
  const [commits, setCommits] = useState<Commit[]>(sampleCommits);
  const [commitMessage, setCommitMessage] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("feature/auth");
  const { sendMessage, isLoading } = useAIChat();

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast.error("Please enter a commit message");
      return;
    }

    const conventionalCommitPattern = /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+$/;
    const isValidFormat = conventionalCommitPattern.test(commitMessage);

    const newCommitId = Date.now().toString();
    const newCommit: Commit = {
      id: newCommitId,
      message: commitMessage,
      branch: selectedBranch,
      timestamp: "Just now",
      status: "pending",
    };

    setCommits([newCommit, ...commits]);
    setCommitMessage("");
    toast.info("Analyzing commit with AI...");

    // Get AI feedback
    const response = await sendMessage([
      {
        role: "user",
        content: `Review this git commit message and provide brief, constructive feedback (2-3 sentences max):
        
Commit: "${commitMessage}"
Branch: ${selectedBranch}

Evaluate:
1. Does it follow conventional commits format? (type: description or type(scope): description)
2. Is the description clear and meaningful?
3. Any quick improvements?

Start with "✅ Good:" if it follows best practices, or "💡 Improve:" if it needs work.`
      }
    ]);

    setCommits(prev => prev.map(c => {
      if (c.id === newCommitId) {
        if (response) {
          const isGood = response.content.startsWith("✅") || isValidFormat;
          return {
            ...c,
            status: isGood ? "valid" : "needs_improvement",
            feedback: response.content
          };
        } else {
          return {
            ...c,
            status: isValidFormat ? "valid" : "needs_improvement",
            feedback: isValidFormat 
              ? "Follows conventional commits format!" 
              : "Follow conventional commits: type(scope): description"
          };
        }
      }
      return c;
    }));

    if (isValidFormat) {
      toast.success("Commit analyzed!");
    } else {
      toast.warning("AI feedback added to your commit.");
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Git Workflow Simulator</h1>
        <p className="text-muted-foreground">
          Practice Git workflows and learn proper commit message conventions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branches panel */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              Branches
            </h3>
            <div className="space-y-2">
              {branches.map((branch) => (
                <button
                  key={branch.name}
                  onClick={() => setSelectedBranch(branch.name)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedBranch === branch.name
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary hover:bg-secondary/80 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        branch.type === "default" ? "bg-success" : "bg-primary"
                      }`} />
                      <span className="text-sm font-medium text-foreground font-mono">
                        {branch.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{branch.commits}</span>
                  </div>
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
              <GitBranch className="w-4 h-4" />
              New Branch
            </Button>
          </div>
        </div>

        {/* Commit area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Commit input */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-primary" />
              Make a Commit
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>On branch:</span>
                <code className="px-2 py-0.5 rounded bg-secondary font-mono text-foreground">
                  {selectedBranch}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Commit Message
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCommit()}
                  placeholder="feat(scope): describe your changes"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Use conventional commits: feat | fix | docs | style | refactor | test | chore
                </p>
              </div>

              <Button variant="gradient" onClick={handleCommit} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Commit with AI Review
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Commit history */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4">Commit History</h3>
            
            <div className="space-y-3">
              {commits.map((commit, index) => (
                <motion.div
                  key={commit.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-lg border ${
                    commit.status === "pending"
                      ? "bg-secondary border-border"
                      : commit.status === "valid"
                      ? "bg-success/5 border-success/30"
                      : "bg-warning/5 border-warning/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      commit.status === "pending" 
                        ? "bg-muted" 
                        : commit.status === "valid" 
                        ? "bg-success" 
                        : "bg-warning"
                    }`}>
                      {commit.status === "pending" ? (
                        <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                      ) : commit.status === "valid" ? (
                        <Check className="w-3 h-3 text-success-foreground" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-warning-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono text-foreground break-all">
                        {commit.message}
                      </code>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="font-mono">{commit.branch}</span>
                        <span>•</span>
                        <span>{commit.timestamp}</span>
                      </div>
                      {commit.feedback && (
                        <p className="mt-2 text-sm text-warning p-2 rounded bg-warning/10">
                          💡 {commit.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitSimulator;
