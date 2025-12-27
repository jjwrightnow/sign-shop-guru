import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_CONTEXT_ITEMS = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, user_id, context_items } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, tier')
      .eq('id', user_id)
      .maybeSingle()

    if (!user || userError) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET: Retrieve user context
    if (action === 'get') {
      const { data: context, error } = await supabase
        .from('user_context')
        .select('context_type, context_key, context_value')
        .eq('user_id', user_id)
        .eq('is_active', true)

      if (error) throw error

      return new Response(
        JSON.stringify({ context: context || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SAVE: Save/update user context
    if (action === 'save') {
      if (!context_items || !Array.isArray(context_items)) {
        return new Response(
          JSON.stringify({ error: 'context_items array is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check item limit for free users
      const userTier = user.tier || 'free'
      if (userTier === 'free' && context_items.length > MAX_CONTEXT_ITEMS) {
        return new Response(
          JSON.stringify({ error: `Free users can add up to ${MAX_CONTEXT_ITEMS} context items.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Deactivate all existing context for this user
      await supabase
        .from('user_context')
        .update({ is_active: false })
        .eq('user_id', user_id)

      // Insert new context items
      if (context_items.length > 0) {
        const itemsToInsert = context_items.map((item: any) => ({
          user_id,
          context_type: item.context_type,
          context_key: item.context_key,
          context_value: item.context_value,
          is_active: true
        }))

        const { error: insertError } = await supabase
          .from('user_context')
          .upsert(itemsToInsert, {
            onConflict: 'user_id,context_type,context_key',
            ignoreDuplicates: false
          })

        if (insertError) throw insertError
      }

      console.log('User context saved:', user_id, context_items.length, 'items')

      return new Response(
        JSON.stringify({ success: true, items_saved: context_items.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('User context error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})