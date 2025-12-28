-- Add shortcut_selected column to conversations for analytics
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS shortcut_selected TEXT;

-- Add topic_focus to users for professionals
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS topic_focus TEXT;

-- Add services array to users for freelancers
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS services TEXT[];