import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Lead capture markers
const MARKERS = {
  REFERRAL_FORM: '[REFERRAL_FORM]',
  REFERRAL_SUBMIT: '[REFERRAL_SUBMIT]',
  B2B_FORM: '[B2B_FORM]',
  B2B_SUBMIT: '[B2B_SUBMIT]',
  TRANSCRIPT_OFFER: '[TRANSCRIPT_OFFER]',
  TRANSCRIPT_SEND: '[TRANSCRIPT_SEND]'
};

// Closing phrases that trigger transcript offer
const CLOSING_PHRASES = [
  'thanks', 'thank you', 'thats all', 'bye', 'goodbye', 
  'that helps', 'perfect', 'got it', 'appreciate it', 
  'great help', 'very helpful', 'exactly what i needed'
];

// Phrases indicating user wants transcript
const TRANSCRIPT_YES_PHRASES = [
  'yes', 'sure', 'please', 'send it', 'email it', 
  'that would be great', 'sounds good',
  'go ahead', 'absolutely', 'definitely', 'yeah'
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
      from: "SignMaker.ai <notifications@signmaker.ai>",
      reply_to: "ask@signmaker.ai",
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

// Extract referral data from conversation history
// NOTE: We do NOT collect phone numbers - all contact is via email only
function extractReferralData(messages: { role: string; content: string }[]): {
  location_city?: string;
  location_state?: string;
  project_type?: string;
  timeline?: string;
  email?: string;
  timezone?: string;
  notes?: string;
} {
  const data: any = {};
  const allUserText = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
  
  // State patterns
  const statePatterns = [
    /(?:in|from|located in|live in|i'm in|i am in)\s+([A-Za-z\s]+),?\s*(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)/i,
    /([A-Za-z\s]+),\s*(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)/i
  ];
  
  for (const pattern of statePatterns) {
    const match = allUserText.match(pattern);
    if (match) {
      data.location_city = match[1]?.trim();
      data.location_state = match[2]?.trim();
      break;
    }
  }
  
  // Email pattern
  const emailMatch = allUserText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) data.email = emailMatch[1];
  
  // NOTE: We do NOT collect phone numbers - all contact is via email only
  
  // Timeline patterns
  const timelinePatterns = [
    /(?:timeline|need it|looking for|within|by)\s*(?:is\s+)?([^.!?\n]+(?:week|month|day|asap|soon|rush|urgent)[^.!?\n]*)/i,
    /(asap|as soon as possible|rush|urgent|immediately|right away)/i,
    /(\d+[-\s]?\d*\s*(?:week|month|day)s?)/i
  ];
  for (const pattern of timelinePatterns) {
    const match = allUserText.match(pattern);
    if (match) {
      data.timeline = match[1]?.trim();
      break;
    }
  }
  
  // Project type patterns
  const projectPatterns = [
    /(?:looking for|need|want|interested in)\s+(?:a\s+)?([^.!?\n]*(?:sign|letter|monument|banner|wrap|neon|led|display)[^.!?\n]*)/i,
    /(channel letter|monument sign|banner|vehicle wrap|neon sign|led sign|dimensional letter|building sign|storefront|pylon)/i
  ];
  for (const pattern of projectPatterns) {
    const match = allUserText.match(pattern);
    if (match) {
      data.project_type = match[1]?.trim();
      break;
    }
  }
  
  // NOTE: We do NOT collect phone numbers or offer phone calls
  // All contact is via email only to ensure clear written communication
  
  // Timezone patterns
  const timezonePatterns = [
    /(eastern|pacific|central|mountain)\s*(?:time|timezone|tz)?/i,
    /(EST|PST|CST|MST|EDT|PDT|CDT|MDT)/i,
    /(?:timezone|time zone|tz)\s*(?:is\s+)?([A-Za-z]+)/i
  ];
  for (const pattern of timezonePatterns) {
    const match = allUserText.match(pattern);
    if (match) {
      data.timezone = match[1]?.trim().toUpperCase();
      break;
    }
  }
  
  // Notes - last substantial user message as context
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length > 0) {
    const relevantMessages = userMessages.slice(-3).map(m => m.content).join(' ');
    data.notes = relevantMessages.substring(0, 500);
  }
  
  return data;
}

