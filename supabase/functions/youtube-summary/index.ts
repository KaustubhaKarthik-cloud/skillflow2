import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Always return 200 with JSON to avoid Lovable blank screen
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function extractVideoId(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;

  // If it's already a likely videoId (no URL characters, 11 chars typical)
  if (!s.includes("http") && !s.includes("/") && s.length >= 8 && s.length <= 16) {
    return s;
  }

  try {
    const u = new URL(s);

    // youtube.com/watch?v=VIDEO_ID
    const v = u.searchParams.get("v");
    if (v) return v;

    // youtu.be/VIDEO_ID
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").split("?")[0].trim();
      return id || null;
    }

    // youtube.com/shorts/VIDEO_ID
    const parts = u.pathname.split("/").filter(Boolean);
    const shortsIdx = parts.indexOf("shorts");
    if (shortsIdx >= 0 && parts[shortsIdx + 1]) {
      return parts[shortsIdx + 1].split("?")[0];
    }

    // youtube.com/embed/VIDEO_ID
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) {
      return parts[embedIdx + 1].split("?")[0];
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeToShortUrl(input: string): string | null {
  const id = extractVideoId(input);
  if (!id) return null;
  return `https://youtu.be/${id}`;
}

interface FetchResult {
  ok: boolean;
  res: Response | null;
  body: unknown;
  retryable: boolean;
  lastErr?: unknown;
}

async function fetchWithRetry(url: string, maxAttempts = 3): Promise<FetchResult> {
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      console.log(`[youtube-summary] Attempt ${attempt}/${maxAttempts}: ${url}`);

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      const text = await res.text();
      let body: unknown = null;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      console.log(`[youtube-summary] Response status: ${res.status}`);

      // Success
      if (res.ok) {
        clearTimeout(timeout);
        return { ok: true, res, body, retryable: false };
      }

      // Retryable statuses: 429 (rate limit), 5xx, 408 (timeout)
      const retryable = res.status === 429 || res.status >= 500 || res.status === 408;

      if (!retryable) {
        clearTimeout(timeout);
        return { ok: false, res, body, retryable: false };
      }

      lastErr = { res, body };
    } catch (e) {
      // Abort / network error - retryable
      console.error(`[youtube-summary] Attempt ${attempt} error:`, e);
      lastErr = e;
    } finally {
      clearTimeout(timeout);
    }

    // Backoff: 400ms, 800ms before next attempt
    if (attempt < maxAttempts) {
      const backoff = 400 * attempt;
      console.log(`[youtube-summary] Waiting ${backoff}ms before retry...`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  return { ok: false, res: null, body: null, retryable: true, lastErr };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const urlObj = new URL(req.url);

    let inputUrl = urlObj.searchParams.get("url") ?? "";
    let videoId = urlObj.searchParams.get("videoId") ?? "";
    let language = (urlObj.searchParams.get("language") ?? "english").toLowerCase().trim();

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      inputUrl = body.url ?? body.videoUrl ?? inputUrl;
      videoId = body.videoId ?? videoId;
      language = (body.language ?? language).toLowerCase().trim();
    }

    // Use videoId if inputUrl is empty
    const urlToNormalize = inputUrl || (videoId ? `https://youtu.be/${videoId}` : "");

    const normalized = normalizeToShortUrl(urlToNormalize);
    const extractedVideoId = extractVideoId(urlToNormalize);

    if (!normalized || !extractedVideoId) {
      console.error("[youtube-summary] Invalid input:", { inputUrl, videoId });
      return jsonResponse({
        success: false,
        error: "Invalid YouTube URL or videoId.",
        hint: "Please provide a valid YouTube video URL or ID.",
      });
    }

    console.log(`[youtube-summary] Normalized URL: ${normalized}, videoId: ${extractedVideoId}`);

    // Check cache first
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: cached } = await supabaseClient
      .from("video_summaries_cache")
      .select("summary_text")
      .eq("video_id", extractedVideoId)
      .single();

    if (cached?.summary_text) {
      console.log(`[youtube-summary] Cache hit for ${extractedVideoId}`);
      return jsonResponse({
        success: true,
        summary: cached.summary_text,
        language,
        source_url: normalized,
        cached: true,
      });
    }

    console.log(`[youtube-summary] Cache miss, calling external API...`);

    const base = "https://youtube-summarizer.apisimpacientes.workers.dev/summarize";
    const target = `${base}?url=${encodeURIComponent(normalized)}&language=${encodeURIComponent(language)}`;

    console.log(`[youtube-summary] Calling: ${target}`);

    const result = await fetchWithRetry(target, 3);

    // IMPORTANT: Always return 200 to avoid Lovable blank screen
    if (!result.ok) {
      // If we got an HTTP response from the external API
      if (result.res) {
        console.error("[youtube-summary] External API failed:", {
          status: result.res.status,
          body: result.body,
        });
        return jsonResponse({
          success: false,
          error: "Summarizer API failed",
          upstream_status: result.res.status,
          upstream_statusText: result.res.statusText,
          body: result.body,
          hint: "This usually happens if captions/subtitles are unavailable OR the summarizer service is overloaded. Try another video or try again.",
          source_url: normalized,
          retryable: result.retryable,
        });
      }

      // Network/timeout error
      console.error("[youtube-summary] Network/timeout error:", result.lastErr);
      return jsonResponse({
        success: false,
        error: "Request timeout or network failure",
        hint: "The summarizer API took too long or failed after 3 retries. Try again later.",
        source_url: normalized,
        retryable: true,
      });
    }

    const data = result.body as Record<string, unknown>;
    if (!data?.success || !data?.summary) {
      console.error("[youtube-summary] No summary in response:", data);
      return jsonResponse({
        success: false,
        error: "No summary returned",
        body: data,
        hint: "Video may not have usable subtitles/captions for summarization.",
        source_url: normalized,
      });
    }

    // Cache the successful summary
    const { error: cacheError } = await supabaseClient
      .from("video_summaries_cache")
      .upsert(
        {
          video_id: extractedVideoId,
          summary_text: data.summary as string,
        },
        { onConflict: "video_id" }
      );

    if (cacheError) {
      console.error("[youtube-summary] Cache write error:", cacheError);
    } else {
      console.log(`[youtube-summary] Cached summary for ${extractedVideoId}`);
    }

    console.log("[youtube-summary] Successfully got summary");
    return jsonResponse({
      success: true,
      language: data.language ?? language,
      summary: data.summary,
      source_url: normalized,
      cached: false,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[youtube-summary] Unhandled error:", msg);
    // Return 200 to avoid app crash; include details
    return jsonResponse({
      success: false,
      error: "Edge function error",
      details: msg,
      hint: "Check logs and try a different video with captions.",
    });
  }
});
