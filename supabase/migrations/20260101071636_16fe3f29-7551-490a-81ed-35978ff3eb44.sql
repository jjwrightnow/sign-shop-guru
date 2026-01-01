-- Create mode_keywords table for tuning routing weights without code deployments
CREATE TABLE IF NOT EXISTS public.mode_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode IN ('learn', 'specs', 'quote', 'manufacturers')),
  keyword text NOT NULL,
  weight integer DEFAULT 1,
  match_type text DEFAULT 'word' CHECK (match_type IN ('word', 'phrase', 'regex')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_mode_keywords_mode ON public.mode_keywords(mode);
CREATE INDEX IF NOT EXISTS idx_mode_keywords_active ON public.mode_keywords(is_active);

-- Enable Row Level Security
ALTER TABLE public.mode_keywords ENABLE ROW LEVEL SECURITY;

-- Everyone can read mode keywords
CREATE POLICY "Mode keywords are publicly readable" ON public.mode_keywords
  FOR SELECT USING (true);

-- Only platform admins can manage keywords
CREATE POLICY "Platform admins can insert keywords" ON public.mode_keywords
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins can update keywords" ON public.mode_keywords
  FOR UPDATE USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins can delete keywords" ON public.mode_keywords
  FOR DELETE USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Seed initial keywords for mode routing
INSERT INTO public.mode_keywords (mode, keyword, weight, match_type) VALUES
-- Manufacturers signals
('manufacturers', 'who makes', 4, 'phrase'),
('manufacturers', 'who manufactures', 4, 'phrase'),
('manufacturers', 'where to buy', 4, 'phrase'),
('manufacturers', 'where can i get', 4, 'phrase'),
('manufacturers', 'source for', 3, 'phrase'),
('manufacturers', 'who sells', 4, 'phrase'),
('manufacturers', 'supplier', 3, 'word'),
('manufacturers', 'manufacturer', 3, 'word'),
('manufacturers', 'vendor', 3, 'word'),
-- Specs signals
('specs', 'what size', 3, 'phrase'),
('specs', 'how thick', 3, 'phrase'),
('specs', 'thickness', 3, 'word'),
('specs', 'gauge', 3, 'word'),
('specs', 'dimensions', 3, 'word'),
('specs', 'depth', 2, 'word'),
('specs', 'stroke width', 3, 'phrase'),
('specs', 'minimum', 2, 'word'),
('specs', 'maximum', 2, 'word'),
('specs', 'specification', 3, 'word'),
-- Quote signals
('quote', 'price', 3, 'word'),
('quote', 'pricing', 3, 'word'),
('quote', 'cost', 3, 'word'),
('quote', 'how much', 3, 'phrase'),
('quote', 'estimate', 3, 'word'),
('quote', 'order', 2, 'word'),
('quote', 'buy', 2, 'word'),
('quote', 'purchase', 2, 'word'),
('quote', 'quote', 3, 'word'),
-- Weak product terms (shouldn't override vendor intent)
('specs', 'channel letter', 1, 'phrase'),
('specs', 'dimensional letter', 1, 'phrase'),
('specs', 'monument sign', 1, 'phrase'),
('specs', 'pylon', 1, 'word'),
('specs', 'cabinet sign', 1, 'phrase'),
('specs', 'led module', 1, 'phrase'),
('specs', 'halo lit', 1, 'phrase'),
('specs', 'face lit', 1, 'phrase'),
('specs', 'raceway', 1, 'word');