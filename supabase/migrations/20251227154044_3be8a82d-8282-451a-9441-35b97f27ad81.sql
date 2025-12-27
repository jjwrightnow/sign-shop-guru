-- Drop all permissive RLS policies on sensitive tables
-- These tables will only be accessible via Edge Functions using service role key

-- USERS TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Allow public user registration" ON public.users;

-- MESSAGES TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Allow message read" ON public.messages;
DROP POLICY IF EXISTS "Allow message insert" ON public.messages;

-- CONVERSATIONS TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Allow conversation read" ON public.conversations;
DROP POLICY IF EXISTS "Allow conversation creation" ON public.conversations;
DROP POLICY IF EXISTS "Allow conversation update" ON public.conversations;

-- REFERRALS TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Users can submit referrals" ON public.referrals;

-- B2B_INQUIRIES TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Users can submit b2b inquiries" ON public.b2b_inquiries;

-- PARTNERS TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Allow partner read" ON public.partners;

-- SIGNEXPERTS_REFERRALS TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Allow referral read" ON public.signexperts_referrals;
DROP POLICY IF EXISTS "Allow referral insert" ON public.signexperts_referrals;

-- USER_CONTEXT TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Allow user context read" ON public.user_context;
DROP POLICY IF EXISTS "Allow user context insert" ON public.user_context;
DROP POLICY IF EXISTS "Allow user context update" ON public.user_context;

-- SETTINGS TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Allow settings read" ON public.settings;

-- USAGE_STATS TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Allow usage stats read" ON public.usage_stats;
DROP POLICY IF EXISTS "Allow usage stats insert" ON public.usage_stats;
DROP POLICY IF EXISTS "Allow usage stats update" ON public.usage_stats;

-- FEEDBACK TABLE: Drop overly permissive policies
DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback;

-- Ensure RLS is still enabled on all tables (but with no public access now)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signexperts_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;