// Extract B2B data from conversation history
function extractB2BData(messages: { role: string; content: string }[]): {
  company_name?: string;
  role?: string;
  contact_info?: string;
  interest_type?: string;
  goals?: string;
} {
  const data: any = {};
  const allUserText = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
  
  // Company name patterns
  const companyPatterns = [
    /(?:company|business|shop|we are|i work (?:at|for)|from)\s+(?:is\s+)?(?:called\s+)?["']?([A-Za-z0-9\s&'.,-]+?)["']?\s*(?:and|,|\.|$)/i,
    /([A-Za-z0-9\s&'.,-]+?)\s+(?:sign(?:s)?|graphics|printing|company)/i
  ];
  for (const pattern of companyPatterns) {
    const match = allUserText.match(pattern);
    if (match && match[1].length > 2 && match[1].length < 100) {
      data.company_name = match[1]?.trim();
      break;
    }
  }
  
  // Role patterns
  const rolePatterns = [
    /(?:i am|i'm|my role is|work as)\s+(?:a\s+|an\s+|the\s+)?([A-Za-z\s]+(?:owner|manager|director|ceo|president|founder|vp|supervisor|coordinator))/i,
    /(owner|manager|director|ceo|president|founder|vp|supervisor|coordinator)/i
  ];
  for (const pattern of rolePatterns) {
    const match = allUserText.match(pattern);
    if (match) {
      data.role = match[1]?.trim();
      break;
    }
  }
  
  // Contact info - email only (we don't collect phone numbers)
  const emailMatch = allUserText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) data.contact_info = emailMatch[1];
  
  // Interest type
  const interestPatterns = [
    /(training|train my team|staff training|employee training)/i,
    /(customer[- ]facing|sales tool|website|embed|widget)/i,
    /(white[- ]label|api|integration|licensing)/i,
    /(both|training and customer)/i
  ];
  for (const pattern of interestPatterns) {
    const match = allUserText.match(pattern);
    if (match) {
      if (/training/i.test(match[1])) data.interest_type = 'training';
      else if (/customer|sales|website|embed/i.test(match[1])) data.interest_type = 'customer-facing';
      else if (/white|api|integration|licensing/i.test(match[1])) data.interest_type = 'licensing';
      else if (/both/i.test(match[1])) data.interest_type = 'both';
      break;
    }
  }
  
  // Goals - extract from conversation context
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length > 0) {
    const relevantMessages = userMessages.slice(-3).map(m => m.content).join(' ');
    data.goals = relevantMessages.substring(0, 500);
  }
  
  return data;
}

// Clean all markers from response before showing to user
function cleanAllMarkers(response: string): string {
  return response
    .replace(/\[REFERRAL_FORM\]/g, '')
    .replace(/\[REFERRAL_SUBMIT\]/g, '')
    .replace(/\[B2B_FORM\]/g, '')
    .replace(/\[B2B_SUBMIT\]/g, '')
    .replace(/\[TRANSCRIPT_OFFER\]/g, '')
    .replace(/\[TRANSCRIPT_SEND\]/g, '')
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

// ========== SCORING-BASED MODE DETECTION ==========
// Known manufacturer names for auto-detection
const MANUFACTURER_NAMES = [
  'gemini', 'grimco', 'tsf', 'signage factory', 'federal heath', 'daktronics',
  'watchfire', 'sloanled', 'principal led', 'bitro', 'signcomp', 'jones sign',
  'apco', 'matthews', 'woodland', 'poblocki', 'signall', 'visotec'
];

interface ModeScores {
  quote: number;
  manufacturers: number;
  specs: number;
  learn: number;
}

// Scoring-based mode detection (replaces first-match regex)
function detectMode(question: string): { mode: string; scores: ModeScores } {
  const q = question.toLowerCase();
  const scores: ModeScores = { quote: 0, manufacturers: 0, specs: 0, learn: 0 };
  
  // QUOTE signals (strong)
  if (/\b(quote|pricing|price|cost|how much|estimate|order|buy|purchase)\b/.test(q)) {
    scores.quote += 3;
  }
  
  // MANUFACTURERS signals (strong)
  if (/\b(who makes|who manufactures|manufacturer|vendor|supplier|where to buy|where can i get|source for|who sells)\b/.test(q)) {
    scores.manufacturers += 4;
  }
  
  // Check for known manufacturer names
  if (MANUFACTURER_NAMES.some(n => q.includes(n))) {
    scores.manufacturers += 3;
  }
  
  // SPECS signals (strong)
  if (/\b(spec|specs|specification|what size|how thick|thickness|gauge|dimensions|depth|stroke width|min(imum)?|max(imum)?)\b/.test(q)) {
    scores.specs += 3;
  }
  
  // Product terms (weak - don't let them override vendor intent)
  if (/\b(channel letter|dimensional letter|monument sign|pylon|cabinet sign|led module|halo lit|face lit|raceway)\b/.test(q)) {
    scores.specs += 1;
  }
  
  // Determine winner
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0][0];
  const topScore = sorted[0][1];
  
  // If all scores are zero, default to learn
  if (topScore === 0) return { mode: 'learn', scores };
  
  // Only redirect to quote if clearly dominant (score >= 3 AND beats others by 2+)
  if (winner === 'quote' && scores.quote >= 3 && 
      scores.quote >= scores.specs + 2 && 
      scores.quote >= scores.manufacturers + 2) {
    return { mode: 'quote', scores };
  }
  
  // If quote won but not dominant, demote to learn (safer)
  if (winner === 'quote') return { mode: 'learn', scores };
  
  return { mode: winner, scores };
}

// Keyword extraction for selective data queries
function extractKeywords(question: string): string[] {
  const stopWords = ['who', 'makes', 'manufacturer', 'vendor', 'supplier', 'where', 
    'buy', 'get', 'can', 'i', 'a', 'the', 'for', 'to', 'what', 'is', 'are', 'how',
    'do', 'does', 'about', 'tell', 'me', 'explain'];
  
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !stopWords.includes(w))
    .slice(0, 6);
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
    const { question, mode, user_context, conversation_id } = await req.json()

    console.log('Received chat request:', { question: question?.substring(0, 50), mode, conversation_id })

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

    // Verify conversation exists and get user_id + form tracking state
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user_id, offers_shown, detected_persona, referral_pending, referral_completed, b2b_pending, b2b_completed, transcript_offered, transcript_emailed')
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
        .select('id, name, email, messages_today, last_message_date, last_message_at, tier, off_topic_count, spam_flags')
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
    let fullConversationHistory: { role: string; content: string }[] = [];
    let offersShown: string[] = [];
    let detectedPersona: string | null = null;
    let referralPending = conversation?.referral_pending || false;
    let referralCompleted = conversation?.referral_completed || false;
    let b2bPending = conversation?.b2b_pending || false;
    let b2bCompleted = conversation?.b2b_completed || false;
    let transcriptOffered = conversation?.transcript_offered || false;
    let transcriptEmailed = conversation?.transcript_emailed || false;
    
    offersShown = conversation?.offers_shown || [];
    detectedPersona = conversation?.detected_persona || null;
    
    if (conversation_id) {
      // Get ALL messages for data extraction
      const { data: prevMessages } = await supabase
        .from('messages')
        .select('content, role')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true });
      
      if (prevMessages) {
        fullConversationHistory = prevMessages.map(m => ({ role: m.role, content: m.content }));
        conversationMessages = prevMessages.filter(m => m.role === 'user').map(m => m.content);
      }
    }
    
    conversationMessages.push(trimmedQuestion);
    fullConversationHistory.push({ role: 'user', content: trimmedQuestion });

    // Fetch system prompt from settings
    const { data: settings } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_name', 'system_prompt')
      .eq('is_active', true)
      .maybeSingle()

    const systemPrompt = settings?.setting_value || 'You are SignMaker.ai, a helpful assistant for the sign industry. You help with signage and fabrication questions including channel letters, monument signs, materials, LED lighting, pricing, and installation.'

    // Fetch suggested follow-ups based on question keywords with A/B testing
    const questionLower = trimmedQuestion.toLowerCase();
    let followupContext = '';
    let selectedFollowupId: string | null = null;
    let selectedVariant: string = 'control';
    
    const { data: followups } = await supabase
      .from('suggested_followups')
      .select('id, trigger_keywords, followup_questions, category, variant_group, usage_count, impression_count')
      .eq('is_active', true);
    
    if (followups) {
      // Find all matching followups (could have multiple variants)
      const matchedFollowups = followups.filter(f => 
        f.trigger_keywords?.some((kw: string) => questionLower.includes(kw.toLowerCase()))
      );
      
      let matchedFollowup = null;
      
      if (matchedFollowups.length > 0) {
        // Group by category to find variants
        const categories = [...new Set(matchedFollowups.map(f => f.category))];
        
        for (const category of categories) {
          const variants = matchedFollowups.filter(f => f.category === category);
          
          if (variants.length > 1) {
            // A/B test: randomly select a variant (weighted by variant_group)
            const controlVariant = variants.find(v => v.variant_group === 'control');
            const testVariants = variants.filter(v => v.variant_group !== 'control');
            
            // 50/50 split between control and test variants
            if (Math.random() < 0.5 && controlVariant) {
              matchedFollowup = controlVariant;
            } else if (testVariants.length > 0) {
              // Random selection among test variants
              matchedFollowup = testVariants[Math.floor(Math.random() * testVariants.length)];
            } else {
              matchedFollowup = controlVariant;
            }
          } else {
            matchedFollowup = variants[0];
          }
          
          if (matchedFollowup) break;
        }
      }
      
      if (matchedFollowup) {
        selectedFollowupId = matchedFollowup.id;
        selectedVariant = matchedFollowup.variant_group || 'control';
        
        followupContext = `\n\nSUGGESTED FOLLOW-UPS FOR THIS TOPIC (${matchedFollowup.category}):\n${matchedFollowup.followup_questions.map((q: string) => `→ ${q}`).join('\n')}\n\nInclude 2-3 of these as clickable options at the end of your response, formatted as:\n→ [Question]`;
        
        // Update usage count and impression count
        await supabase.from('suggested_followups')
          .update({ 
            usage_count: (matchedFollowup.usage_count || 0) + 1,
            impression_count: (matchedFollowup.impression_count || 0) + 1 
          })
          .eq('id', matchedFollowup.id);
      } else {
        followupContext = '\n\nEnd your response with 2-3 relevant follow-up questions formatted as:\n→ [Question]';
      }
    }

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

    // ========== MODE DETECTION & CONTEXT ==========
    let modeContext = '';
    let detectedModeResult = { mode: 'learn', scores: { quote: 0, manufacturers: 0, specs: 0, learn: 0 } };
    
    // If no mode provided or mode is 'learn', attempt auto-detection
    let chatMode = mode || 'learn';
    if (!mode || mode === 'learn') {
      detectedModeResult = detectMode(trimmedQuestion);
      // Only auto-switch if detection is confident (top score >= 3)
      const topScore = Math.max(...Object.values(detectedModeResult.scores));
      if (topScore >= 3) {
        chatMode = detectedModeResult.mode;
        console.log('Auto-detected mode:', chatMode, 'scores:', detectedModeResult.scores);
      }
    }
    
    // Extract keywords for selective queries
    const keywords = extractKeywords(trimmedQuestion);
    console.log('Extracted keywords:', keywords);
    
    switch (chatMode) {
      case 'specs':
        // Only fetch relevant profiles based on keywords, not entire table
        const { data: specsData } = await supabase
          .from('products_full')
          .select('name, manufacturer_name, materials, depth_options, height_min, height_max, led_options, finishes, category, profile_name')
          .eq('is_active', true)
          .limit(20);
        
        if (specsData && specsData.length > 0) {
          modeContext = `\n\nMODE: PRODUCT SPECIFICATIONS
You have access to detailed product specs. Reference this data when answering:

AVAILABLE PRODUCTS:
${specsData.map((p: any) => 
  `- ${p.name} (${p.manufacturer_name || 'Unknown'}): ${p.category || 'General'}, Profile: ${p.profile_name || 'N/A'}, Heights: ${p.height_min || '?'}-${p.height_max || '?'}", Materials: ${(p.materials || []).join(', ') || 'N/A'}`
).slice(0, 15).join('\n')}

