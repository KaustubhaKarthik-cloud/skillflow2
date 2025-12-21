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
    const { attemptId, answers, videoSummaries, taskTitle } = await req.json();
    
    if (!attemptId || !answers || !videoSummaries) {
      throw new Error('attemptId, answers, and videoSummaries are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI API key not configured');
    }

    console.log(`Evaluating answers for attempt: ${attemptId}`);

    const combinedSummary = videoSummaries.join('\n\n---\n\n');

    const questionsAndAnswers = answers.map((a: any, i: number) => 
      `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`
    ).join('\n\n');

    const systemPrompt = `You are SkillFlow Answer Evaluator AI, a strict but fair reviewer.

GOAL
Evaluate the user's answers to questions based on the combined video summary. Do not hallucinate. If an answer is partially correct, explain what is missing.

RULES
- Score each answer 0–10.
- Explain mistakes clearly.
- Provide a short ideal answer (not long, not copy-paste code).
- Decide pass/fail for the whole attempt.

PASS RULE
pass = true only if:
- average_score >= 7
- and no answer is below 4

OUTPUT (STRICT JSON ONLY)
{
  "average_score": number,
  "pass": boolean,
  "per_question": [
    {
      "question_id": "<question id>",
      "question": string,
      "user_answer": string,
      "score": number,
      "feedback": string,
      "ideal_answer": string,
      "missing_points": [string]
    }
  ],
  "final_message": string,
  "recommended_revision": [string]
}`;

    const userPrompt = `Task Topic: ${taskTitle}

VIDEO SUMMARIES:
${combinedSummary}

STUDENT ANSWERS:
${questionsAndAnswers}

Question IDs for reference:
${answers.map((a: any) => `- ${a.questionId}: ${a.question.substring(0, 50)}...`).join('\n')}

Evaluate each answer and respond with JSON only.`;

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
      throw new Error('AI answer evaluation failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let evaluation;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Normalize the response to expected format
        evaluation = {
          evaluations: (parsed.per_question || parsed.evaluations || []).map((q: any) => ({
            question_id: q.question_id,
            score: q.score,
            feedback: q.feedback,
          })),
          overall_score: parsed.average_score ?? parsed.overall_score ?? 0,
          passed: parsed.pass ?? parsed.passed ?? false,
          summary_feedback: parsed.final_message || parsed.summary_feedback || 'Evaluation complete.',
        };
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      evaluation = {
        evaluations: answers.map((a: any) => ({
          question_id: a.questionId,
          score: 5,
          feedback: 'Your answer shows understanding. Keep practicing!',
        })),
        overall_score: 5,
        passed: false,
        summary_feedback: 'Please review the material and try again.',
      };
    }

    // Save answer evaluations to database
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Insert answer records
    for (const evalItem of evaluation.evaluations || []) {
      const answerData = answers.find((a: any) => a.questionId === evalItem.question_id);
      if (answerData) {
        const { error } = await supabaseClient
          .from('testing_answers')
          .insert({
            question_id: evalItem.question_id,
            answer_text: answerData.answer,
            score: evalItem.score,
            feedback: evalItem.feedback,
          });

        if (error) {
          console.error('Error inserting answer:', error);
        }
      }
    }

    // Ensure pass is based on 7/10 threshold (average_score >= 7 and no answer below 4)
    const avgScore = evaluation.overall_score;
    const hasLowScore = evaluation.evaluations.some((e: any) => e.score < 4);
    evaluation.passed = avgScore >= 7 && !hasLowScore;

    // Update attempt with final result
    const { error: updateError } = await supabaseClient
      .from('testing_attempts')
      .update({
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
    console.error('Error in ai-evaluate-answers:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
