-- Add A/B testing columns to suggested_followups
ALTER TABLE public.suggested_followups 
ADD COLUMN IF NOT EXISTS variant_group TEXT DEFAULT 'control',
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS impression_count INTEGER DEFAULT 0;

-- Create table to track individual follow-up clicks
CREATE TABLE IF NOT EXISTS public.followup_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  followup_id UUID REFERENCES public.suggested_followups(id) ON DELETE CASCADE,
  conversation_id UUID,
  user_id UUID,
  clicked_question TEXT NOT NULL,
  variant_group TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.followup_clicks ENABLE ROW LEVEL SECURITY;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_followup_clicks_followup_id ON public.followup_clicks(followup_id);
CREATE INDEX IF NOT EXISTS idx_followup_clicks_created_at ON public.followup_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_suggested_followups_variant ON public.suggested_followups(variant_group);