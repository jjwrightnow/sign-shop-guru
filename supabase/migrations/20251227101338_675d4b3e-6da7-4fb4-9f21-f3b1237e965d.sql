-- Fix RLS policies for users and conversations tables

-- 1. Drop the overly permissive SELECT policy on conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

-- 2. The users table currently has no SELECT policy, which is correct - no direct access
-- The conversations table now has no SELECT policy - access only via edge functions

-- 3. Ensure messages table has no policies (already the case, but verify RLS is enabled)
-- Messages accessed only via get-messages edge function with service_role