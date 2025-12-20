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
    const { attemptId, reflection, videoSummaries, taskTitle } = await req.json();
    
    if (!attemptId || !reflection || !videoSummaries) {
      throw new Error('attemptId, reflection, and videoSummaries are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI API key not configured');
    }

    console.log(`Evaluating learning for attempt: ${attemptId}`);

    const combinedSummary = videoSummaries.join('\n\n---\n\n');

    const systemPrompt = `You are an expert learning evaluator. Your job is to assess how well a student has understood and absorbed knowledge from video tutorials.

You will receive:
1. Combined summaries of videos the student watched
2. The student's reflection on what they learned

Evaluate the student's understanding and return ONLY valid JSON with this exact structure:
{
  "score": <number 0-10>,
  "strengths": "<what the student demonstrated understanding of>",
  "missing_concepts": "<important concepts from videos not reflected in their response>",
  "feedback": "<encouraging feedback with specific suggestions>",
  "passed": <boolean, true if score >= 6>
}

Be encouraging but honest. Focus on comprehension, not memorization.`;

    const userPrompt = `Task: ${taskTitle}

VIDEO SUMMARIES:
${combinedSummary}

STUDENT'S REFLECTION:
${reflection}

Evaluate the student's learning and respond with JSON only.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI evaluation failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let evaluation;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      evaluation = {
        score: 5,
        strengths: 'Your reflection shows effort in understanding the material.',
        missing_concepts: 'Unable to fully analyze at this time.',
        feedback: 'Please try again or provide more detail in your reflection.',
        passed: false,
      };
    }

    // Update the testing attempt
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { error: updateError } = await supabaseClient
      .from('testing_attempts')
      .update({
        reflection_score: evaluation.score,
        reflection_feedback: evaluation.feedback,
        passed: evaluation.passed,
      })
      .eq('id', attemptId);

    if (updateError) {
      console.error('Error updating attempt:', updateError);
    }

    return new Response(JSON.stringify({ evaluation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in ai-evaluate-learning:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
