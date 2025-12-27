import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// B2B inquiry trigger keywords
const B2B_TRIGGERS = [
  'training tool', 'train my team', 'train staff', 'customer-facing', 'sales tool',
  'embed', 'white-label', 'white label', 'api access', 'integrate', 'integration',
  'for my business', 'for our company', 'for my shop', 'business inquiry',
  'licensing', 'enterprise', 'bulk', 'franchise'
];

// Referral trigger keywords
const REFERRAL_TRIGGERS = [
  'find a sign company', 'find a sign shop', 'recommend a sign', 'connect me with',
  'sign professional', 'sign maker near', 'who can make', 'get a quote',
  'need someone to', 'hire someone', 'looking for someone'
];

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

// Parse B2B inquiry data from AI response
function parseB2BData(response: string): { company_name?: string; role?: string; contact_info?: string; interest_type?: string; goals?: string } | null {
  const b2bMarker = response.match(/\[B2B_DATA_COLLECTED\]([\s\S]*?)\[\/B2B_DATA_COLLECTED\]/);
  if (!b2bMarker) return null;
  
  const dataBlock = b2bMarker[1];
  const data: any = {};
  
  const companyMatch = dataBlock.match(/company_name:\s*(.+)/i);
  const roleMatch = dataBlock.match(/role:\s*(.+)/i);
  const contactMatch = dataBlock.match(/contact_info:\s*(.+)/i);
  const interestMatch = dataBlock.match(/interest_type:\s*(.+)/i);
  const goalsMatch = dataBlock.match(/goals:\s*(.+)/i);
  
  if (companyMatch) data.company_name = companyMatch[1].trim();
  if (roleMatch) data.role = roleMatch[1].trim();
  if (contactMatch) data.contact_info = contactMatch[1].trim();
  if (interestMatch) data.interest_type = interestMatch[1].trim();
  if (goalsMatch) data.goals = goalsMatch[1].trim();
  
  return Object.keys(data).length > 0 ? data : null;
}

// Parse referral data from AI response
function parseReferralData(response: string): { location_city?: string; location_state?: string; project_type?: string; timeline?: string; phone?: string; best_time_to_call?: string; notes?: string } | null {
  const referralMarker = response.match(/\[REFERRAL_DATA_COLLECTED\]([\s\S]*?)\[\/REFERRAL_DATA_COLLECTED\]/);
  if (!referralMarker) return null;
  
  const dataBlock = referralMarker[1];
  const data: any = {};
  
  const cityMatch = dataBlock.match(/location_city:\s*(.+)/i);
  const stateMatch = dataBlock.match(/location_state:\s*(.+)/i);
  const projectMatch = dataBlock.match(/project_type:\s*(.+)/i);
  const timelineMatch = dataBlock.match(/timeline:\s*(.+)/i);
  const phoneMatch = dataBlock.match(/phone:\s*(.+)/i);
  const timeMatch = dataBlock.match(/best_time_to_call:\s*(.+)/i);
  const notesMatch = dataBlock.match(/notes:\s*(.+)/i);
  
  if (cityMatch) data.location_city = cityMatch[1].trim();
  if (stateMatch) data.location_state = stateMatch[1].trim();
  if (projectMatch) data.project_type = projectMatch[1].trim();
  if (timelineMatch) data.timeline = timelineMatch[1].trim();
  if (phoneMatch) data.phone = phoneMatch[1].trim();
  if (timeMatch) data.best_time_to_call = timeMatch[1].trim();
  if (notesMatch) data.notes = notesMatch[1].trim();
  
  return Object.keys(data).length > 0 ? data : null;
}

// Clean data markers from response before showing to user
function cleanDataMarkers(response: string): string {
  return response
    .replace(/\[B2B_DATA_COLLECTED\][\s\S]*?\[\/B2B_DATA_COLLECTED\]/g, '')
    .replace(/\[REFERRAL_DATA_COLLECTED\][\s\S]*?\[\/REFERRAL_DATA_COLLECTED\]/g, '')
    .trim();
}

// Rate limiting configuration
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_INTERVAL_MS = 3000;  // 3 seconds between messages
const FREE_DAILY_LIMIT = 20;
const ESTIMATED_COST_PER_MESSAGE_CENTS = 1;  // ~$0.01 per message estimate

