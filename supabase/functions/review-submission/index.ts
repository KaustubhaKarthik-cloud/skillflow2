import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, taskTitle, content, githubLink } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Reviewing submission:', submissionId);
    console.log('Task:', taskTitle);

    const systemPrompt = `You are a senior tech lead reviewing a junior developer's project submission. 
Act like a mentor - be encouraging but constructive.

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks.

Review the submission and provide:
1. A score from 0-10
2. Key strengths (what they did well)
3. Areas for improvement (be specific and actionable)
4. Next action (one clear next step)

Return a JSON object with this exact structure:
{
  "score": number between 0-10,
  "strengths": "string - what was done well",
  "improvements": "string - specific improvements needed",
  "next_action": "string - one clear next step to take"
}`;

    const userMessage = `
Task: ${taskTitle}

Submission content:
${content}

${githubLink ? `GitHub repository: ${githubLink}` : 'No GitHub link provided'}

Please review this submission.`;

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
          { role: 'user', content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('Failed to get AI review');
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    console.log('AI Review content:', aiContent);

    // Parse the JSON from the response
    let reviewData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reviewData = JSON.parse(jsonMatch[0]);
      } else {
        reviewData = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse review data');
    }

    // Validate score
    const score = Math.min(10, Math.max(0, Math.round(reviewData.score || 5)));

    // Create the review in the database
    const { data: review, error: reviewError } = await supabaseClient
      .from('ai_reviews')
      .insert({
        submission_id: submissionId,
        score: score,
        strengths: reviewData.strengths || 'Good effort!',
        improvements: reviewData.improvements || 'Keep practicing and learning.',
        next_action: reviewData.next_action || 'Continue to the next task.',
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Review insert error:', reviewError);
      throw reviewError;
    }

    console.log('Created review:', review.id);

    return new Response(JSON.stringify({ 
      success: true, 
      review: {
        id: review.id,
        score: review.score,
        strengths: review.strengths,
        improvements: review.improvements,
        next_action: review.next_action,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in review-submission:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to review submission' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
