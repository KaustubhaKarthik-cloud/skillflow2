import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, taskId } = await req.json();
    
    if (!query || !taskId) {
      throw new Error('Query and taskId are required');
    }

    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    console.log(`Searching YouTube for: ${query}`);

    // Search for videos (medium/long duration to avoid shorts)
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      videoDuration: 'medium', // 4-20 mins, good for tutorials
      maxResults: '6',
      key: YOUTUBE_API_KEY,
    });

    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams}`
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('YouTube API error:', errorText);
      throw new Error('Failed to fetch videos from YouTube');
    }

    const searchData = await searchResponse.json();
    
    const videos = searchData.items?.map((item: any) => ({
      video_id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    })) || [];

    console.log(`Found ${videos.length} videos`);

    // Save videos to database
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Insert videos (ignore duplicates)
    for (const video of videos) {
      const { error } = await supabaseClient
        .from('task_videos')
        .upsert({
          task_id: taskId,
          video_id: video.video_id,
          title: video.title,
          channel: video.channel,
          url: video.url,
        }, { onConflict: 'task_id,video_id' });

      if (error) {
        console.error('Error inserting video:', error);
      }
    }

    return new Response(JSON.stringify({ videos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in youtube-search:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
