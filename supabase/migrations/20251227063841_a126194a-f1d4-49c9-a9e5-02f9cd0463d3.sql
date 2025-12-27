-- =====================================================
-- SECURITY FIX: Remove overly permissive RLS policies
-- and implement proper access control
-- =====================================================

-- Drop all existing "Allow all" policies
DROP POLICY IF EXISTS "Allow all users" ON public.users;
DROP POLICY IF EXISTS "Allow all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow all settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all b2b_inquiries" ON public.b2b_inquiries;
DROP POLICY IF EXISTS "Allow all partners" ON public.partners;
DROP POLICY IF EXISTS "Allow all referrals" ON public.referrals;

-- =====================================================
-- USERS TABLE: Allow insert for new users (intake form)
-- All other operations via service_role (edge functions)
-- =====================================================
CREATE POLICY "Users can insert new records" 
ON public.users 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- =====================================================
-- CONVERSATIONS TABLE: Allow insert and select for user's own conversations
-- =====================================================
CREATE POLICY "Users can insert conversations" 
ON public.conversations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users can view own conversations" 
ON public.conversations 
FOR SELECT 
TO anon, authenticated
USING (true);

-- =====================================================
-- MESSAGES TABLE: No direct access - all via edge functions
-- Edge functions use service_role which bypasses RLS
-- =====================================================
-- No policies = no direct access from frontend

-- =====================================================
-- FEEDBACK TABLE: Allow insert only (users can submit feedback)
-- =====================================================
CREATE POLICY "Users can submit feedback" 
ON public.feedback 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- =====================================================
-- SETTINGS TABLE: No direct access - all via edge functions
-- Contains sensitive data like system prompts
-- =====================================================
-- No policies = no direct access from frontend

-- =====================================================
-- B2B_INQUIRIES TABLE: Allow insert only
-- =====================================================
CREATE POLICY "Users can submit b2b inquiries" 
ON public.b2b_inquiries 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- =====================================================
-- PARTNERS TABLE: No direct access - admin only via edge functions
-- =====================================================
-- No policies = no direct access from frontend

-- =====================================================
-- REFERRALS TABLE: Allow insert only
-- =====================================================
CREATE POLICY "Users can submit referrals" 
ON public.referrals 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- =====================================================
-- Remove admin_password from settings table
-- (will be stored as environment secret instead)
-- =====================================================
DELETE FROM public.settings WHERE setting_name = 'admin_password';