
-- Add missing columns to existing companies table
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#1a1a1a',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS bot_avatar_url text,
  ADD COLUMN IF NOT EXISTS email_from_name text,
  ADD COLUMN IF NOT EXISTS email_from_address text DEFAULT 'notify@mail.signmaker.ai',
  ADD COLUMN IF NOT EXISTS email_reply_to text,
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
