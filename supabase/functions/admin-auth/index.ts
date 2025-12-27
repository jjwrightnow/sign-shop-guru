import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Allowed origins for CORS - restrict to specific domains
const ALLOWED_ORIGINS = [
  'https://pahsxfzernyylrgfxcmp.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0]
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Simple hash function for password comparison
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const { password, action, sessionToken } = body

    if (action === 'login') {
      if (!password) {
        return new Response(
          JSON.stringify({ success: false, error: 'Password required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const storedHash = Deno.env.get('ADMIN_PASSWORD_HASH')
      if (!storedHash) {
        console.error('ADMIN_PASSWORD_HASH not configured')
        return new Response(
          JSON.stringify({ success: false, error: 'Admin authentication not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const inputHash = await hashPassword(password)
      
      if (inputHash === storedHash) {
        // Clean up expired sessions first
        await supabase
          .from('admin_sessions')
          .delete()
          .lt('expires_at', new Date().toISOString())

        // Create session in database with 24 hour expiry
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        
        const { data: session, error: sessionError } = await supabase
          .from('admin_sessions')
          .insert({ expires_at: expiresAt })
          .select('token, expires_at')
          .single()

        if (sessionError || !session) {
          console.error('Failed to create session:', sessionError)
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to create session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Admin login successful, session created')
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            sessionToken: session.token,
            expiresAt: session.expires_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.warn('Invalid admin password attempt')
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (action === 'validate') {
      if (!sessionToken || typeof sessionToken !== 'string') {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if session exists in database and is not expired
      const { data: session, error: sessionError } = await supabase
        .from('admin_sessions')
        .select('token, expires_at')
        .eq('token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (sessionError) {
        console.error('Error validating session:', sessionError)
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (session) {
        // Update last accessed time
        await supabase
          .from('admin_sessions')
          .update({ last_accessed_at: new Date().toISOString() })
          .eq('token', sessionToken)

        return new Response(
          JSON.stringify({ valid: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'logout') {
      if (sessionToken && typeof sessionToken === 'string') {
        // Delete the session from database
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('token', sessionToken)
        
        console.log('Admin session logged out')
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const origin = req.headers.get('origin')
    const corsHeaders = getCorsHeaders(origin)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Admin auth error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
