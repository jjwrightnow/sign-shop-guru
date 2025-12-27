import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { followup_id, conversation_id, user_id, clicked_question, variant_group } = await req.json()

    if (!clicked_question) {
      return new Response(
        JSON.stringify({ error: 'clicked_question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record the click
    const { error: clickError } = await supabase
      .from('followup_clicks')
      .insert({
        followup_id,
        conversation_id,
        user_id,
        clicked_question,
        variant_group: variant_group || 'control',
      })

    if (clickError) {
      console.error('Error recording click:', clickError)
    }

    // Update click count on the followup if we have an ID
    if (followup_id) {
      const { data: followup } = await supabase
        .from('suggested_followups')
        .select('click_count')
        .eq('id', followup_id)
        .single()

      if (followup) {
        await supabase
          .from('suggested_followups')
          .update({ click_count: (followup.click_count || 0) + 1 })
          .eq('id', followup_id)
      }
    }

    console.log('Follow-up click tracked:', { clicked_question, variant_group })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Track followup click error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
