-- Add new columns to users table for sign buyer leads
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS project_type TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timeline TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS contacted BOOLEAN DEFAULT FALSE;