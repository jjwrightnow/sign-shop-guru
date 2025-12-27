-- Add columns to conversations table for offer tracking
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS offers_shown TEXT[];
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS detected_persona TEXT;

-- Create b2b_inquiries table
CREATE TABLE IF NOT EXISTS public.b2b_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  conversation_id UUID REFERENCES public.conversations(id),
  company_name TEXT,
  role TEXT,
  contact_info TEXT,
  interest_type TEXT,
  goals TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.b2b_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all b2b_inquiries" ON public.b2b_inquiries FOR ALL USING (true) WITH CHECK (true);

-- Create partners table
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  location_city TEXT,
  location_state TEXT,
  services TEXT[],
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all partners" ON public.partners FOR ALL USING (true) WITH CHECK (true);

-- Create referrals table for shopper referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  conversation_id UUID REFERENCES public.conversations(id),
  partner_id UUID REFERENCES public.partners(id),
  location_city TEXT,
  location_state TEXT,
  project_type TEXT,
  timeline TEXT,
  phone TEXT,
  best_time_to_call TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all referrals" ON public.referrals FOR ALL USING (true) WITH CHECK (true);