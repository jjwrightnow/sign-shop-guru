-- Add preferred_contact column to referrals table
ALTER TABLE public.referrals 
ADD COLUMN preferred_contact text;