import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are SkillFlow Planner AI. Recommend the next best tasks to maximize job readiness.

RULES:
- Suggest exactly 3 tasks from the provided roadmap_tasks.
- Must be doable next (avoid advanced if basics missing).
- Prioritize tasks that address failed concepts or weak areas.
- Explain why each is recommended.
- Keep reasons short and practical.
- Only suggest tasks that are in 'todo' or 'in_progress' status.

OUTPUT JSON ONLY:
{
  "suggestions": [
    {
      "task_id": string,
      "title": string,
      "why": string,
      "expected_impact": "high"|"medium"|"low"
    }
  ],
  "focus_areas": [string]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { target_role, roadmap_tasks, recent_results } = await req.json();

    if (!roadmap_tasks || !Array.isArray(roadmap_tasks)) {
      return new Response(
        JSON.stringify({ error: 'roadmap_tasks array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `TARGET ROLE: ${target_role || 'Not specified'}

ROADMAP TASKS:
${JSON.stringify(roadmap_tasks, null, 2)}

RECENT RESULTS:
${recent_results ? JSON.stringify(recent_results, null, 2) : 'No recent results available'}

Based on this information, suggest the 3 best next tasks to work on.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    const suggestionsResult = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(suggestionsResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ai-next-task function:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate suggestions';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
