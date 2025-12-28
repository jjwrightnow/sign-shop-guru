-- RLS policies for conversations table
CREATE POLICY "Allow public insert" ON public.conversations
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.conversations
FOR SELECT USING (true);

CREATE POLICY "Allow public update" ON public.conversations
FOR UPDATE USING (true);

-- RLS policies for messages table
CREATE POLICY "Allow public insert" ON public.messages
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.messages
FOR SELECT USING (true);

-- RLS policies for feedback table
CREATE POLICY "Allow public insert" ON public.feedback
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.feedback
FOR SELECT USING (true);

-- RLS policies for referrals table
CREATE POLICY "Allow public insert" ON public.referrals
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.referrals
FOR SELECT USING (true);

-- RLS policies for b2b_inquiries table
CREATE POLICY "Allow public insert" ON public.b2b_inquiries
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.b2b_inquiries
FOR SELECT USING (true);

-- RLS policies for user_context table
CREATE POLICY "Allow public insert" ON public.user_context
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.user_context
FOR SELECT USING (true);

CREATE POLICY "Allow public update" ON public.user_context
FOR UPDATE USING (true);

-- RLS policies for followup_clicks table
CREATE POLICY "Allow public insert" ON public.followup_clicks
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.followup_clicks
FOR SELECT USING (true);

-- RLS policies for signexperts_referrals table
CREATE POLICY "Allow public insert" ON public.signexperts_referrals
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.signexperts_referrals
FOR SELECT USING (true);

-- RLS policies for suggested_followups table (read-only for public)
CREATE POLICY "Allow public read" ON public.suggested_followups
FOR SELECT USING (true);

-- RLS policies for knowledge_gaps table (read-only for public)
CREATE POLICY "Allow public read" ON public.knowledge_gaps
FOR SELECT USING (true);

-- RLS policies for conversation_patterns table (read-only for public)
CREATE POLICY "Allow public read" ON public.conversation_patterns
FOR SELECT USING (true);

-- RLS policies for partners table (read-only for public)
CREATE POLICY "Allow public read" ON public.partners
FOR SELECT USING (true);

-- RLS policies for settings table (read-only for public)
CREATE POLICY "Allow public read" ON public.settings
FOR SELECT USING (true);

-- RLS policies for usage_stats table (read-only for public)
CREATE POLICY "Allow public read" ON public.usage_stats
FOR SELECT USING (true);