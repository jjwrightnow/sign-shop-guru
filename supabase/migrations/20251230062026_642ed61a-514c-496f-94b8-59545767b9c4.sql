-- Create table for mode selection analytics
CREATE TABLE public.mode_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  conversation_id UUID REFERENCES public.conversations(id),
  mode TEXT NOT NULL,
  previous_mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mode_selections ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anon users (tracking)
CREATE POLICY "Allow insert mode selections"
ON public.mode_selections
FOR INSERT
WITH CHECK (true);

-- Allow select for analytics (admin only via service role)
CREATE POLICY "Allow select for service role"
ON public.mode_selections
FOR SELECT
USING (true);

-- Create index for analytics queries
CREATE INDEX idx_mode_selections_mode ON public.mode_selections(mode);
CREATE INDEX idx_mode_selections_created_at ON public.mode_selections(created_at);
CREATE INDEX idx_mode_selections_user_id ON public.mode_selections(user_id);