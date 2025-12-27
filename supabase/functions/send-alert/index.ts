import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertRequest {
  alert_type: 'b2b_inquiry' | 'hot_lead' | 'quality_issue' | 'enterprise_interest' | 'custom'
  subject: string
  details: Record<string, any>
  user_id?: string
  conversation_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }
    const resend = new Resend(resendApiKey)

    const { alert_type, subject, details, user_id, conversation_id }: AlertRequest = await req.json()

    console.log(`Sending alert: ${alert_type} - ${subject}`)

    // Check if we've sent this alert recently (dedup within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentAlerts } = await supabase
      .from('alerts')
      .select('id')
      .eq('alert_type', alert_type)
      .eq('subject', subject)
      .gte('sent_at', oneHourAgo)
      .limit(1)

    if (recentAlerts && recentAlerts.length > 0) {
      console.log('Duplicate alert within 1 hour, skipping')
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: 'duplicate_within_hour' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user info if user_id provided
    let userInfo = null
    if (user_id) {
      const { data } = await supabase
        .from('users')
        .select('name, email, phone, business_name, intent, experience_level')
        .eq('id', user_id)
        .single()
      userInfo = data
    }

    // Build email content based on alert type
    let emoji = '🔔'
    let priority = 'normal'
    let bgColor = '#667eea'
    
    switch (alert_type) {
      case 'b2b_inquiry':
        emoji = '💼'
        priority = 'high'
        bgColor = '#28a745'
        break
      case 'hot_lead':
        emoji = '🔥'
        priority = 'high'
        bgColor = '#dc3545'
        break
      case 'quality_issue':
        emoji = '⚠️'
        priority = 'high'
        bgColor = '#ffc107'
        break
      case 'enterprise_interest':
        emoji = '🏢'
        priority = 'high'
        bgColor = '#17a2b8'
        break
    }

    // Format details for email
    const detailsHtml = Object.entries(details)
      .map(([key, value]) => `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">${key}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${value}</td></tr>`)
      .join('')

    const userInfoHtml = userInfo ? `
      <h3 style="color: #333; margin-top: 25px;">User Info</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666; width: 120px;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${userInfo.name || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${userInfo.email}">${userInfo.email}</a></td></tr>
        ${userInfo.phone ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="tel:${userInfo.phone}">${userInfo.phone}</a></td></tr>` : ''}
        ${userInfo.business_name ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Business</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${userInfo.business_name}</td></tr>` : ''}
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Intent</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${userInfo.intent || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Experience</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${userInfo.experience_level || 'N/A'}</td></tr>
      </table>
    ` : ''

    // Send email
    const emailResult = await resend.emails.send({
      from: 'SignMaker.ai Alerts <notifications@signmaker.ai>',
      reply_to: 'ask@signmaker.ai',
      to: ['ask@signmaker.ai'],
      subject: `${emoji} [${alert_type.toUpperCase()}]: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px; }
          </style>
        </head>
        <body>
          <div style="background: ${bgColor}; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <div style="font-size: 40px;">${emoji}</div>
            <h1 style="margin: 10px 0 0; font-size: 20px;">${subject}</h1>
            <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: white; padding: 25px; border: 1px solid #e9ecef; border-top: none;">
            <h3 style="color: #333; margin-top: 0;">Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${detailsHtml}
            </table>
            
            ${userInfoHtml}
            
            ${conversation_id ? `
              <div style="margin-top: 25px; text-align: center;">
                <a href="https://signmaker.ai/admin?conversation=${conversation_id}" 
                   style="display: inline-block; background: ${bgColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Conversation →
                </a>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; padding: 15px; color: #666; font-size: 12px;">
            SignMaker.ai Real-time Alerts
          </div>
        </body>
        </html>
      `
    })

    console.log('Alert email sent:', emailResult)

    // Save alert to database
    await supabase.from('alerts').insert({
      alert_type,
      subject,
      details,
      user_id,
      conversation_id
    })

    return new Response(JSON.stringify({ 
      success: true,
      email_sent: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Error sending alert:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to send alert' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
