import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const resend = new Resend(resendApiKey)
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')

    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY not configured')
    }

    // Get date range (last 7 days)
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startIso = startDate.toISOString()

    console.log(`Generating insights for ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`)

    // Pull all metrics in parallel
    const [
      { data: users },
      { data: conversations },
      { data: messages },
      { data: referrals },
      { data: b2bInquiries },
      { data: feedback },
      { data: usageStats },
      { data: knowledgeGaps },
      { data: followupClicks },
      { data: recentMessages }
    ] = await Promise.all([
      supabase.from('users').select('*').gte('created_at', startIso),
      supabase.from('conversations').select('*').gte('created_at', startIso),
      supabase.from('messages').select('*').gte('created_at', startIso),
      supabase.from('referrals').select('*').gte('created_at', startIso),
      supabase.from('b2b_inquiries').select('*').gte('created_at', startIso),
      supabase.from('feedback').select('*').gte('created_at', startIso),
      supabase.from('usage_stats').select('*').gte('date', startDate.toISOString().split('T')[0]),
      supabase.from('knowledge_gaps').select('*').eq('resolved', false),
      supabase.from('followup_clicks').select('*').gte('created_at', startIso),
      supabase.from('messages').select('content, role').eq('role', 'user').gte('created_at', startIso).order('created_at', { ascending: false }).limit(50)
    ])

    // Build comprehensive metrics object
    const userMessages = messages?.filter(m => m.role === 'user') || []
    const assistantMessages = messages?.filter(m => m.role === 'assistant') || []
    
    const metrics = {
      // User metrics
      new_users: users?.length || 0,
      user_types: {
        shoppers: users?.filter(u => u.intent?.toLowerCase().includes('shopping')).length || 0,
        professionals: users?.filter(u => !u.intent?.toLowerCase().includes('shopping')).length || 0,
        by_experience: {
          beginner: users?.filter(u => u.experience_level === 'beginner').length || 0,
          intermediate: users?.filter(u => u.experience_level === 'intermediate').length || 0,
          expert: users?.filter(u => u.experience_level === 'expert').length || 0
        }
      },
      
      // Conversation metrics
      total_conversations: conversations?.length || 0,
      total_messages: messages?.length || 0,
      user_messages: userMessages.length,
      assistant_messages: assistantMessages.length,
      avg_messages_per_conversation: conversations?.length ? 
        Math.round((messages?.length || 0) / conversations.length * 10) / 10 : 0,
      
      // Conversion metrics
      referrals_requested: referrals?.length || 0,
      referrals_by_status: {
        new: referrals?.filter(r => r.status === 'new').length || 0,
        contacted: referrals?.filter(r => r.status === 'contacted').length || 0,
        converted: referrals?.filter(r => r.status === 'converted').length || 0
      },
      b2b_inquiries: b2bInquiries?.length || 0,
      transcript_emails_sent: conversations?.filter(c => c.transcript_emailed).length || 0,
      
      // Quality metrics
      helpful_ratings: feedback?.filter(f => f.rating === 'helpful').length || 0,
      unhelpful_ratings: feedback?.filter(f => f.rating === 'not_helpful').length || 0,
      feedback_score: feedback?.length ? 
        Math.round((feedback?.filter(f => f.rating === 'helpful').length || 0) / feedback.length * 100) : 0,
      
      // Usage stats
      total_api_calls: usageStats?.reduce((sum, s) => sum + (s.total_api_calls || 0), 0) || 0,
      total_blocked_spam: usageStats?.reduce((sum, s) => sum + (s.total_blocked_spam || 0), 0) || 0,
      total_blocked_limit: usageStats?.reduce((sum, s) => sum + (s.total_blocked_limit || 0), 0) || 0,
      total_off_topic: usageStats?.reduce((sum, s) => sum + (s.total_off_topic || 0), 0) || 0,
      estimated_cost_dollars: (usageStats?.reduce((sum, s) => sum + (s.estimated_cost_cents || 0), 0) || 0) / 100,
      
      // Engagement metrics
      followup_clicks: followupClicks?.length || 0,
      unresolved_knowledge_gaps: knowledgeGaps?.length || 0
    }

    // Sample questions for Claude to analyze
    const sampleQuestions = recentMessages?.slice(0, 30).map(m => m.content).join('\n- ') || 'No questions this period'
    
    // Top knowledge gaps
    const topGaps = knowledgeGaps?.slice(0, 5).map(g => g.question).join('\n- ') || 'None'

    // Send to Claude for analysis
    const analysisPrompt = `You are analyzing SignMaker.ai chatbot data for the past 7 days (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}). Generate a brief, actionable insights report.

METRICS:
${JSON.stringify(metrics, null, 2)}

SAMPLE USER QUESTIONS:
- ${sampleQuestions}

UNRESOLVED KNOWLEDGE GAPS:
- ${topGaps}

GENERATE A REPORT WITH:

1. KEY METRICS (2-3 sentences)
- Summarize activity levels
- Note any significant patterns

2. USER BEHAVIOR INSIGHTS (3-5 bullets)
- What are users asking about most?
- Any patterns in question types?
- Where are users getting stuck?
- Shopper vs professional breakdown

3. CONVERSION ANALYSIS (2-3 bullets)
- Referral request rate (referrals / conversations)
- B2B inquiry rate
- What's driving conversions?

4. QUALITY & ENGAGEMENT (2-3 bullets)
- Feedback score analysis
- Follow-up click engagement
- Off-topic/spam issues

5. KNOWLEDGE GAPS (2-3 bullets)
- What topics need improvement?
- Priority additions to knowledge base

6. TOP 3 RECOMMENDATIONS
- Specific, actionable suggestions
- Prioritized by impact

Keep the report under 400 words. Be direct and actionable. Use bullet points.`

    console.log('Calling Claude for analysis...')
    
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: analysisPrompt }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', claudeResponse.status, errorText)
      throw new Error(`Claude API error: ${claudeResponse.status}`)
    }

    const claudeData = await claudeResponse.json()
    const insights = claudeData.content[0].text

    console.log('Generated insights, saving to database...')

    // Save report to database
    const { error: insertError } = await supabase.from('insights_reports').insert({
      report_type: 'weekly',
      period_start: startDate.toISOString().split('T')[0],
      period_end: endDate.toISOString().split('T')[0],
      metrics: metrics,
      insights: insights
    })

    if (insertError) {
      console.error('Error saving report:', insertError)
    }

    // Format insights for email (convert markdown to basic HTML)
    const formattedInsights = insights
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n- /g, '\n<li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^- /gm, '<li>')

    // Email the report
    if (resendApiKey) {
      console.log('Sending email report...')
      
      const emailResult = await resend.emails.send({
        from: 'SignMaker.ai <notifications@signmaker.ai>',
        reply_to: 'ask@signmaker.ai',
        to: ['ask@signmaker.ai'],
        subject: `📊 Weekly Insights — ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .header p { margin: 10px 0 0; opacity: 0.9; }
              .stats { background: #f8f9fa; padding: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
              .stat { text-align: center; }
              .stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
              .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
              .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
              .content h2 { color: #667eea; font-size: 18px; margin-top: 25px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
              .content ul { margin: 10px 0; padding-left: 20px; }
              .content li { margin: 5px 0; }
              .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0; }
              .metric { background: #f8f9fa; padding: 10px; border-radius: 5px; }
              .metric-label { font-size: 11px; color: #666; text-transform: uppercase; }
              .metric-value { font-size: 18px; font-weight: bold; }
              .footer { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Weekly Insights</h1>
              <p>${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${metrics.new_users}</div>
                <div class="stat-label">New Users</div>
              </div>
              <div class="stat">
                <div class="stat-value">${metrics.total_conversations}</div>
                <div class="stat-label">Conversations</div>
              </div>
              <div class="stat">
                <div class="stat-value">${metrics.total_messages}</div>
                <div class="stat-label">Messages</div>
              </div>
            </div>
            
            <div class="content">
              <div class="metrics-grid">
                <div class="metric">
                  <div class="metric-label">Referrals</div>
                  <div class="metric-value">${metrics.referrals_requested}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">B2B Inquiries</div>
                  <div class="metric-value">${metrics.b2b_inquiries}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">👍 Helpful</div>
                  <div class="metric-value">${metrics.helpful_ratings}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">👎 Unhelpful</div>
                  <div class="metric-value">${metrics.unhelpful_ratings}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Est. Cost</div>
                  <div class="metric-value">$${metrics.estimated_cost_dollars.toFixed(2)}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Feedback Score</div>
                  <div class="metric-value">${metrics.feedback_score}%</div>
                </div>
              </div>
              
              <h2>AI Analysis</h2>
              <div style="white-space: pre-wrap;">${insights}</div>
            </div>
            
            <div class="footer">
              <a href="https://signmaker.ai/admin" class="button">View Full Admin Dashboard →</a>
            </div>
          </body>
          </html>
        `
      })

      console.log('Email sent:', emailResult)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      metrics,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Error generating insights:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate insights' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
