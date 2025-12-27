import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000;  // 1 minute
const MAX_MESSAGES_PER_WINDOW = 10;  // 10 messages per minute per conversation
const MIN_MESSAGE_INTERVAL_MS = 2000;  // 2 seconds between messages
const MAX_QUESTION_LENGTH = 2000;  // Max characters for question

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
  // User is already identified as a shopper by experience level - don't offer shopper conversion
  const isAlreadyShopper = currentIntent === 'shopping' || currentExperienceLevel === 'shopper';
  
  // Don't offer shopper conversion if already a shopper
  if (patterns.shopper >= 2 && !isAlreadyShopper && !offersShown.includes('shopper')) {
    return {
      offer: "\n\n---\n💡 *It sounds like you might be looking to get a sign made. Would you like me to help connect you with a sign professional in your area?*",
      offerType: 'shopper'
    };
  }
  
  // Don't offer owner/installer upgrades to shoppers
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question, user_context, conversation_id } = await req.json()

    console.log('Received chat request:', { question: question?.substring(0, 50), conversation_id })

    // Input validation
    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid message format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message must be less than ${MAX_QUESTION_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: 'conversation_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY is not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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

    // Verify user exists
    if (conversation.user_id) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', conversation.user_id)
        .maybeSingle();

      if (!user || userError) {
        console.log('User not found for conversation');
        return new Response(
          JSON.stringify({ error: 'Invalid user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Rate limiting check
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    
    const { data: recentMessages, error: rateError } = await supabase
      .from('messages')
      .select('created_at')
      .eq('conversation_id', conversation_id)
      .eq('role', 'user')
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false });

    if (rateError) {
      console.error('Rate limit check error:', rateError);
      throw rateError;
    }

    if (recentMessages && recentMessages.length >= MAX_MESSAGES_PER_WINDOW) {
      console.log('Rate limit exceeded for conversation:', conversation_id);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please wait a moment before sending more messages.',
          retryAfter: 60
        }),
        { status: 429, headers: { ...corsHeaders, 'Retry-After': '60', 'Content-Type': 'application/json' } }
      );
    }

    // Check minimum interval between messages
    if (recentMessages && recentMessages.length > 0) {
      const lastMessageTime = new Date(recentMessages[0].created_at).getTime();
      const timeSinceLastMessage = Date.now() - lastMessageTime;
      
      if (timeSinceLastMessage < MIN_MESSAGE_INTERVAL_MS) {
        const retryAfter = Math.ceil((MIN_MESSAGE_INTERVAL_MS - timeSinceLastMessage) / 1000);
        console.log('Message sent too quickly, retry after:', retryAfter);
        return new Response(
          JSON.stringify({ 
            error: 'Please wait a moment between messages.',
            retryAfter
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch conversation history and metadata
    let conversationMessages: string[] = [];
    let offersShown: string[] = [];
    let detectedPersona: string | null = null;
    
    if (conversation_id) {
      // Get conversation metadata
      const { data: convData } = await supabase
        .from('conversations')
        .select('offers_shown, detected_persona')
        .eq('id', conversation_id)
        .maybeSingle();
      
      offersShown = convData?.offers_shown || [];
      detectedPersona = convData?.detected_persona || null;
      
      // Get previous messages for context and pattern detection
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
    
    // Add current question to messages for pattern detection
    conversationMessages.push(question);

    // Fetch system prompt from settings
    const { data: settings } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_name', 'system_prompt')
      .eq('is_active', true)
      .maybeSingle()

    const systemPrompt = settings?.setting_value || 'You are SignMaker.ai, a helpful assistant for the sign industry. You help with signage and fabrication questions including channel letters, monument signs, materials, LED lighting, pricing, and installation.'

    // Determine if user is a shopper (either by intent OR experience level selection)
    const isShopperByIntent = user_context?.intent === 'shopping';
    const isShopperByExperience = user_context?.experience_level === 'shopper';
    const isShopperUser = isShopperByIntent || isShopperByExperience;

    // Track message count for shopper referral offer
    const messageCount = conversationMessages.length;

    // Special handling for shoppers (sign buyers)
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

${isShopperUser ? '' : 'Adapt your response based on their experience level and intent. For beginners, explain concepts more thoroughly. For veterans, be more technical and concise.'}`

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
        messages: [{ role: 'user', content: question }]
      })
    })

    const data = await response.json()
    
    console.log('Claude API response status:', response.status)

    if (data.error) {
      console.error('Claude API error:', data.error)
      throw new Error(data.error.message)
    }

    let assistantResponse = data.content[0].text

    // Check if AI response contains SignExperts.ai referral
    const containsSignExpertsReferral = assistantResponse.toLowerCase().includes('signexperts.ai') || 
                                         assistantResponse.toLowerCase().includes('sign experts');
    
    // Log SignExperts.ai referral if detected in response for shopper users
    if (isShopperUser && containsSignExpertsReferral && conversation_id) {
      console.log('Logging SignExperts.ai referral for shopper user');
      await supabase.from('signexperts_referrals').insert({
        user_id: conversation?.user_id || null,
        conversation_id: conversation_id,
        referral_type: 'signexperts',
        referral_context: question.substring(0, 500), // Store what they were asking about
        user_response: 'pending' // Will be updated if they respond
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
        
        // Log shopper offer as a referral opportunity
        if (offer.offerType === 'shopper' && conversation_id) {
          console.log('Logging pattern-based shopper referral offer');
          await supabase.from('signexperts_referrals').insert({
            user_id: conversation?.user_id || null,
            conversation_id: conversation_id,
            referral_type: 'pattern_detected',
            referral_context: 'User showed shopper patterns: ' + question.substring(0, 300),
            user_response: 'pending'
          });
        }
        
        // Determine detected persona based on highest pattern count
        const maxPattern = Math.max(patterns.shopper, patterns.owner, patterns.installer);
        if (maxPattern >= 2) {
          if (patterns.shopper === maxPattern) detectedPersona = 'shopper';
          else if (patterns.owner === maxPattern) detectedPersona = 'owner';
          else if (patterns.installer === maxPattern) detectedPersona = 'installer';
        }
      }
    }

    // Save messages to database if conversation_id provided
    if (conversation_id) {
      console.log('Saving messages to database...')
      
      await supabase.from('messages').insert({
        conversation_id,
        role: 'user',
        content: question
      })

      await supabase.from('messages').insert({
        conversation_id,
        role: 'assistant',
        content: assistantResponse
      })
      
      // Update conversation with offers shown and detected persona
      await supabase
        .from('conversations')
        .update({ 
          offers_shown: offersShown,
          detected_persona: detectedPersona
        })
        .eq('id', conversation_id);
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