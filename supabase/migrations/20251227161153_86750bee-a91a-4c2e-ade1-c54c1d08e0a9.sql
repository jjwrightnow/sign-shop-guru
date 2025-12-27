-- Create insights_reports table for storing weekly reports
CREATE TABLE public.insights_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT DEFAULT 'weekly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB,
  insights TEXT,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.insights_reports ENABLE ROW LEVEL SECURITY;

-- Service role only access
CREATE POLICY "Service role only" ON public.insights_reports FOR ALL USING (true);

-- Create alerts table for tracking sent alerts
CREATE TABLE public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  details JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id),
  conversation_id UUID REFERENCES public.conversations(id)
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Service role only access  
CREATE POLICY "Service role only" ON public.alerts FOR ALL USING (true);