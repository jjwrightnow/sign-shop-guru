-- Add transcript tracking columns to conversations table
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS transcript_offered BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS transcript_emailed BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS transcript_emailed_at TIMESTAMP WITH TIME ZONE;