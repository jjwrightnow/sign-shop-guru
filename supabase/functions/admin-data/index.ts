import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Email notification helper
async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return { success: false, error: "Email not configured" };
    }
    
    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from: "SignMaker.ai <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });
    
    console.log("Email sent successfully:", result);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
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

    // Validate admin session token against database
    const adminToken = req.headers.get('x-admin-token')
    if (!adminToken || typeof adminToken !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if session exists in database and is not expired
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('token, expires_at')
      .eq('token', adminToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (sessionError) {
      console.error('Error validating admin session:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Session validation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!session) {
      console.warn('Invalid or expired admin session token')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last accessed time
    await supabase
      .from('admin_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('token', adminToken)

    const { action, data } = await req.json()

    // Fetch all admin data
    if (action === 'fetchAll') {
      const [
        usersResult,
        conversationsResult,
        messagesResult,
        feedbackResult,
        settingsResult,
        b2bResult,
        partnersResult,
        referralsResult,
        signexpertsReferralsResult,
        usageStatsResult,
        userContextResult
      ] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('conversations').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('feedback').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*'),
        supabase.from('b2b_inquiries').select('*').order('created_at', { ascending: false }),
        supabase.from('partners').select('*').order('created_at', { ascending: false }),
        supabase.from('referrals').select('*').order('created_at', { ascending: false }),
        supabase.from('signexperts_referrals').select('*').order('created_at', { ascending: false }),
        supabase.from('usage_stats').select('*').order('date', { ascending: false }).limit(30),
        supabase.from('user_context').select('*').eq('is_active', true)
      ])

      // Calculate training stats
      const allContext = userContextResult.data || [];
      const usersWithContext = [...new Set(allContext.map((c: any) => c.user_id))];
      
      // Count equipment selections
      const equipmentCounts: Record<string, number> = {};
      const materialCounts: Record<string, number> = {};
      const productCounts: Record<string, number> = {};
      
      allContext.forEach((c: any) => {
        if (c.context_type === 'equipment' && c.context_value === 'true') {
          equipmentCounts[c.context_key] = (equipmentCounts[c.context_key] || 0) + 1;
        }
        if (c.context_type === 'materials' && c.context_value === 'true') {
          materialCounts[c.context_key] = (materialCounts[c.context_key] || 0) + 1;
        }
        if (c.context_type === 'products' && c.context_value === 'true') {
          productCounts[c.context_key] = (productCounts[c.context_key] || 0) + 1;
        }
      });
      
      // Get custom instructions (anonymized themes)
      const customInstructions = allContext
        .filter((c: any) => c.context_type === 'preferences' && c.context_key === 'custom_instructions')
        .map((c: any) => c.context_value)
        .filter((v: string) => v && v.length > 0);

      // Calculate users hitting daily limits
      const usersHittingLimits = (usersResult.data || []).filter(
        (u: any) => u.tier === 'free' && u.messages_today >= 20
      );

      // Calculate users flagged for spam/off-topic
      const flaggedUsers = (usersResult.data || []).filter(
        (u: any) => (u.spam_flags || 0) > 0 || (u.off_topic_count || 0) >= 3
      );

      return new Response(
        JSON.stringify({
          users: usersResult.data || [],
          conversations: conversationsResult.data || [],
          messages: messagesResult.data || [],
          feedback: feedbackResult.data || [],
          settings: settingsResult.data || [],
          b2b_inquiries: b2bResult.data || [],
          partners: partnersResult.data || [],
          referrals: referralsResult.data || [],
          signexperts_referrals: signexpertsReferralsResult.data || [],
          usage_stats: usageStatsResult.data || [],
          user_context: allContext,
          admin_stats: {
            users_hitting_limits: usersHittingLimits.length,
            users_hitting_limits_list: usersHittingLimits.map((u: any) => ({ id: u.id, name: u.name, email: u.email })),
            flagged_users: flaggedUsers.length,
            flagged_users_list: flaggedUsers.map((u: any) => ({ 
              id: u.id, 
              name: u.name, 
              email: u.email, 
              spam_flags: u.spam_flags, 
              off_topic_count: u.off_topic_count 
            })),
            today_stats: (usageStatsResult.data || [])[0] || null
          },
          training_stats: {
            users_trained: usersWithContext.length,
            users_trained_ids: usersWithContext,
            equipment_counts: equipmentCounts,
            material_counts: materialCounts,
            product_counts: productCounts,
            custom_instructions_count: customInstructions.length,
            custom_instructions_samples: customInstructions.slice(0, 10)
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user tier
    if (action === 'updateUserTier') {
      const { id, tier } = data
      if (!['free', 'premium', 'beta_tester'].includes(tier)) {
        return new Response(
          JSON.stringify({ error: 'Invalid tier' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const { error } = await supabase
        .from('users')
        .update({ tier })
        .eq('id', id)
      
      if (error) throw error
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Reset user off-topic count
    if (action === 'resetUserFlags') {
      const { id } = data
      const { error } = await supabase
        .from('users')
        .update({ off_topic_count: 0, spam_flags: 0 })
        .eq('id', id)
      
      if (error) throw error
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update setting
    if (action === 'updateSetting') {
      const { id, setting_value } = data
      const { error } = await supabase
        .from('settings')
        .update({ setting_value, updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user contacted status
    if (action === 'updateUserContacted') {
      const { id, contacted } = data
      const { error } = await supabase
        .from('users')
        .update({ contacted })
        .eq('id', id)
      
      if (error) throw error
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update B2B inquiry
    if (action === 'updateB2BInquiry') {
      const { id, updates } = data
      const { error } = await supabase
        .from('b2b_inquiries')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update referral
    if (action === 'updateReferral') {
      const { id, updates } = data
      const { error } = await supabase
        .from('referrals')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Toggle partner active status
    if (action === 'togglePartner') {
      const { id, is_active } = data
      const { error } = await supabase
        .from('partners')
        .update({ is_active })
        .eq('id', id)
      
      if (error) throw error
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add partner
    if (action === 'addPartner') {
      const { error } = await supabase
        .from('partners')
        .insert(data)
      
      if (error) throw error
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add B2B inquiry with email notification
    if (action === 'addB2BInquiry') {
      const { error, data: insertedData } = await supabase
        .from('b2b_inquiries')
        .insert(data)
        .select()
        .single()
      
      if (error) throw error

      // Send email notification to partners@signmaker.ai
      const timestamp = new Date().toISOString();
      const adminLink = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://signmaker.ai'}/admin`;
      
      await sendNotificationEmail(
        'partners@signmaker.ai',
        `New B2B Inquiry: ${data.company_name || 'Unknown Company'}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">NEW B2B INQUIRY</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Company:</td>
              <td style="padding: 8px 0;">${data.company_name || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Contact:</td>
              <td style="padding: 8px 0;">${data.contact_name || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
              <td style="padding: 8px 0;">${data.contact_info || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Role:</td>
              <td style="padding: 8px 0;">${data.role || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Interest:</td>
              <td style="padding: 8px 0;">${data.interest_type || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Goals:</td>
              <td style="padding: 8px 0;">${data.goals || 'Not provided'}</td>
            </tr>
          </table>
          
          <p style="color: #888; font-size: 12px;">Submitted: ${timestamp}</p>
          
          <a href="${adminLink}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #00d4ff; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin</a>
        </div>
        `
      );

      return new Response(
        JSON.stringify({ success: true, data: insertedData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add referral with email notification
    if (action === 'addReferral') {
      const { error, data: insertedData } = await supabase
        .from('referrals')
        .insert(data)
        .select()
        .single()
      
      if (error) throw error

      // Get user info if available
      let userName = 'Unknown';
      let userEmail = 'Not provided';
      if (data.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', data.user_id)
          .single();
        if (userData) {
          userName = userData.name;
          userEmail = userData.email;
        }
      }

      // Send email notification to ask@signmaker.ai
      const timestamp = new Date().toISOString();
      const adminLink = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://signmaker.ai'}/admin`;
      
      await sendNotificationEmail(
        'ask@signmaker.ai',
        `New Referral: ${data.project_type || 'Sign Project'}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">NEW REFERRAL</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Contact:</td>
              <td style="padding: 8px 0;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
              <td style="padding: 8px 0;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Phone:</td>
              <td style="padding: 8px 0;">${data.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Project Type:</td>
              <td style="padding: 8px 0;">${data.project_type || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Location:</td>
              <td style="padding: 8px 0;">${data.location_city || ''} ${data.location_state || ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Timeline:</td>
              <td style="padding: 8px 0;">${data.timeline || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Best Time to Call:</td>
              <td style="padding: 8px 0;">${data.best_time_to_call || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #666;">Notes:</td>
              <td style="padding: 8px 0;">${data.notes || 'None'}</td>
            </tr>
          </table>
          
          <p style="color: #888; font-size: 12px;">Submitted: ${timestamp}</p>
          
          <a href="${adminLink}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #00d4ff; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin</a>
        </div>
        `
      );

      return new Response(
        JSON.stringify({ success: true, data: insertedData }),
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
    console.error('Admin data error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
