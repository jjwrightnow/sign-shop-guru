import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

function getOffer(patterns: { shopper: number; owner: number; installer: number }, offersShown: string[], currentIntent: string): { offer: string; offerType: string } | null {
  // Don't offer shopper conversion if already a shopper
  if (patterns.shopper >= 2 && currentIntent !== 'shopping' && !offersShown.includes('shopper')) {
    return {
      offer: "\n\n---\n💡 *It sounds like you might be looking to get a sign made. Would you like me to help connect you with a sign professional in your area?*",
      offerType: 'shopper'
    };
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

    console.log('Received chat request:', { question, user_context, conversation_id })

    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY is not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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

    // Special handling for shoppers (sign buyers)
    const isShopperIntent = user_context?.intent === 'shopping';
    const shopperGuidance = isShopperIntent ? `

SPECIAL GUIDANCE FOR SIGN BUYERS:
This user is looking to purchase a sign, not a sign industry professional. Adapt your responses:
- Be helpful but guide toward getting a quote from a professional sign company
- Explain options in buyer-friendly terms, avoid fabricator jargon
- After answering technical questions, consider offering: "Would you like help understanding what to ask sign companies for this project?"
- Don't overwhelm with technical manufacturing details unless they specifically ask
- Focus on: what they'll get, realistic timeline expectations, and questions to ask vendors
- If discussing materials or options, explain the benefits from an end-user perspective` : '';

    const contextualPrompt = `${systemPrompt}

USER CONTEXT:
Name: ${user_context?.name || 'Unknown'}
Experience Level: ${user_context?.experience_level || 'Unknown'}
Intent: ${user_context?.intent || 'Unknown'}
${shopperGuidance}

Adapt your response based on their experience level and intent. For beginners, explain concepts more thoroughly. For veterans, be more technical and concise.`

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

    // Pattern detection after 3+ messages
    if (conversationMessages.length >= 3) {
      const patterns = detectPatterns(conversationMessages);
      console.log('Detected patterns:', patterns);
      
      const offer = getOffer(patterns, offersShown, user_context?.intent || '');
      
      if (offer) {
        assistantResponse += offer.offer;
        offersShown = [...offersShown, offer.offerType];
        
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