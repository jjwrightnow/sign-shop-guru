-- First, let's clean up duplicate users by keeping only the most recent one for each email
-- Delete older duplicates (keeping the most recent by created_at)
DELETE FROM public.users a
USING public.users b
WHERE a.email = b.email
  AND a.created_at < b.created_at;

-- Now add unique constraint on email
ALTER TABLE public.users
ADD CONSTRAINT users_email_unique UNIQUE (email);