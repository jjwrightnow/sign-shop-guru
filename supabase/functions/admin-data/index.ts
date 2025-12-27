import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate admin session token
    const adminToken = req.headers.get('x-admin-token')
    if (!adminToken || adminToken.length !== 36) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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
        usageStatsResult
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
        supabase.from('usage_stats').select('*').order('date', { ascending: false }).limit(30)
      ])

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

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Admin data error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
