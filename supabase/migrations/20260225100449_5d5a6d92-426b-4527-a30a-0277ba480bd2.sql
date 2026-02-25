ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);