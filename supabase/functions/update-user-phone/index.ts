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

  try {
    const { user_id, phone, conversation_id } = await req.json()

    // Validate inputs
    if (!user_id || typeof user_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!phone || typeof phone !== 'string' || phone.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!conversation_id || typeof conversation_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid conversation_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Authorization check: Verify user owns the conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversation_id)
      .eq('user_id', user_id)
      .maybeSingle()

    if (convError) {
      console.error('Error checking conversation:', convError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify authorization' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!conv) {
      console.warn('Unauthorized phone update attempt:', { user_id, conversation_id })
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize phone number (basic cleanup)
    const sanitizedPhone = phone.trim().slice(0, 20)

    // Authorization passed - update phone
    const { error: updateError } = await supabase
      .from('users')
      .update({ phone: sanitizedPhone })
      .eq('id', user_id)

    if (updateError) {
      console.error('Error updating phone:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to save phone number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Phone updated successfully for user:', user_id)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Update phone error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