Be specific about dimensions, materials, and options when answering.`;
        }
        break;
        
      case 'suppliers':
      case 'manufacturers':
        // Build keyword-based search for manufacturers
        let manufacturerQuery = supabase
          .from('manufacturers')
          .select('name, entity_name, headquarters_location, products_manufactured, region, category, notes, website')
          .eq('status', 'Active');
        
        // If we have keywords, try to filter by products_manufactured
        if (keywords.length > 0) {
          const searchTerms = keywords.map(k => `products_manufactured.ilike.%${k}%`).join(',');
          manufacturerQuery = manufacturerQuery.or(searchTerms);
        }
        
        const { data: manufacturers } = await manufacturerQuery.limit(15);
        
        if (manufacturers && manufacturers.length > 0) {
          modeContext = `\n\nMODE: SUPPLIERS & MANUFACTURERS
Provide neutral, factual information about manufacturers. DO NOT rank or recommend specific brands.

RELEVANT MANUFACTURERS:
${manufacturers.map((m: any) => 
  `- ${m.entity_name || m.name} (${m.region || 'Unknown Region'}): ${m.products_manufactured || m.notes || 'No description available'}`
).join('\n')}

Remember: Stay neutral. Acknowledge they exist, describe their focus, but never say "X is the best" or compare quality.`;
        } else {
          // Fallback to all active manufacturers
          const { data: allMfrs } = await supabase
            .from('manufacturers')
            .select('name, entity_name, region, products_manufactured, notes')
            .eq('status', 'Active')
            .limit(10);
          
          if (allMfrs && allMfrs.length > 0) {
            modeContext = `\n\nMODE: SUPPLIERS & MANUFACTURERS
