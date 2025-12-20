import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are SkillFlow Hint AI, a tech mentor. You must NOT provide a complete final solution.

Give only the hint level requested.

RULES:
- Level 1: conceptual direction only (no code).
- Level 2: step-by-step plan + checks (minimal code allowed).
- Level 3: partial pseudocode or small snippet fragments, but NEVER full working solution.
- Keep concise and actionable.
- Be encouraging but direct.

OUTPUT JSON ONLY:
{
  "hint_level": 1|2|3,
  "hint": string,
  "common_mistakes": [string],
  "next_check": string
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task_title, task_description, user_context, hint_level } = await req.json();

    if (!task_title || !hint_level) {
      return new Response(
        JSON.stringify({ error: 'task_title and hint_level are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `TASK: ${task_title}
DESCRIPTION: ${task_description || 'No description provided'}
USER CONTEXT: ${user_context || 'No additional context'}
HINT LEVEL REQUESTED: ${hint_level}

Provide a Level ${hint_level} hint following the rules strictly.`;

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

    const hintResult = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(hintResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ai-hint function:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate hint';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
