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
    const { attemptId, videoSummaries, taskTitle } = await req.json();
    
    if (!attemptId || !videoSummaries || !taskTitle) {
      throw new Error('attemptId, videoSummaries, and taskTitle are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI API key not configured');
    }

    console.log(`Generating questions for attempt: ${attemptId}`);

    const combinedSummary = videoSummaries.join('\n\n---\n\n');

    const systemPrompt = `You are an expert educator creating comprehension questions to test understanding of video tutorial content.

Generate 3-4 thoughtful questions that:
1. Test understanding, not memorization
2. Relate to practical application
3. Cover the key concepts from the videos
4. Can be answered in 2-3 sentences each

Return ONLY valid JSON with this exact structure:
{
  "questions": [
    "Question 1 text here?",
    "Question 2 text here?",
    "Question 3 text here?"
  ]
}`;

    const userPrompt = `Task Topic: ${taskTitle}

VIDEO SUMMARIES:
${combinedSummary}

Generate 3-4 comprehension questions based on this content. Respond with JSON only.`;

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
      throw new Error('AI question generation failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      parsed = {
        questions: [
          'What are the main concepts you learned from these videos?',
          'How would you apply this knowledge in a real project?',
          'What challenges might you face when implementing this?',
        ],
      };
    }

    // Save questions to database
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const questions = parsed.questions || [];
    const insertedQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const { data: question, error } = await supabaseClient
        .from('testing_questions')
        .insert({
          attempt_id: attemptId,
          question_text: questions[i],
          order_index: i,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting question:', error);
      } else if (question) {
        insertedQuestions.push(question);
      }
    }

    return new Response(JSON.stringify({ questions: insertedQuestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in ai-generate-questions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
