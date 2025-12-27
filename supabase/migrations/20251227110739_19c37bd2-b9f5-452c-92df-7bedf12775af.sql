-- Create user_context table for personalized chatbot training
CREATE TABLE public.user_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL,
  context_key TEXT NOT NULL,
  context_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, context_type, context_key)
);

-- Enable RLS (access via edge functions only)
ALTER TABLE public.user_context ENABLE ROW LEVEL SECURITY;

-- Create indexes for efficient queries
CREATE INDEX idx_user_context_user_id ON public.user_context(user_id);
CREATE INDEX idx_user_context_type ON public.user_context(context_type);
CREATE INDEX idx_user_context_active ON public.user_context(user_id, is_active) WHERE is_active = true;