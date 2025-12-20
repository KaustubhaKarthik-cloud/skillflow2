import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are SkillFlow Review AI acting like a strict but supportive tech lead.

RULES:
- Score each rubric 0–5.
- Provide strengths + issues + concrete next steps.
- Do not hallucinate facts beyond given context.
- Do not provide full solution; provide guidance.
- Be constructive and specific.

OUTPUT JSON ONLY:
{
  "clarity": number (0-5),
  "correctness": number (0-5),
  "completeness": number (0-5),
  "overall_score_10": number (0-10),
  "strengths": [string],
  "issues": [string],
  "next_steps": [string]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task_title, task_description, acceptance_criteria, user_submission, reference_summary } = await req.json();

    if (!task_title || !user_submission) {
      return new Response(
        JSON.stringify({ error: 'task_title and user_submission are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `TASK: ${task_title}
DESCRIPTION: ${task_description || 'No description provided'}
ACCEPTANCE CRITERIA: ${acceptance_criteria ? JSON.stringify(acceptance_criteria) : 'None specified'}
${reference_summary ? `REFERENCE SUMMARY:\n${reference_summary}` : ''}

USER SUBMISSION:
${user_submission}

Review this submission using the rubric criteria (clarity, correctness, completeness).`;

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

    const reviewResult = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(reviewResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ai-rubric-review function:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate review';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
