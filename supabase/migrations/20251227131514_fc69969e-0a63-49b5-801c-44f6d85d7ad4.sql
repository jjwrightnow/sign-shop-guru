-- Add email and timezone columns to referrals table
ALTER TABLE public.referrals 
ADD COLUMN email text,
ADD COLUMN timezone text;