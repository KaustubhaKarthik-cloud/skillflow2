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

    const systemPrompt = `You are an expert educator evaluating student answers to comprehension questions about video tutorials.

Evaluate each answer based on:
1. Understanding of the concept
2. Accuracy of information
3. Practical application awareness

Return ONLY valid JSON with this exact structure:
{
  "evaluations": [
    {
      "question_id": "<question id>",
      "score": <number 0-10>,
      "feedback": "<specific feedback for this answer>"
    }
  ],
  "overall_score": <average score 0-10>,
  "passed": <boolean, true if overall_score >= 6>,
  "summary_feedback": "<overall feedback and next steps>"
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
        evaluation = JSON.parse(jsonMatch[0]);
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
