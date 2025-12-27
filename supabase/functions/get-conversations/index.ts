import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      console.log('get-conversations: Missing user_id');
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .maybeSingle();

    if (userError) {
      console.error('get-conversations: Error verifying user:', userError);
      throw userError;
    }

    if (!user) {
      console.log('get-conversations: User not found:', user_id);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch conversations for this user only
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (convError) {
      console.error('get-conversations: Error fetching conversations:', convError);
      throw convError;
    }

    console.log(`get-conversations: Found ${conversations?.length || 0} conversations for user ${user_id}`);

    return new Response(
      JSON.stringify({ conversations: conversations || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('get-conversations error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch conversations' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
