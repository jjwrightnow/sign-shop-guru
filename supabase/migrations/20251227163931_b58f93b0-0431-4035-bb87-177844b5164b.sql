-- Create image search cache table
CREATE TABLE public.image_search_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Create index for faster lookups
CREATE INDEX idx_image_search_cache_query ON public.image_search_cache (query);
CREATE INDEX idx_image_search_cache_expires ON public.image_search_cache (expires_at);

-- Enable RLS
ALTER TABLE public.image_search_cache ENABLE ROW LEVEL SECURITY;

-- Service role only policy
CREATE POLICY "Service role only" ON public.image_search_cache FOR ALL USING (true);