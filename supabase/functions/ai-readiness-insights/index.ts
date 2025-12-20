import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are SkillFlow Insights AI. Explain the readiness score simply and give focused improvement actions.

RULES:
- Keep it human, short, and actionable.
- Provide exactly 3 improvements only.
- No fluff or generic advice.
- Be encouraging but realistic.
- Focus on practical next steps.

OUTPUT JSON ONLY:
{
  "summary": string,
  "top_risks": [string],
  "top_actions": [string]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { readiness_score, weakest_skills, recent_metrics, target_role } = await req.json();

    if (readiness_score === undefined) {
      return new Response(
        JSON.stringify({ error: 'readiness_score is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `TARGET ROLE: ${target_role || 'Not specified'}
READINESS SCORE: ${readiness_score}/100
WEAKEST SKILLS: ${weakest_skills ? JSON.stringify(weakest_skills) : 'None identified'}
RECENT METRICS:
- Testing Pass Rate: ${recent_metrics?.testing_pass_rate || 0}%
- Task Completion Rate: ${recent_metrics?.completion_rate || 0}%
- Consistency (Streak Days): ${recent_metrics?.streak_days || 0}
- Average AI Scores: ${recent_metrics?.avg_ai_scores || 0}/10

Provide insights about this readiness score and actionable improvements.`;

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

    const insightsResult = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(insightsResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ai-readiness-insights function:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate insights';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
