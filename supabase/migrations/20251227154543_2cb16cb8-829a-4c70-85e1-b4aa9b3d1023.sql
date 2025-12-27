-- Conversation patterns for tracking successful flows
CREATE TABLE public.conversation_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  trigger_phrase TEXT,
  successful_path TEXT[],
  conversion_rate DECIMAL,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suggested follow-ups based on keywords
CREATE TABLE public.suggested_followups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_keywords TEXT[],
  category TEXT,
  followup_questions TEXT[],
  success_rate DECIMAL,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge gaps for tracking unanswerable questions
CREATE TABLE public.knowledge_gaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  resolved BOOLEAN DEFAULT false,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables (service role only - no public access)
ALTER TABLE public.conversation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggested_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_gaps ENABLE ROW LEVEL SECURITY;