-- Add new columns to existing manufacturers table
ALTER TABLE public.manufacturers
ADD COLUMN IF NOT EXISTS entity_name text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS headquarters_location text,
ADD COLUMN IF NOT EXISTS products_manufactured text,
ADD COLUMN IF NOT EXISTS materials_used text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add check constraints for the new columns
ALTER TABLE public.manufacturers
ADD CONSTRAINT manufacturers_region_check 
CHECK (region IS NULL OR region IN ('North America', 'Asia', 'Europe', 'Other'));

ALTER TABLE public.manufacturers
ADD CONSTRAINT manufacturers_category_check 
CHECK (category IS NULL OR category IN ('Manufacturer', 'LED Supplier', 'Distributor', 'Needs Review'));

ALTER TABLE public.manufacturers
ADD CONSTRAINT manufacturers_status_check 
CHECK (status IS NULL OR status IN ('Active', 'Inactive', 'Needs Review', 'Incomplete Data'));

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_manufacturers_region ON public.manufacturers(region);
CREATE INDEX IF NOT EXISTS idx_manufacturers_category ON public.manufacturers(category);
CREATE INDEX IF NOT EXISTS idx_manufacturers_status ON public.manufacturers(status);
CREATE INDEX IF NOT EXISTS idx_manufacturers_search ON public.manufacturers USING gin(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(entity_name, '') || ' ' || COALESCE(products_manufactured, '')));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_manufacturers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_manufacturers_updated_at ON public.manufacturers;
CREATE TRIGGER update_manufacturers_updated_at
BEFORE UPDATE ON public.manufacturers
FOR EACH ROW
EXECUTE FUNCTION public.handle_manufacturers_updated_at();

-- Update RLS policies for platform admin management
DROP POLICY IF EXISTS "Allow public read" ON public.manufacturers;
DROP POLICY IF EXISTS "Manufacturers are publicly readable" ON public.manufacturers;
DROP POLICY IF EXISTS "Platform admins can manage manufacturers" ON public.manufacturers;

-- Everyone can read manufacturers (public knowledge)
CREATE POLICY "Manufacturers are publicly readable" ON public.manufacturers
  FOR SELECT USING (true);

-- Only platform admins can insert/update/delete
CREATE POLICY "Platform admins can manage manufacturers" ON public.manufacturers
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins can update manufacturers" ON public.manufacturers
  FOR UPDATE USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins can delete manufacturers" ON public.manufacturers
  FOR DELETE USING (public.has_role(auth.uid(), 'platform_admin'::app_role));