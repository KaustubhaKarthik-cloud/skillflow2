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
    const { videoId, videoUrl } = await req.json();
    
    if (!videoId || !videoUrl) {
      throw new Error('videoId and videoUrl are required');
    }

    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Check cache first
    const { data: cached } = await supabaseClient
      .from('video_summaries_cache')
      .select('summary_text')
      .eq('video_id', videoId)
      .single();

    if (cached?.summary_text) {
      console.log(`Using cached summary for ${videoId}`);
      return new Response(JSON.stringify({ summary: cached.summary_text, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching summary for video: ${videoId}`);

    // Fetch transcript summary
    const summaryUrl = `https://youtube-summarizer.apisimpacientes.workers.dev/summarize?url=${encodeURIComponent(videoUrl)}&language=english`;
    
    const response = await fetch(summaryUrl);
    
    if (!response.ok) {
      console.error('Summary API error:', await response.text());
      throw new Error('Failed to fetch video summary');
    }

    const data = await response.json();
    
    if (!data.success || !data.summary) {
      throw new Error('No summary available for this video');
    }

    // Cache the summary
    const { error: cacheError } = await supabaseClient
      .from('video_summaries_cache')
      .upsert({
        video_id: videoId,
        summary_text: data.summary,
      }, { onConflict: 'video_id' });

    if (cacheError) {
      console.error('Error caching summary:', cacheError);
    }

    return new Response(JSON.stringify({ summary: data.summary, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in youtube-summary:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
