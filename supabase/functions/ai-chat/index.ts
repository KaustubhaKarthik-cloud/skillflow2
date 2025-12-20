import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');
    
    if (!NVIDIA_API_KEY) {
      throw new Error('NVIDIA_API_KEY is not configured');
    }

    console.log('Calling NVIDIA API with DeepSeek R1 model...');

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-r1',
        messages: [
          { 
            role: 'system', 
            content: `You are SkillFlow AI, a helpful learning assistant for software development workflows. 
You help students and fresh graduates learn industry-standard practices like Git, Agile, code reviews, and deployment.
Keep your responses clear, concise, and focused on practical learning.
When giving feedback on code or commits, be constructive and educational.` 
          },
          ...messages
        ],
        temperature: 0.6,
        top_p: 0.7,
        max_tokens: 4096,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API error:', response.status, errorText);
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('NVIDIA API response received');

    // Extract reasoning content if available (DeepSeek R1 feature)
    const reasoning = data.choices?.[0]?.message?.reasoning_content || null;
    const content = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ 
      content,
      reasoning,
      model: data.model,
      usage: data.usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
