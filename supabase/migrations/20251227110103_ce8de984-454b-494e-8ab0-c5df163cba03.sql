-- Create table to track SignExperts.ai referrals
CREATE TABLE public.signexperts_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  conversation_id UUID REFERENCES public.conversations(id),
  referral_type TEXT NOT NULL DEFAULT 'signexperts', -- Type of referral
  referral_context TEXT, -- What the user was asking about when referred
  user_response TEXT, -- Did they accept the referral? 'accepted', 'declined', 'no_response'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signexperts_referrals ENABLE ROW LEVEL SECURITY;

-- Allow inserts from edge functions (no direct client access needed)
-- RLS with no policies means only service_role can access (via edge functions)

-- Add index for querying by conversation
CREATE INDEX idx_signexperts_referrals_conversation ON public.signexperts_referrals(conversation_id);
CREATE INDEX idx_signexperts_referrals_user ON public.signexperts_referrals(user_id);
CREATE INDEX idx_signexperts_referrals_created ON public.signexperts_referrals(created_at DESC);