-- Enable RLS on tables that might not have it yet
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signexperts_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- MESSAGES: Allow read/insert via edge functions (service role bypasses RLS)
-- Public can read messages in their conversations
CREATE POLICY "Allow message read" 
ON public.messages 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow message insert" 
ON public.messages 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- PARTNERS: Public can read active partners for referral matching
CREATE POLICY "Allow partner read" 
ON public.partners 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- SETTINGS: Public can read active settings
CREATE POLICY "Allow settings read" 
ON public.settings 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- USER_CONTEXT: Allow read/write for user context (edge functions handle user validation)
CREATE POLICY "Allow user context read" 
ON public.user_context 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow user context insert" 
ON public.user_context 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow user context update" 
ON public.user_context 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- SIGNEXPERTS_REFERRALS: Allow inserts for referral tracking
CREATE POLICY "Allow referral insert" 
ON public.signexperts_referrals 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow referral read" 
ON public.signexperts_referrals 
FOR SELECT 
TO anon, authenticated
USING (true);

-- USAGE_STATS: Allow insert/update for tracking (edge functions handle this)
CREATE POLICY "Allow usage stats insert" 
ON public.usage_stats 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow usage stats update" 
ON public.usage_stats 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow usage stats read" 
ON public.usage_stats 
FOR SELECT 
TO anon, authenticated
USING (true);