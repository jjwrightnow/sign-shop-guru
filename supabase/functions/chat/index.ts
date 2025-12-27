import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
- After 2-3 helpful exchanges (${messageCount >= 3 ? 'NOW is a good time' : 'wait for more exchanges'}), offer to connect them with SignExperts.ai
- Say something like: "Based on what you're looking for, I can help connect you with vetted sign professionals in your area through SignExperts.ai. Would that be helpful?"
- Don't push too hard, but make it a natural suggestion after you've been helpful

AVOID:
- Technical manufacturing jargon (channel letters, raceway, routed faces, etc.) unless they ask
- Overwhelming details about materials and processes
- Assuming they know industry terminology` : '';

    const contextualPrompt = `${systemPrompt}

USER CONTEXT:
Name: ${user_context?.name || 'Unknown'}
Experience Level: ${user_context?.experience_level || 'Unknown'}${isShopperByExperience ? ' (NOT a sign professional - just needs a sign made)' : ''}
Intent: ${user_context?.intent || 'Unknown'}
Message Count in Conversation: ${messageCount}
${shopperGuidance}

${isShopperUser ? '' : 'Adapt your response based on their experience level and intent. For beginners, explain concepts more thoroughly. For veterans, be more technical and concise.'}

IMPORTANT: If the user asks about topics completely unrelated to signs, signage, or the sign industry, politely redirect them. You can say something like "I focus on signage and the sign industry. Is there something sign-related I can help you with?"`

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