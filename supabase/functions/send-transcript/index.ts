import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const formatTranscript = (messages: any[], userName: string, userEmail: string, date: string) => {
  const messageHtml = messages.map(msg => `
    <div style="margin-bottom: 16px; padding: 12px; border-radius: 8px; ${msg.role === 'user' ? 'background-color: #1a1a1a; margin-left: 20px;' : 'background-color: #0f0f0f; margin-right: 20px;'}">
      <div style="font-weight: bold; color: ${msg.role === 'user' ? '#00d4ff' : '#a3a3a3'}; margin-bottom: 8px; font-size: 12px;">
        ${msg.role === 'user' ? 'You' : 'SignMaker.ai'}
      </div>
      <div style="color: #ffffff; font-size: 14px; line-height: 1.5;">
        ${msg.content.replace(/\n/g, '<br>')}
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Header -->
  <div style="background-color: #1a1a1a; padding: 24px; text-align: center; border-bottom: 1px solid #333;">
    <div style="font-size: 24px; font-weight: bold; color: #ffffff;">
      SignMaker<span style="color: #00d4ff;">.ai</span>
    </div>
    <div style="color: #a3a3a3; font-size: 14px; margin-top: 4px;">Industry Q&A Assistant</div>
  </div>
  
  <!-- Content -->
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 24px;">
    
    <!-- Intro -->
    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <div style="color: #ffffff; font-size: 18px; margin-bottom: 8px;">Hey ${userName},</div>
      <div style="color: #a3a3a3; font-size: 14px;">Here's a copy of your conversation from ${date}.</div>
    </div>
    
    <!-- Messages -->
    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 24px;">
      ${messageHtml}
    </div>
    
    <!-- CTA -->
    <div style="text-align: center; margin-top: 32px; padding: 24px; background-color: #1a1a1a; border-radius: 12px;">
      <div style="color: #ffffff; font-size: 16px; margin-bottom: 16px;">Have more questions?</div>
      <a href="https://signmaker.ai" style="display: inline-block; padding: 12px 24px; background-color: #00d4ff; color: #000000; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 8px;">Ask SignMaker.ai</a>
      <a href="https://signexperts.ai" style="display: inline-block; padding: 12px 24px; background-color: transparent; color: #00d4ff; text-decoration: none; border-radius: 8px; font-weight: bold; border: 1px solid #00d4ff;">Find a Sign Pro</a>
    </div>
    
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; padding: 24px; border-top: 1px solid #333;">
    <div style="color: #666666; font-size: 12px;">© SignMaker.ai — Helping sign pros and buyers since 2024</div>
    <div style="margin-top: 8px;">
      <a href="https://signmaker.ai/terms" style="color: #666666; font-size: 12px; text-decoration: none;">Terms</a>
      <span style="color: #666666; font-size: 12px;"> · </span>
      <a href="https://signmaker.ai/terms" style="color: #666666; font-size: 12px; text-decoration: none;">Privacy</a>
    </div>
  </div>
  
</body>
</html>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { conversation_id, user_email, user_name } = await req.json()

    console.log('Send transcript request:', { conversation_id, user_email, user_name });

    if (!conversation_id || !user_email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing conversation_id or user_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const resend = new Resend(resendApiKey)

    // Check if already sent
    const { data: conversation } = await supabase
      .from('conversations')
      .select('transcript_emailed')
      .eq('id', conversation_id)
      .single();

    if (conversation?.transcript_emailed) {
      return new Response(
        JSON.stringify({ success: false, error: 'Transcript already sent', alreadySent: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      throw msgError;
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No messages found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format date
    const date = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    // Get first question for subject line
    const firstQuestion = messages.find(m => m.role === 'user')?.content || 'Your conversation'
    const subjectPreview = firstQuestion.substring(0, 50) + (firstQuestion.length > 50 ? '...' : '')

    // Generate HTML
    const html = formatTranscript(messages, user_name || 'there', user_email, date)

    console.log('Sending email to:', user_email);

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'SignMaker.ai <ask@signmaker.ai>',
      to: [user_email],
      subject: `Your SignMaker.ai Conversation — "${subjectPreview}"`,
      html: html
    })

    if (emailError) {
      console.error('Resend error:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully');

    // Update conversation
    await supabase
      .from('conversations')
      .update({ 
        transcript_emailed: true, 
        transcript_emailed_at: new Date().toISOString() 
      })
      .eq('id', conversation_id)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Send transcript error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
