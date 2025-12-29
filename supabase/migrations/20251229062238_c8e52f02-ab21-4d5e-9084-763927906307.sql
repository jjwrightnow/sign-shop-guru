
-- Fix security definer views by making them security invoker
ALTER VIEW products_full SET (security_invoker = on);
ALTER VIEW manufacturer_profiles SET (security_invoker = on);

-- Fix function search path
CREATE OR REPLACE FUNCTION generate_spec_reference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reference_number := 'FL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;
