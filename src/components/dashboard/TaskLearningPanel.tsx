import { useState } from 'react';
import { motion } from 'framer-motion';
import { TaskVideo, useTaskVideos } from '@/hooks/useTaskVideos';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Check, 
  ExternalLink, 
  Loader2, 
  Search,
  BookOpen,
  Video
} from 'lucide-react';
import { toast } from 'sonner';

interface TaskLearningPanelProps {
  taskId: string;
  taskTitle: string;
  onReadyForTesting: (summaries: string[]) => void;
}

const TaskLearningPanel = ({ taskId, taskTitle, onReadyForTesting }: TaskLearningPanelProps) => {
  const { 
    videos, 
    isLoading, 
    fetchVideos, 
    markWatched, 
    watchedCount, 
    totalCount, 
    canStartTesting 
  } = useTaskVideos(taskId);
  
  const [loadingSummaries, setLoadingSummaries] = useState(false);

  const handleFetchVideos = async () => {
    try {
      await fetchVideos.mutateAsync({ taskId, query: taskTitle });
      toast.success('Videos loaded!');
    } catch (err) {
      toast.error('Failed to fetch videos');
    }
  };

  const handleMarkWatched = async (videoId: string) => {
    try {
      await markWatched.mutateAsync(videoId);
      toast.success('Marked as watched!');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleStartTesting = async () => {
    if (!videos) return;
    
    setLoadingSummaries(true);
    try {
      const watchedVideos = videos.filter(v => v.watched);
      const summaries: string[] = [];

      for (const video of watchedVideos) {
        const { data, error } = await supabase.functions.invoke('youtube-summary', {
          body: { videoId: video.video_id, videoUrl: video.url },
        });

        if (error) {
          console.error('Summary error:', error);
          continue;
        }
        
        if (data.summary) {
          summaries.push(data.summary);
        }
      }

      if (summaries.length === 0) {
        toast.error('Could not get video summaries. Please try again.');
        return;
      }

      onReadyForTesting(summaries);
    } catch (err) {
      toast.error('Failed to prepare testing');
    } finally {
      setLoadingSummaries(false);
    }
  };

  const progressPercentage = totalCount > 0 ? (watchedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Learning Resources
          </h3>
          <p className="text-sm text-muted-foreground">
            Watch videos to learn about this topic
          </p>
        </div>
        
        {!videos?.length && (
          <Button 
            onClick={handleFetchVideos}
            disabled={fetchVideos.isPending}
          >
            {fetchVideos.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Find Videos
          </Button>
        )}
      </div>

      {videos && videos.length > 0 && (
        <>
          {/* Progress Tracker */}
          <Card className="bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Watch Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {watchedCount} / {totalCount} videos watched
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              
              <p className="text-xs text-muted-foreground mt-2">
                {canStartTesting 
                  ? '✓ You can now start testing!' 
                  : `Watch at least 2 videos to unlock testing`}
              </p>
            </CardContent>
          </Card>

          {/* Video List */}
          <div className="grid gap-3">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`transition-colors ${video.watched ? 'bg-primary/5 border-primary/20' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground line-clamp-2">
                          {video.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {video.channel}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {video.watched ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            <Check className="w-3 h-3 mr-1" />
                            Watched
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkWatched(video.id)}
                            disabled={markWatched.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Mark Watched
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(video.url, '_blank', 'noopener,noreferrer')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Start Testing Button */}
          {canStartTesting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button 
                onClick={handleStartTesting}
                disabled={loadingSummaries}
                className="w-full"
                variant="gradient"
                size="lg"
              >
                {loadingSummaries ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <BookOpen className="w-4 h-4 mr-2" />
                )}
                {loadingSummaries ? 'Preparing Test...' : 'Start Testing'}
              </Button>
            </motion.div>
          )}
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default TaskLearningPanel;
