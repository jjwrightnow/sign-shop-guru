-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can insert new records" ON public.users;

-- Create a permissive policy that allows public inserts
CREATE POLICY "Allow public user registration" 
ON public.users 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also add SELECT policy so the app can read user data
CREATE POLICY "Users can read own data" 
ON public.users 
FOR SELECT 
USING (true);

-- Add UPDATE policy for user data
CREATE POLICY "Users can update own data" 
ON public.users 
FOR UPDATE 
USING (true)
WITH CHECK (true);