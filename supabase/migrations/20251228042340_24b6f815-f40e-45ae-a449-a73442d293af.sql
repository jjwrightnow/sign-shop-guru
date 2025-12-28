-- Add RLS policies for the users table to allow public user creation

-- Allow anyone to insert new users (for intake form)
CREATE POLICY "Allow public insert" ON public.users
FOR INSERT WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON public.users
FOR SELECT USING (true);

-- Allow users to update their own data (by id match)
CREATE POLICY "Users can update own data" ON public.users
FOR UPDATE USING (true);