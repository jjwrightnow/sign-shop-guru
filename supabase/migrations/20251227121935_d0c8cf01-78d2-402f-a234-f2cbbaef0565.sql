-- Drop the restrictive policy on conversations
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;

-- Create permissive policies for conversations
CREATE POLICY "Allow conversation creation" 
ON public.conversations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow conversation read" 
ON public.conversations 
FOR SELECT 
USING (true);

CREATE POLICY "Allow conversation update" 
ON public.conversations 
FOR UPDATE 
USING (true)
WITH CHECK (true);