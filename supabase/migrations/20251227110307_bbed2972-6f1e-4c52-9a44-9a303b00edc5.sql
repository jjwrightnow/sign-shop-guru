-- Add rate limiting and tier columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS messages_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_date DATE,
ADD COLUMN IF NOT EXISTS off_topic_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS spam_flags INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;

-- Create index for finding users hitting limits
CREATE INDEX IF NOT EXISTS idx_users_messages_today ON public.users(messages_today DESC);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);

-- Create usage stats table for admin tracking
CREATE TABLE IF NOT EXISTS public.usage_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_api_calls INTEGER DEFAULT 0,
  total_blocked_spam INTEGER DEFAULT 0,
  total_blocked_limit INTEGER DEFAULT 0,
  total_off_topic INTEGER DEFAULT 0,
  estimated_cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Enable RLS on usage_stats (admin-only access via edge functions)
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;