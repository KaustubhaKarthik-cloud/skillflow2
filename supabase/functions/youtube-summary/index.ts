import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize YouTube URL - accept full URLs, short links, or raw video IDs
function normalizeYouTubeUrl(input: string): string {
  if (!input) return '';
  
  const trimmed = input.trim();
  
  // If it's just a video ID (11 characters, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/watch?v=${trimmed}`;
  }
  
  // Already a full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Assume it's a video ID if nothing else matches
  return `https://www.youtube.com/watch?v=${trimmed}`;
}

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let videoUrl: string | null = null;
    let language = 'english';

    // Handle both GET and POST requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      videoUrl = url.searchParams.get('url');
      language = url.searchParams.get('language') || 'english';
    } else if (req.method === 'POST') {
      const body = await req.json();
      videoUrl = body.videoUrl || body.url;
      language = body.language || 'english';
      
      // Also accept videoId and construct URL
      if (!videoUrl && body.videoId) {
        videoUrl = `https://www.youtube.com/watch?v=${body.videoId}`;
      }
    }

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter: url or videoUrl',
          hint: 'Provide a YouTube URL via query param or POST body'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize the YouTube URL
    const normalizedUrl = normalizeYouTubeUrl(videoUrl);
    const videoId = extractVideoId(normalizedUrl);

    if (!videoId) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid YouTube URL',
          provided: videoUrl,
          hint: 'Provide a valid YouTube URL, short link, or video ID'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing video: ${videoId}, URL: ${normalizedUrl}, Language: ${language}`);

    // Check cache first
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: cached } = await supabaseClient
      .from('video_summaries_cache')
      .select('summary_text')
      .eq('video_id', videoId)
      .single();

    if (cached?.summary_text) {
      console.log(`Cache hit for ${videoId}`);
      return new Response(
        JSON.stringify({ 
          success: true,
          summary: cached.summary_text, 
          language,
          source_url: normalizedUrl,
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Cache miss for ${videoId}, calling external API...`);

    // Build the API URL with proper encoding (CRITICAL)
    const encodedUrl = encodeURIComponent(normalizedUrl);
    const summaryApiUrl = `https://youtube-summarizer.apisimpacientes.workers.dev/summarize?url=${encodedUrl}&language=${encodeURIComponent(language)}`;
    
    console.log(`Calling API: ${summaryApiUrl}`);

    // Timeout protection (25 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout after 25 seconds');
      controller.abort();
    }, 25000);

    let response: Response;
    try {
      response = await fetch(summaryApiUrl, {
        method: 'GET',
        signal: controller.signal,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      const err = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
      
      if (err.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            error: 'Request timeout',
            status: 504,
            hint: 'The summarizer API took too long to respond. Try again later.',
            source_url: normalizedUrl
          }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.error('Fetch error:', err);
      return new Response(
        JSON.stringify({
          error: 'Network error',
          status: 503,
          message: err.message,
          hint: 'Failed to connect to the summarizer API.',
          source_url: normalizedUrl
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    clearTimeout(timeoutId);

    // Get response body
    const responseText = await response.text();
    let responseData: any;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log(`API response status: ${response.status}, body:`, responseData);

    // Error transparency - if API returned non-200
    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Summarizer API failed',
          status: response.status,
          statusText: response.statusText,
          body: responseData,
          hint: 'The external summarizer API returned an error.',
          source_url: normalizedUrl
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Response validation
    if (!responseData.success || !responseData.summary) {
      return new Response(
        JSON.stringify({
          error: 'Invalid API response',
          status: 422,
          body: responseData,
          hint: 'The API response was missing required fields (success/summary). This usually happens when the video has no captions.',
          source_url: normalizedUrl
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cache the successful summary
    const { error: cacheError } = await supabaseClient
      .from('video_summaries_cache')
      .upsert({
        video_id: videoId,
        summary_text: responseData.summary,
      }, { onConflict: 'video_id' });

    if (cacheError) {
      console.error('Cache write error:', cacheError);
    } else {
      console.log(`Cached summary for ${videoId}`);
    }

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true,
        summary: responseData.summary, 
        language: responseData.language || language,
        source_url: normalizedUrl,
        cached: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        status: 500,
        message,
        hint: 'An unexpected error occurred in the edge function.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
