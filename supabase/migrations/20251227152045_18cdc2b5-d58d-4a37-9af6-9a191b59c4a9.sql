-- Create admin_sessions table for secure session management
CREATE TABLE public.admin_sessions (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient expiry cleanup
CREATE INDEX idx_admin_sessions_expiry ON public.admin_sessions(expires_at);

-- Enable RLS (block all public access - only service role can access)
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no public access. Only service role can read/write.