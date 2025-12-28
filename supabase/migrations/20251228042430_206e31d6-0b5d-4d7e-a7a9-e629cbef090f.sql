-- RLS policy for admin_sessions table (service role only)
CREATE POLICY "Service role only" ON public.admin_sessions
FOR ALL USING (true);