Provide neutral, factual information about manufacturers. DO NOT rank or recommend specific brands.

KNOWN MANUFACTURERS:
${allMfrs.map((m: any) => 
  `- ${m.entity_name || m.name}: ${m.products_manufactured || m.notes || 'No description available'}`
).join('\n')}

Remember: Stay neutral. Acknowledge they exist, describe their focus, but never say "X is the best" or compare quality.`;
          }
        }
        break;
        
      case 'quote':
        // Quote mode - don't fetch data, will show redirect card on frontend
        modeContext = `\n\nMODE: QUOTE REQUEST
The user is asking about pricing/quotes. Briefly acknowledge their interest and let them know they can get a custom quote at FastLetter.bot. Don't try to provide specific pricing - redirect them to the quote tool.`;
        break;
        
      case 'learn':
      default:
        modeContext = `\n\nMODE: EDUCATION
Focus on teaching concepts clearly. No product lookups needed - use your knowledge to explain signs, materials, processes, and industry concepts.`;
        break;
    }

    // REACTIVE ONLY - Only help with referrals/B2B when user explicitly asks
    const referralGuidance = referralPending ? `

REFERRAL IN PROGRESS:
User has requested a referral. Continue collecting:
- Location (city/state)
- Project type
- Timeline
- Email address

NOTE: We do NOT collect phone numbers. All contact is via email only.

After they provide info, include [REFERRAL_SUBMIT] marker and confirm.
` : '';

    const b2bGuidance = b2bPending ? `

B2B INQUIRY IN PROGRESS:
User asked about business use. Continue collecting:
- Company name
- Their role
- Contact info
- Goals (training, customer-facing, or both)

After they provide info, include [B2B_SUBMIT] marker and confirm.
` : '';

    // REACTIVE TRIGGERS - Only if user explicitly asks
    const reactiveHelp = `

REACTIVE OFFERS ONLY:
DO NOT proactively offer referrals, B2B, or any sales. 

ONLY use markers if user EXPLICITLY asks:
- [REFERRAL_FORM] - ONLY if user says "recommend a sign company", "find someone to make this", "connect me with a pro", "where can I get this made", etc.
- [B2B_FORM] - ONLY if user asks about API, embedding, white-label, training tool, or business use

If user just asks educational questions, answer them WITHOUT offering services.
`;

    const customContextSection = userTrainingContext ? `

USER'S CUSTOM CONTEXT:
${userTrainingContext}
- Use this to personalize answers
- Reference their equipment/materials when relevant` : '';

    const contextualPrompt = `${systemPrompt}

RESPONSE STYLE - CRITICAL:
1. BE BRIEF
   - Simple questions: 1-2 sentences max
   - Complex questions: 3-4 sentences max
   - Never more than 5 sentences unless user explicitly asks for detail

2. ANSWER FIRST
   - Lead with the direct answer
   - No preamble, no "Great question!"
   - No restating the question

3. FOLLOW-UP PROMPTS
   - After every answer, offer 2-3 clickable follow-up options
   - Format as: "→ [Follow-up question]"
   - Make them specific to what was just discussed

USER CONTEXT:
Name: ${user_context?.name || 'Unknown'}
Experience: ${user_context?.experience_level || 'Unknown'}
Intent: ${user_context?.intent || 'Unknown'}
Messages: ${messageCount}
${modeContext}
${customContextSection}
${referralGuidance}
${b2bGuidance}
${reactiveHelp}
${followupContext}

MARKER RULES:
- [REFERRAL_FORM] = asking for referral details
- [REFERRAL_SUBMIT] = user provided referral info, submit it
- [B2B_FORM] = asking for B2B details  
- [B2B_SUBMIT] = user provided B2B info, submit it
- Markers are stripped from responses automatically`

    // ========== IMAGE SEARCH FOR VISUAL REQUESTS ==========
    let imageContext = '';
    const wantsVisuals = /show me|example|what does|look like|looks like|inspiration|ideas|pictures|images|photo|visual/i.test(trimmedQuestion);
    
    if (wantsVisuals) {
      console.log('User wants visual examples, searching for images...');
      
      // Extract topic from question (remove common phrases)
      const topic = trimmedQuestion
        .replace(/show me|example of|what does|look like|looks like|pictures of|images of|photos of|can you show|I want to see/gi, '')
        .trim();
      
      try {
        // Search for images via edge function
        const imageResponse = await fetch(`${supabaseUrl}/functions/v1/search-images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: topic, count: 2 })
        });
        
        const imageData = await imageResponse.json();
        const imageResults = imageData.images || [];
        
        if (imageResults.length > 0) {
          console.log('Found', imageResults.length, 'images for topic:', topic);
          imageContext = `\n\nIMAGES FOUND (Creative Commons licensed, safe to share):\n${imageResults.map((img: any) => `- ${img.title}: ${img.url} (source: ${img.source})`).join('\n')}\n\nInclude ONE relevant image naturally in your response using format:\n[See example](IMAGE_URL)\n*Source: source_domain*`;
        } else {
          console.log('No images found for topic:', topic);
        }
      } catch (imgError) {
        console.error('Image search error:', imgError);
        // Continue without images
      }
    }

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
        system: contextualPrompt + imageContext,
        messages: [
          ...(fullConversationHistory || [])
            .slice(-10)
            .filter(msg => msg.role === 'user' || msg.role === 'assistant')
            .map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: String(msg.content)
            })),
          { role: 'user', content: trimmedQuestion }
        ]
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

    // ========== MARKER-BASED LEAD CAPTURE ==========
    
    // Check for [REFERRAL_FORM] marker - AI is asking for referral details
    if (assistantResponse.includes(MARKERS.REFERRAL_FORM) && !referralPending && !referralCompleted) {
      console.log('Referral form initiated');
      referralPending = true;
    }
    
    // Check for [B2B_FORM] marker - AI is asking for B2B details
    if (assistantResponse.includes(MARKERS.B2B_FORM) && !b2bPending && !b2bCompleted) {
      console.log('B2B form initiated');
      b2bPending = true;
    }
    
    // Check for [REFERRAL_SUBMIT] marker - process referral submission (only once per conversation)
    if (assistantResponse.includes(MARKERS.REFERRAL_SUBMIT) && !referralCompleted && conversation?.user_id) {
      console.log('Processing referral submission');
      
      // Extract data from conversation history
      const referralData = extractReferralData(fullConversationHistory);
      console.log('Extracted referral data:', referralData);
      
      // Save to referrals table with dedicated columns
      // NOTE: We do NOT collect phone numbers - all contact is via email only
      const referralRecord = {
        user_id: conversation.user_id,
        conversation_id: conversation_id,
        location_city: referralData.location_city || null,
        location_state: referralData.location_state || null,
        project_type: referralData.project_type || null,
        timeline: referralData.timeline || null,
        phone: null, // We never collect phone numbers
        email: referralData.email || userData?.email || null,
        timezone: referralData.timezone || null,
        preferred_contact: 'email', // Always email - we don't offer phone calls
        best_time_to_call: null, // Not applicable - email only
        notes: referralData.notes || null,
        status: 'new'
      };
      
      const { error: referralError } = await supabase
        .from('referrals')
        .insert(referralRecord);
      
      if (referralError) {
        console.error('Error saving referral:', referralError);
      } else {
        console.log('Referral saved successfully');
        referralCompleted = true;
        referralPending = false;
        
        // Determine best contact info to display - email only
        const contactEmail = referralData.email || userData?.email || 'Not provided';
        const timezone = referralData.timezone || 'Not provided';
        
        // Send email notification to ask@signmaker.ai
        const timestamp = new Date().toISOString();
        await sendNotificationEmail(
          'ask@signmaker.ai',
          `New Referral: ${referralData.project_type || 'Sign Project'}`,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">NEW REFERRAL</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Contact:</td>
                <td style="padding: 8px 0;">${userData?.name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
                <td style="padding: 8px 0;">${contactEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Timezone:</td>
                <td style="padding: 8px 0;">${timezone}</td>
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
            </table>
            
            <p style="color: #888; font-size: 12px;">Submitted: ${timestamp}</p>
            
            <a href="https://signmaker.ai/admin" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #00d4ff; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin</a>
          </div>
          `
        );
      }
    }
    
    // Check for [B2B_SUBMIT] marker - process B2B submission (only once per conversation)
    if (assistantResponse.includes(MARKERS.B2B_SUBMIT) && !b2bCompleted && conversation?.user_id) {
      console.log('Processing B2B submission');
      
      // Extract data from conversation history
      const b2bData = extractB2BData(fullConversationHistory);
      console.log('Extracted B2B data:', b2bData);
      
      // Save to b2b_inquiries table
      const b2bRecord = {
        company_name: b2bData.company_name || null,
        contact_info: b2bData.contact_info || userData?.email || null,
        role: b2bData.role || null,
        interest_type: b2bData.interest_type || null,
        goals: b2bData.goals || null,
        user_id: conversation.user_id,
        conversation_id: conversation_id,
        status: 'new'
      };
      
      const { error: b2bError } = await supabase
        .from('b2b_inquiries')
        .insert(b2bRecord);
      
      if (b2bError) {
        console.error('Error saving B2B inquiry:', b2bError);
      } else {
        console.log('B2B inquiry saved successfully');
        b2bCompleted = true;
        b2bPending = false;
        
        // Send email notification to partners@signmaker.ai
        const timestamp = new Date().toISOString();
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
                <td style="padding: 8px 0;">${userData?.name || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
                <td style="padding: 8px 0;">${b2bData.contact_info || userData?.email || 'Not provided'}</td>
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
            
            <a href="https://signmaker.ai/admin" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #00d4ff; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin</a>
          </div>
          `
        );
      }
    }
    
    // Clean all markers from response before showing to user
    assistantResponse = cleanAllMarkers(assistantResponse);

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

    // KNOWLEDGE GAP DETECTION - Log when AI can't answer well
    const knowledgeGapPhrases = [
      "i don't have specific information",
      "i'm not certain",
      "you should verify",
      "check with a professional",
      "i cannot provide",
      "i don't have access to",
      "i'm not sure about the exact",
      "consult with"
    ];
    
    const responseLower = assistantResponse.toLowerCase();
    const hasKnowledgeGap = knowledgeGapPhrases.some(phrase => responseLower.includes(phrase));
    
    if (hasKnowledgeGap) {
      console.log('Knowledge gap detected, logging question');
      
      // Check if similar question already exists
      const { data: existingGap } = await supabase
        .from('knowledge_gaps')
        .select('id, frequency')
        .ilike('question', `%${trimmedQuestion.substring(0, 50)}%`)
        .maybeSingle();
      
      if (existingGap) {
        // Increment frequency
        await supabase.from('knowledge_gaps')
          .update({ frequency: (existingGap.frequency || 1) + 1 })
          .eq('id', existingGap.id);
      } else {
        // Insert new knowledge gap
        await supabase.from('knowledge_gaps').insert({
          question: trimmedQuestion.substring(0, 500),
          frequency: 1,
          resolved: false
        });
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

    // REMOVED: Automatic pattern detection and proactive offers
    // Pattern detection is now disabled - offers are reactive only
    // The system prompt instructs Claude to only offer when user explicitly asks

    // ========== TRANSCRIPT OFFER DETECTION ==========
    const lowerQuestion = trimmedQuestion.toLowerCase();
    const totalMessages = fullConversationHistory.length + 1; // +1 for current response
    
    // Check if user said yes to transcript offer
    if (transcriptOffered && !transcriptEmailed && conversation?.user_id) {
      const wantsTranscript = TRANSCRIPT_YES_PHRASES.some(phrase => lowerQuestion.includes(phrase));
      
      if (wantsTranscript) {
        console.log('User wants transcript, sending email...');
        
        // Call send-transcript edge function
        const { error: transcriptError } = await supabase.functions.invoke('send-transcript', {
          body: {
            conversation_id: conversation_id,
            user_email: userData?.email,
            user_name: userData?.name || user_context?.name || 'there'
          }
        });
        
        if (!transcriptError) {
          transcriptEmailed = true;
          assistantResponse += `\n\nDone! I've sent a copy to ${userData?.email}. Anything else I can help with?`;
        } else {
          console.error('Error sending transcript:', transcriptError);
        }
      }
    }
    
    // Offer transcript when: 10+ messages AND closing phrase detected AND not already offered
    if (totalMessages >= 10 && !transcriptOffered && !transcriptEmailed) {
      const isClosingPhrase = CLOSING_PHRASES.some(phrase => lowerQuestion.includes(phrase));
      
      if (isClosingPhrase) {
        console.log('Closing phrase detected, offering transcript');
        assistantResponse += "\n\nGlad I could help! Would you like me to email you a copy of this conversation for your records?";
        transcriptOffered = true;
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
          detected_persona: detectedPersona,
          referral_pending: referralPending,
          referral_completed: referralCompleted,
          b2b_pending: b2bPending,
          b2b_completed: b2bCompleted,
          transcript_offered: transcriptOffered,
          transcript_emailed: transcriptEmailed
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