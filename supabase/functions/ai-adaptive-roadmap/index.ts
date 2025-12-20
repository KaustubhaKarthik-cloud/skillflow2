import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are SkillFlow Adaptation AI. Decide whether to insert a revision task and what it should cover.

RULES:
- If failure_count >= 2, propose a revision task.
- Revision task must be smaller than original task.
- Include acceptance criteria and 1–2 learning resources hints.
- Focus on the specific concepts that were failed.
- Keep the revision task focused and achievable in 1-2 hours.

OUTPUT JSON ONLY:
{
  "create_revision_task": boolean,
  "revision_task": {
    "title": string,
    "description": string,
    "acceptance_criteria": [string],
    "estimated_hours": number,
    "resources_hint": [string]
  },
  "reason": string
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task_title, task_description, failure_count, last_feedback, weak_concepts } = await req.json();

    if (!task_title || failure_count === undefined) {
      return new Response(
        JSON.stringify({ error: 'task_title and failure_count are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `TASK: ${task_title}
DESCRIPTION: ${task_description || 'No description provided'}
FAILURE COUNT: ${failure_count}
LAST FEEDBACK: ${last_feedback ? JSON.stringify(last_feedback) : 'None'}
WEAK CONCEPTS: ${weak_concepts ? JSON.stringify(weak_concepts) : 'Not identified'}

Based on this information, decide whether to create a revision task.`;

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

    const adaptiveResult = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(adaptiveResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ai-adaptive-roadmap function:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate adaptive roadmap';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