// Tier limits
const TIER_LIMITS: Record<string, number> = {
  'free': FREE_DAILY_LIMIT,
  'premium': Infinity,
  'beta_tester': Infinity
};

// Spam detection patterns
const SPAM_PATTERNS = [
  /(.)\1{5,}/i,  // Repeated characters (aaaaaaa)
  /https?:\/\/[^\s]+/i,  // URLs
  /\b(buy|sell|discount|free money|click here|winner)\b/i,  // Common spam words
];

const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'bastard', 'piss'
];

// Off-topic detection phrases (from Claude's response)
const OFF_TOPIC_PHRASES = [
  'i focus on signage',
  "i can't help with that",
  'not related to signs',
  'outside my expertise',
  'i specialize in sign',
  'sign-related questions only',
  "that's outside the scope"
];

// Pattern detection keywords
const SHOPPER_PATTERNS = ['how much', 'cost', 'price', 'pricing', 'expensive', 'budget', 'how long', 'timeline', 'when can', 'find a', 'hire', 'recommend a', 'near me', 'in my area'];
const OWNER_PATTERNS = ['train', 'training', 'staff', 'team', 'employees', 'sales tool', 'customer education', 'embed', 'white-label', 'api', 'integrate', 'business', 'pricing strategy', 'hiring', 'operations', 'my company', 'my shop'];
const INSTALLER_PATTERNS = ['troubleshoot', 'fix', 'repair', 'not working', 'problem with', 'issue with', 'code', 'compliance', 'permit', 'installation', 'mounting', 'wiring', 'electrical'];

function detectPatterns(messages: string[]): { shopper: number; owner: number; installer: number } {
  const allText = messages.join(' ').toLowerCase();
  
  let shopper = 0, owner = 0, installer = 0;
  
  SHOPPER_PATTERNS.forEach(p => { if (allText.includes(p)) shopper++; });
  OWNER_PATTERNS.forEach(p => { if (allText.includes(p)) owner++; });
  INSTALLER_PATTERNS.forEach(p => { if (allText.includes(p)) installer++; });
  
  return { shopper, owner, installer };
}

function getOffer(patterns: { shopper: number; owner: number; installer: number }, offersShown: string[], currentIntent: string, currentExperienceLevel: string): { offer: string; offerType: string } | null {
  const isAlreadyShopper = currentIntent === 'shopping' || currentExperienceLevel === 'shopper';
  
  if (patterns.shopper >= 2 && !isAlreadyShopper && !offersShown.includes('shopper')) {
    return {
      offer: "\n\n---\n💡 *It sounds like you might be looking to get a sign made. Would you like me to help connect you with a sign professional in your area?*",
      offerType: 'shopper'
    };
  }
  
  if (isAlreadyShopper) {
    return null;
  }
  
  if (patterns.owner >= 2 && !offersShown.includes('owner')) {
    return {
      offer: "\n\n---\n💼 *It sounds like you might be a sign company owner. SignMaker.ai can be customized as a training tool for your team or a sales tool for your website. Would you like to learn more?*",
      offerType: 'owner'
    };
  }
  
  if (patterns.installer >= 2 && !offersShown.includes('installer')) {
    return {
      offer: "\n\n---\n🔧 *If you're working on a project and need materials or components, I can suggest suppliers in your area. Would that help?*",
      offerType: 'installer'
    };
  }
  
  return null;
}

function isSpam(message: string): { isSpam: boolean; reason: string } {
  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(message)) {
      return { isSpam: true, reason: 'spam_pattern' };
    }
  }
  
  // Check for profanity
  const lowerMessage = message.toLowerCase();
  for (const word of PROFANITY_LIST) {
    if (lowerMessage.includes(word)) {
      return { isSpam: true, reason: 'profanity' };
    }
  }
  
  return { isSpam: false, reason: '' };
}

function isOffTopic(response: string): boolean {
  const lowerResponse = response.toLowerCase();
  return OFF_TOPIC_PHRASES.some(phrase => lowerResponse.includes(phrase));
}

