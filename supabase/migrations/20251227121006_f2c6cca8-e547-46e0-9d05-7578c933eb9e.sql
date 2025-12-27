-- Add form state tracking columns to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS referral_pending boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS b2b_pending boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS b2b_completed boolean DEFAULT false;