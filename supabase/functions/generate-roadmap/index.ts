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
    const { branch, skillLevel, targetRole, weeklyHours } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get the user from the authorization header
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

    console.log('Generating roadmap for user:', user.id);
    console.log('Profile:', { branch, skillLevel, targetRole, weeklyHours });

    const systemPrompt = `You are SkillFlow Roadmap AI, a practical career mentor for students and fresh graduates.

GOAL
Create a personalized, job-focused roadmap that teaches real-world workflows (planning, tasks, reviews, testing, documentation). The roadmap must be actionable and realistic for the user's time constraints.

INPUTS YOU WILL RECEIVE
- branch: ${branch}
- current_level: ${skillLevel}
- target_role: ${targetRole}
- weekly_hours: ${weeklyHours}

RULES
- Do not recommend random topics; align to target_role.
- Prefer hands-on tasks and small projects over theory.
- Each task must have: outcome, acceptance criteria, estimated hours, and a "workflow habit" (e.g., write README, do review checklist).
- Keep scope MVP-friendly: avoid huge projects.
- No plagiarism; do not copy from paid courses.

OUTPUT (STRICT JSON ONLY)
Return only valid JSON in this schema:
{
  "title": string,
  "description": string,
  "target_role": string,
  "weekly_hours": number,
  "estimated_duration_weeks": number,
  "milestones": [
    {
      "title": string,
      "description": string,
      "order": number,
      "tasks": [
        {
          "title": string,
          "description": string,
          "estimated_hours": number,
          "difficulty": "easy"|"medium"|"hard",
          "acceptance_criteria": [string],
          "workflow_habit": string,
          "resources_hint": [string]
        }
      ]
    }
  ],
  "success_metrics": [string]
}

QUALITY
- 3–5 milestones.
- 3–5 tasks per milestone.
- Total weekly workload must roughly match weekly_hours.
- Make it easy to follow and present.`;

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
          { role: 'user', content: `Create a learning roadmap for a ${skillLevel} developer from ${branch} who wants to become a ${targetRole} developer and can dedicate ${weeklyHours} hours per week.` }
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
      throw new Error('Failed to generate roadmap');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response content:', content);

    // Parse the JSON from the response
    let roadmapData;
    try {
      // Try to extract JSON from the response (handle potential markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        roadmapData = JSON.parse(jsonMatch[0]);
      } else {
        roadmapData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse roadmap data');
    }

    // Create the roadmap in the database
    const { data: roadmap, error: roadmapError } = await supabaseClient
      .from('roadmaps')
      .insert({
        user_id: user.id,
        title: roadmapData.title,
        description: roadmapData.description,
      })
      .select()
      .single();

    if (roadmapError) {
      console.error('Roadmap insert error:', roadmapError);
      throw roadmapError;
    }

    console.log('Created roadmap:', roadmap.id);

    // Create milestones and tasks
    for (let i = 0; i < roadmapData.milestones.length; i++) {
      const milestone = roadmapData.milestones[i];
      
      const { data: milestoneData, error: milestoneError } = await supabaseClient
        .from('milestones')
        .insert({
          roadmap_id: roadmap.id,
          title: milestone.title,
          description: milestone.description,
          order_index: i,
        })
        .select()
        .single();

      if (milestoneError) {
        console.error('Milestone insert error:', milestoneError);
        throw milestoneError;
      }

      console.log('Created milestone:', milestoneData.id);

      // Create tasks for this milestone
      for (let j = 0; j < milestone.tasks.length; j++) {
        const task = milestone.tasks[j];
        
        const { error: taskError } = await supabaseClient
          .from('tasks')
          .insert({
            milestone_id: milestoneData.id,
            title: task.title,
            description: task.description,
            order_index: j,
            status: 'todo',
          });

        if (taskError) {
          console.error('Task insert error:', taskError);
          throw taskError;
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      roadmapId: roadmap.id,
      title: roadmapData.title,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-roadmap:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate roadmap' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
