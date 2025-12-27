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
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      console.log('get-user-by-email: Missing or invalid email');
      return new Response(
        JSON.stringify({ error: 'email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user by email - only return non-sensitive fields
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, experience_level, intent, phone')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('get-user-by-email: Error fetching user:', error);
      throw error;
    }

    if (!user) {
      console.log('get-user-by-email: User not found:', email);
      return new Response(
        JSON.stringify({ user: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('get-user-by-email: Found user:', user.id);

    return new Response(
      JSON.stringify({ 
        user: {
          id: user.id,
          name: user.name,
          experience_level: user.experience_level,
          intent: user.intent,
          phone: user.phone ? true : false // Only return whether phone exists, not the actual number
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('get-user-by-email error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