async function updateUsageStats(supabase: any, field: 'total_api_calls' | 'total_blocked_spam' | 'total_blocked_limit' | 'total_off_topic', costCents: number = 0) {
  const today = new Date().toISOString().split('T')[0];
  
  // Try to update existing record
  const { data: existing } = await supabase
    .from('usage_stats')
    .select('id')
    .eq('date', today)
    .maybeSingle();
  
  if (existing) {
    const updates: any = { updated_at: new Date().toISOString() };
    
    // Increment the specific field using raw SQL-like approach
    const { data: current } = await supabase
      .from('usage_stats')
      .select(field + ', estimated_cost_cents')
      .eq('id', existing.id)
      .single();
    
    updates[field] = (current?.[field] || 0) + 1;
    if (costCents > 0) {
      updates.estimated_cost_cents = (current?.estimated_cost_cents || 0) + costCents;
    }
    
    await supabase.from('usage_stats').update(updates).eq('id', existing.id);
  } else {
    // Create new record for today
    const newRecord: any = {
      date: today,
      total_api_calls: 0,
      total_blocked_spam: 0,
      total_blocked_limit: 0,
      total_off_topic: 0,
      estimated_cost_cents: 0
    };
    newRecord[field] = 1;
    if (costCents > 0) {
      newRecord.estimated_cost_cents = costCents;
    }
    
    await supabase.from('usage_stats').insert(newRecord);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { question, user_context, conversation_id } = await req.json()

    console.log('Received chat request:', { question: question?.substring(0, 50), conversation_id })

    // Input validation - must be a string
    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid message format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedQuestion = question.trim();
    
    // MESSAGE LENGTH LIMITS
    if (trimmedQuestion.length < MIN_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Please ask a complete question.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (trimmedQuestion.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Please keep your question under 500 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: 'conversation_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SPAM DETECTION
    const spamCheck = isSpam(trimmedQuestion);
    if (spamCheck.isSpam) {
      console.log('Spam detected:', spamCheck.reason);
      await updateUsageStats(supabase, 'total_blocked_spam');
      return new Response(
        JSON.stringify({ error: "I couldn't process that. Please ask a sign-related question." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY is not configured')
    }

    // Verify conversation exists and get user_id
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversation_id)
      .maybeSingle();

    if (convError) {
      console.error('Error verifying conversation:', convError);
      throw convError;
    }

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: 'Invalid conversation' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user data for rate limiting
    let userData: any = null;
    if (conversation.user_id) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, messages_today, last_message_date, last_message_at, tier, off_topic_count, spam_flags')
        .eq('id', conversation.user_id)
        .maybeSingle();

      if (!user || userError) {
        console.log('User not found for conversation');
        return new Response(
          JSON.stringify({ error: 'Invalid user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userData = user;
    }

    if (userData) {
      const today = new Date().toISOString().split('T')[0];
      const userTier = userData.tier || 'free';
      const dailyLimit = TIER_LIMITS[userTier] || FREE_DAILY_LIMIT;
      
      // Check if it's a new day and reset counter
      let messagestoday = userData.messages_today || 0;
      if (userData.last_message_date !== today) {
        messagestoday = 0;
      }

      // DAILY MESSAGE LIMIT CHECK
      if (messagestoday >= dailyLimit) {
        console.log('Daily limit reached for user:', userData.id, 'tier:', userTier);
        await updateUsageStats(supabase, 'total_blocked_limit');
        return new Response(
          JSON.stringify({ 
            error: "You've reached your daily limit (20 questions). Come back tomorrow, or contact us for unlimited access.",
            limitReached: true
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // COOLDOWN CHECK (3 seconds between messages)
      if (userData.last_message_at) {
        const lastMessageTime = new Date(userData.last_message_at).getTime();
        const timeSinceLastMessage = Date.now() - lastMessageTime;
        
        if (timeSinceLastMessage < MIN_MESSAGE_INTERVAL_MS) {
          const waitSeconds = Math.ceil((MIN_MESSAGE_INTERVAL_MS - timeSinceLastMessage) / 1000);
          console.log('Message sent too quickly, retry after:', waitSeconds);
          return new Response(
            JSON.stringify({ 
              error: 'Please wait a moment before sending another message.',
              retryAfter: waitSeconds
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // DUPLICATE MESSAGE CHECK
      const { data: lastUserMessage } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', conversation_id)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastUserMessage && lastUserMessage.content.trim().toLowerCase() === trimmedQuestion.toLowerCase()) {
        console.log('Duplicate message detected');
        await updateUsageStats(supabase, 'total_blocked_spam');
        return new Response(
          JSON.stringify({ error: "I couldn't process that. Please ask a sign-related question." }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // OFF-TOPIC BLOCK CHECK (5+ off-topic in session)
      if ((userData.off_topic_count || 0) >= 5) {
        console.log('User blocked due to excessive off-topic messages');
        return new Response(
          JSON.stringify({ 
            error: "I'm designed specifically for sign industry questions. Feel free to return when you have signage-related questions.",
            blocked: true
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch conversation history and metadata
    let conversationMessages: string[] = [];
    let offersShown: string[] = [];
    let detectedPersona: string | null = null;
    
    if (conversation_id) {
      const { data: convData } = await supabase
        .from('conversations')
        .select('offers_shown, detected_persona')
        .eq('id', conversation_id)
        .maybeSingle();
      
      offersShown = convData?.offers_shown || [];
      detectedPersona = convData?.detected_persona || null;
      
      const { data: prevMessages } = await supabase
        .from('messages')
        .select('content, role')
        .eq('conversation_id', conversation_id)
        .eq('role', 'user')
        .order('created_at', { ascending: true });
      
      if (prevMessages) {
        conversationMessages = prevMessages.map(m => m.content);
      }
    }
    
    conversationMessages.push(trimmedQuestion);

    // Fetch system prompt from settings
    const { data: settings } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_name', 'system_prompt')
      .eq('is_active', true)
      .maybeSingle()

    const systemPrompt = settings?.setting_value || 'You are SignMaker.ai, a helpful assistant for the sign industry. You help with signage and fabrication questions including channel letters, monument signs, materials, LED lighting, pricing, and installation.'

    // Fetch user's custom training context
    let userTrainingContext = '';
    if (conversation?.user_id) {
      const { data: userContextData } = await supabase
        .from('user_context')
        .select('context_type, context_key, context_value')
        .eq('user_id', conversation.user_id)
        .eq('is_active', true);
      
      if (userContextData && userContextData.length > 0) {
        const contextLines: string[] = [];
        
        // Group by context type for better readability
        const groupedContext: Record<string, string[]> = {};
        userContextData.forEach((c: { context_type: string; context_key: string; context_value: string }) => {
          if (!groupedContext[c.context_type]) {
            groupedContext[c.context_type] = [];
          }
          
          // Format the context nicely
          let formattedValue = c.context_value;
          if (c.context_key === 'list') {
            // Convert comma-separated IDs to readable format
            formattedValue = c.context_value.split(',').map(id => 
              id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            ).join(', ');
          }
          
          const keyLabel = c.context_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          groupedContext[c.context_type].push(`${keyLabel}: ${formattedValue}`);
        });
        
        // Format for prompt
        if (groupedContext['shop_info']) {
          contextLines.push('SHOP INFO:');
          groupedContext['shop_info'].forEach(line => contextLines.push(`  - ${line}`));
        }
        if (groupedContext['equipment']) {
          contextLines.push('EQUIPMENT:');
          groupedContext['equipment'].forEach(line => contextLines.push(`  - ${line}`));
        }
        if (groupedContext['materials']) {
          contextLines.push('MATERIALS IN STOCK:');
          groupedContext['materials'].forEach(line => contextLines.push(`  - ${line}`));
        }
        if (groupedContext['products']) {
          contextLines.push('PRODUCTS MADE:');
          groupedContext['products'].forEach(line => contextLines.push(`  - ${line}`));
        }
        if (groupedContext['preferences']) {
          contextLines.push('SPECIAL INSTRUCTIONS:');
          groupedContext['preferences'].forEach(line => contextLines.push(`  - ${line}`));
        }
        
        userTrainingContext = contextLines.join('\n');
        console.log('User has custom training context:', userContextData.length, 'items');
      }
    }

    // Determine if user is a shopper
    const isShopperByIntent = user_context?.intent === 'shopping';
    const isShopperByExperience = user_context?.experience_level === 'shopper';
    const isShopperUser = isShopperByIntent || isShopperByExperience;
    const messageCount = conversationMessages.length;

    const shopperGuidance = isShopperUser ? `

SPECIAL GUIDANCE FOR SIGN BUYERS:
This user is looking to purchase a sign, not a sign industry professional. They selected "${isShopperByExperience ? "I'm not in the sign industry — just need a sign" : "Shopping — I need a sign made"}". Adapt your responses:

COMMUNICATION STYLE:
- Use beginner-friendly language — NO industry jargon
- Explain things simply, as you would to someone who has never bought a sign before
- Focus on what they'll GET (the end result), not fabrication details
- Use relatable comparisons (e.g., "like choosing between LED and fluorescent bulbs for your home")

CONVERSATION APPROACH:
- Be helpful and informative about their sign options
- Answer their questions clearly without overwhelming technical details
- Focus on: realistic budget ranges, timeline expectations, what makes a quality sign
- Help them understand what questions to ask sign companies

PROACTIVE REFERRAL (IMPORTANT):
- After 2-3 helpful exchanges (${messageCount >= 3 ? 'NOW is a good time' : 'wait for more exchanges'}), offer to connect them with a sign professional
- Say something like: "Based on what you're looking for, I can help connect you with a sign professional in your area. Would that be helpful?"
- Don't push too hard, but make it a natural suggestion after you've been helpful

REFERRAL DATA COLLECTION:
When a shopper says YES to being connected with a sign professional, or asks "how do I find a sign company", "can you recommend someone", etc., collect their information conversationally:

Ask: "I'd be happy to connect you with a sign pro! Quick questions:
- What city and state are you in?
- What type of sign are you looking for?
- What's your timeline?
- Best phone number to reach you?
- Preferred time to be contacted?"

After they provide the info, include this hidden data block at the END of your response (the user won't see it):
[REFERRAL_DATA_COLLECTED]
location_city: [their city]
location_state: [their state]
project_type: [sign type]
timeline: [their timeline]
phone: [their phone]
best_time_to_call: [preferred time]
notes: [any additional project details]
[/REFERRAL_DATA_COLLECTED]

Then confirm: "Perfect! A sign professional in your area will reach out within 1 business day. Anything else I can help with?"

AVOID:
- Technical manufacturing jargon (channel letters, raceway, routed faces, etc.) unless they ask
- Overwhelming details about materials and processes
- Assuming they know industry terminology` : '';

    // B2B/Business inquiry guidance
    const b2bGuidance = `

B2B INQUIRY COLLECTION:
When a user shows interest in SignMaker.ai for their business (mentions training tool, white-label, API, embedding, enterprise use, or says "yes" to a B2B offer), collect their business information conversationally:

Ask: "Great! Tell me a bit about your company:
- Company name?
- Your role?
- Best email or phone to reach you?
- What are you hoping to achieve — team training, customer-facing tool, or both?"

After they provide the info, include this hidden data block at the END of your response (the user won't see it):
[B2B_DATA_COLLECTED]
company_name: [their company]
role: [their role]
contact_info: [email or phone]
interest_type: [training/customer-facing/both/other]
goals: [what they want to achieve]
[/B2B_DATA_COLLECTED]

Then confirm: "Thanks! Someone from our team will reach out within 1 business day. Feel free to keep asking questions in the meantime."
`;

    // Build custom context section for trained users
    const customContextSection = userTrainingContext ? `

USER'S CUSTOM CONTEXT (from "Train Me" feature):
${userTrainingContext}

INSTRUCTIONS FOR USING CUSTOM CONTEXT:
- Use this context to personalize your answers
- Reference their equipment, materials, and shop type when relevant
- If they have specific equipment, skip suggestions to buy/outsource that capability
- If they only make certain product types, focus on those solutions
- If they have special instructions (like "we outsource electrical"), respect that
- Don't repeat their context back to them unless asked
- Assume they have the capabilities they listed` : '';

    const contextualPrompt = `${systemPrompt}

USER CONTEXT:
Name: ${user_context?.name || 'Unknown'}
Experience Level: ${user_context?.experience_level || 'Unknown'}${isShopperByExperience ? ' (NOT a sign professional - just needs a sign made)' : ''}
Intent: ${user_context?.intent || 'Unknown'}
Message Count in Conversation: ${messageCount}
${customContextSection}
${shopperGuidance}
${b2bGuidance}

${isShopperUser ? '' : 'Adapt your response based on their experience level and intent. For beginners, explain concepts more thoroughly. For veterans, be more technical and concise.'}

IMPORTANT: If the user asks about topics completely unrelated to signs, signage, or the sign industry, politely redirect them. You can say something like "I focus on signage and the sign industry. Is there something sign-related I can help you with?"

CRITICAL DATA COLLECTION RULES:
- The [B2B_DATA_COLLECTED] and [REFERRAL_DATA_COLLECTED] blocks are HIDDEN from users - they are for system processing only
- Only include these blocks AFTER the user has provided the requested information
- Keep collecting information conversationally until you have enough to fill the data block
- Always confirm submission after collecting data`

    console.log('Calling Claude API...')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: contextualPrompt,
        messages: [{ role: 'user', content: trimmedQuestion }]
      })
    })

    const data = await response.json()
    
    console.log('Claude API response status:', response.status)

    if (data.error) {
      console.error('Claude API error:', data.error)
      throw new Error(data.error.message)
    }

    let assistantResponse = data.content[0].text

    // Update usage stats for successful API call
    await updateUsageStats(supabase, 'total_api_calls', ESTIMATED_COST_PER_MESSAGE_CENTS);

    // ========== B2B DATA COLLECTION ==========
    const b2bData = parseB2BData(assistantResponse);
    if (b2bData && conversation?.user_id) {
      console.log('B2B data collected:', b2bData);
      
      // Get user info
      const { data: userInfo } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', conversation.user_id)
        .single();
      
      // Save to b2b_inquiries table
      const b2bRecord = {
        company_name: b2bData.company_name || null,
        contact_info: b2bData.contact_info || userInfo?.email || null,
        role: b2bData.role || null,
        interest_type: b2bData.interest_type || null,
        goals: b2bData.goals || null,
        user_id: conversation.user_id,
        conversation_id: conversation_id,
        status: 'new'
      };
      
      const { data: insertedB2B, error: b2bError } = await supabase
        .from('b2b_inquiries')
        .insert(b2bRecord)
        .select()
        .single();
      
      if (b2bError) {
        console.error('Error saving B2B inquiry:', b2bError);
      } else {
        console.log('B2B inquiry saved:', insertedB2B);
        
        // Send email notification to partners@signmaker.ai
        const timestamp = new Date().toISOString();
        const adminLink = 'https://signmaker.ai/admin';
        
        await sendNotificationEmail(
          'partners@signmaker.ai',
          `New B2B Inquiry: ${b2bData.company_name || 'Unknown Company'}`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">NEW B2B INQUIRY</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Company:</td>
                <td style="padding: 8px 0;">${b2bData.company_name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Contact:</td>
                <td style="padding: 8px 0;">${userInfo?.name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
                <td style="padding: 8px 0;">${b2bData.contact_info || userInfo?.email || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Role:</td>
                <td style="padding: 8px 0;">${b2bData.role || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Interest:</td>
                <td style="padding: 8px 0;">${b2bData.interest_type || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Goals:</td>
                <td style="padding: 8px 0;">${b2bData.goals || 'Not provided'}</td>
              </tr>
            </table>
            
            <p style="color: #888; font-size: 12px;">Submitted: ${timestamp}</p>
            
            <a href="${adminLink}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #00d4ff; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin</a>
          </div>
          `
        );
      }
    }

    // ========== REFERRAL DATA COLLECTION ==========
    const referralData = parseReferralData(assistantResponse);
    if (referralData && conversation?.user_id) {
      console.log('Referral data collected:', referralData);
      
      // Get user info
      const { data: userInfo } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', conversation.user_id)
        .single();
      
      // Save to referrals table
      const referralRecord = {
        user_id: conversation.user_id,
        conversation_id: conversation_id,
        location_city: referralData.location_city || null,
        location_state: referralData.location_state || null,
        project_type: referralData.project_type || null,
        timeline: referralData.timeline || null,
        phone: referralData.phone || userInfo?.phone || null,
        best_time_to_call: referralData.best_time_to_call || null,
        notes: referralData.notes || null,
        status: 'new'
      };
      
      const { data: insertedReferral, error: referralError } = await supabase
        .from('referrals')
        .insert(referralRecord)
        .select()
        .single();
      
      if (referralError) {
        console.error('Error saving referral:', referralError);
      } else {
        console.log('Referral saved:', insertedReferral);
        
        // Send email notification to ask@signmaker.ai
        const timestamp = new Date().toISOString();
        const adminLink = 'https://signmaker.ai/admin';
        
        await sendNotificationEmail(
          'ask@signmaker.ai',
          `New Referral: ${referralData.project_type || 'Sign Project'}`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">NEW REFERRAL</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Contact:</td>
                <td style="padding: 8px 0;">${userInfo?.name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
                <td style="padding: 8px 0;">${userInfo?.email || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Phone:</td>
                <td style="padding: 8px 0;">${referralData.phone || userInfo?.phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Location:</td>
                <td style="padding: 8px 0;">${referralData.location_city || ''} ${referralData.location_state || ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Project Type:</td>
                <td style="padding: 8px 0;">${referralData.project_type || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Timeline:</td>
                <td style="padding: 8px 0;">${referralData.timeline || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Best Time to Call:</td>
                <td style="padding: 8px 0;">${referralData.best_time_to_call || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Notes:</td>
                <td style="padding: 8px 0;">${referralData.notes || 'None'}</td>
              </tr>
            </table>
            
            <p style="color: #888; font-size: 12px;">Submitted: ${timestamp}</p>
            
            <a href="${adminLink}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #00d4ff; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin</a>
          </div>
          `
        );
      }
    }

    // Clean data markers from response before showing to user
    assistantResponse = cleanDataMarkers(assistantResponse);

    // OFF-TOPIC DETECTION
    let newOffTopicCount = userData?.off_topic_count || 0;
    if (isOffTopic(assistantResponse)) {
      newOffTopicCount++;
      console.log('Off-topic response detected, count:', newOffTopicCount);
      await updateUsageStats(supabase, 'total_off_topic');
      
      // Add warning after 3 off-topic messages
      if (newOffTopicCount >= 3 && newOffTopicCount < 5) {
        assistantResponse += "\n\n---\n⚠️ *It seems like you have questions outside my expertise. I specialize in signage — is there anything sign-related I can help with?*";
      }
    }

    // Check if AI response contains SignExperts.ai referral
    const containsSignExpertsReferral = assistantResponse.toLowerCase().includes('signexperts.ai') || 
                                         assistantResponse.toLowerCase().includes('sign experts');
    
    if (isShopperUser && containsSignExpertsReferral && conversation_id) {
      console.log('Logging SignExperts.ai referral for shopper user');
      await supabase.from('signexperts_referrals').insert({
        user_id: conversation?.user_id || null,
        conversation_id: conversation_id,
        referral_type: 'signexperts',
        referral_context: trimmedQuestion.substring(0, 500),
        user_response: 'pending'
      });
    }

    // Pattern detection after 3+ messages
    if (conversationMessages.length >= 3) {
      const patterns = detectPatterns(conversationMessages);
      console.log('Detected patterns:', patterns);
      
      const offer = getOffer(patterns, offersShown, user_context?.intent || '', user_context?.experience_level || '');
      
      if (offer) {
        assistantResponse += offer.offer;
        offersShown = [...offersShown, offer.offerType];
        
        if (offer.offerType === 'shopper' && conversation_id) {
          console.log('Logging pattern-based shopper referral offer');
          await supabase.from('signexperts_referrals').insert({
            user_id: conversation?.user_id || null,
            conversation_id: conversation_id,
            referral_type: 'pattern_detected',
            referral_context: 'User showed shopper patterns: ' + trimmedQuestion.substring(0, 300),
            user_response: 'pending'
          });
        }
        
        const maxPattern = Math.max(patterns.shopper, patterns.owner, patterns.installer);
        if (maxPattern >= 2) {
          if (patterns.shopper === maxPattern) detectedPersona = 'shopper';
          else if (patterns.owner === maxPattern) detectedPersona = 'owner';
          else if (patterns.installer === maxPattern) detectedPersona = 'installer';
        }
      }
    }

    // Save messages to database
    if (conversation_id) {
      console.log('Saving messages to database...')
      
      await supabase.from('messages').insert({
        conversation_id,
        role: 'user',
        content: trimmedQuestion
      })

      await supabase.from('messages').insert({
        conversation_id,
        role: 'assistant',
        content: assistantResponse
      })
      
      await supabase
        .from('conversations')
        .update({ 
          offers_shown: offersShown,
          detected_persona: detectedPersona
        })
        .eq('id', conversation_id);
    }

    // Update user rate limiting counters
    if (userData) {
      const today = new Date().toISOString().split('T')[0];
      const isNewDay = userData.last_message_date !== today;
      
      await supabase
        .from('users')
        .update({
          messages_today: isNewDay ? 1 : (userData.messages_today || 0) + 1,
          last_message_date: today,
          last_message_at: new Date().toISOString(),
          off_topic_count: newOffTopicCount
        })
        .eq('id', userData.id);
    }

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Chat function error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})