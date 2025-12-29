
-- =============================================
-- SIGNMAKER.AI / FASTLETTER.BOT
-- LEAN PRODUCT KNOWLEDGE SCHEMA v2
-- =============================================

-- =============================================
-- 1. LIGHTING_PROFILES (The 16 Grid Options)
-- =============================================
CREATE TABLE lighting_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  binary_code CHAR(4) UNIQUE NOT NULL,
  description TEXT,
  layers_count INTEGER DEFAULT 3,
  icon_url TEXT,
  sort_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the 16 profiles
INSERT INTO lighting_profiles (name, binary_code, description, layers_count, sort_order) VALUES
('Non-Illuminated', '0000', 'Standard metal letters without lighting.', 3, 1),
('Face Lit', '1000', 'Light shines through the front face.', 3, 2),
('Halo Lit', '0001', 'Light projects backward creating glow behind letters.', 3, 3),
('Face + Halo', '1001', 'Both front and back illumination.', 4, 4),
('Side Front', '0100', 'Front side illumination.', 3, 5),
('Side Front + Halo', '0101', 'Front side and halo lighting.', 4, 6),
('Side Back', '0010', 'Back side illumination.', 3, 7),
('Side Back + Halo', '0011', 'Back side and halo lighting.', 4, 8),
('Full Side', '0110', 'Complete side illumination.', 4, 9),
('Full Side + Halo', '0111', 'Full side and halo lighting.', 4, 10),
('Face + Side Front', '1100', 'Face lit plus front edge glow.', 4, 11),
('Face + Side Back', '1010', 'Face lit plus back edge glow.', 4, 12),
('Face + Full Side', '1110', 'Face lit plus both edges.', 4, 13),
('Face + Side Front + Halo', '1101', 'Face, front edge, and halo.', 4, 14),
('Face + Side Back + Halo', '1011', 'Face, back edge, and halo.', 4, 15),
('All Sides', '1111', 'Full illumination from all directions.', 4, 16);

-- RLS for lighting_profiles
ALTER TABLE lighting_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON lighting_profiles FOR SELECT USING (true);

-- =============================================
-- 2. MANUFACTURERS
-- =============================================
CREATE TABLE manufacturers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  website TEXT,
  catalog_url TEXT,
  catalog_version TEXT,
  catalog_updated_at DATE,
  logo_url TEXT,
  price_tier TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON manufacturers FOR SELECT USING (true);

-- =============================================
-- 3. PRODUCTS
-- =============================================
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES lighting_profiles(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT,
  materials TEXT[],
  finishes TEXT[],
  height_min DECIMAL(5,2),
  height_max DECIMAL(5,2),
  depth_options DECIMAL(4,2)[],
  led_options TEXT[],
  construction TEXT,
  has_trim_cap BOOLEAN,
  reveal_options DECIMAL(4,2)[],
  has_pricing BOOLEAN DEFAULT false,
  price_unit TEXT,
  catalog_page TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(manufacturer_id, slug)
);

CREATE INDEX idx_products_manufacturer ON products(manufacturer_id);
CREATE INDEX idx_products_profile ON products(profile_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON products FOR SELECT USING (true);

-- =============================================
-- 4. PRICING (Gated)
-- =============================================
CREATE TABLE pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  height_inches INTEGER,
  depth_inches DECIMAL(4,2),
  material TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, height_inches, depth_inches, material)
);

CREATE INDEX idx_pricing_product ON pricing(product_id);
CREATE INDEX idx_pricing_lookup ON pricing(product_id, height_inches, depth_inches);

ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON pricing FOR ALL USING (true);

-- =============================================
-- 5. UPDATE GLOSSARY (Add aliases column)
-- =============================================
ALTER TABLE glossary ADD COLUMN IF NOT EXISTS aliases TEXT[];

-- =============================================
-- 6. MATERIALS
-- =============================================
CREATE TABLE materials (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER
);

INSERT INTO materials (code, name, category, sort_order) VALUES
('AL', 'Aluminum', 'metal', 1),
('SUS304', 'Stainless Steel 304', 'metal', 2),
('SUS316', 'Stainless Steel 316 (Marine)', 'metal', 3),
('BRASS', 'Brass', 'metal', 4),
('BRONZE', 'Bronze', 'metal', 5),
('COPPER', 'Copper', 'metal', 6),
('ACRYLIC', 'Acrylic', 'plastic', 7),
('PLASTIC', 'Formed Plastic', 'plastic', 8);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON materials FOR SELECT USING (true);

-- =============================================
-- 7. FINISHES
-- =============================================
CREATE TABLE finishes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  compatible_materials TEXT[],
  sort_order INTEGER
);

INSERT INTO finishes (code, name, compatible_materials, sort_order) VALUES
('brushed', 'Brushed', ARRAY['AL','SUS304','SUS316','BRASS','BRONZE','COPPER'], 1),
('polished', 'Polished', ARRAY['SUS304','SUS316','BRASS','BRONZE','COPPER'], 2),
('mirror', 'Mirror', ARRAY['SUS304','SUS316'], 3),
('painted', 'Painted', ARRAY['AL'], 4),
('anodized', 'Anodized', ARRAY['AL'], 5);

ALTER TABLE finishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON finishes FOR SELECT USING (true);

-- =============================================
-- 8. LED_COLORS
-- =============================================
CREATE TABLE led_colors (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hex_code TEXT,
  kelvin INTEGER,
  is_standard BOOLEAN DEFAULT true,
  sort_order INTEGER
);

INSERT INTO led_colors (code, name, hex_code, kelvin, is_standard, sort_order) VALUES
('W', 'White', '#FFFFFF', 6500, true, 1),
('WW', 'Warm White', '#FFF5E6', 3000, true, 2),
('R', 'Red', '#FF0000', NULL, true, 3),
('G', 'Green', '#00FF00', NULL, true, 4),
('B', 'Blue', '#0000FF', NULL, true, 5),
('RGB', 'Color Changing', NULL, NULL, false, 6);

ALTER TABLE led_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON led_colors FOR SELECT USING (true);

-- =============================================
-- 9. DEPTH_RECOMMENDATIONS
-- =============================================
CREATE TABLE depth_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  height_min INTEGER,
  height_max INTEGER,
  recommended_depth DECIMAL(4,2),
  min_depth DECIMAL(4,2),
  max_depth DECIMAL(4,2)
);

INSERT INTO depth_recommendations (height_min, height_max, recommended_depth, min_depth, max_depth) VALUES
(3, 8, 3, 2, 3),
(9, 14, 3.5, 3, 4),
(15, 24, 4, 3, 5),
(25, 36, 5, 4, 6),
(37, 48, 5, 5, 6),
(49, 96, 6, 5, 6);

ALTER TABLE depth_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON depth_recommendations FOR SELECT USING (true);

-- =============================================
-- 10. CATALOG_UPLOADS
-- =============================================
CREATE TABLE catalog_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  status TEXT DEFAULT 'pending',
  pages_processed INTEGER,
  products_extracted INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

ALTER TABLE catalog_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON catalog_uploads FOR ALL USING (true);

-- =============================================
-- 11. SPEC_SHEETS
-- =============================================
CREATE TABLE spec_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE,
  profile_id UUID REFERENCES lighting_profiles(id),
  configuration JSONB NOT NULL,
  company_name TEXT,
  company_logo_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  downloaded_count INTEGER DEFAULT 0,
  emailed_count INTEGER DEFAULT 0
);

-- Auto-generate reference number
CREATE OR REPLACE FUNCTION generate_spec_reference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reference_number := 'FL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_spec_reference
  BEFORE INSERT ON spec_sheets
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_spec_reference();

ALTER TABLE spec_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert" ON spec_sheets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read" ON spec_sheets FOR SELECT USING (true);

-- =============================================
-- 12. UPDATE CONVERSATIONS (Add session_id)
-- =============================================
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS session_id TEXT;

-- =============================================
-- 13. UPDATE USERS (Add new columns for verification)
-- =============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- =============================================
-- VIEWS
-- =============================================
CREATE OR REPLACE VIEW products_full AS
SELECT 
  p.*,
  m.name as manufacturer_name,
  m.slug as manufacturer_slug,
  m.price_tier as manufacturer_price_tier,
  lp.name as profile_name,
  lp.binary_code as profile_code
FROM products p
JOIN manufacturers m ON p.manufacturer_id = m.id
JOIN lighting_profiles lp ON p.profile_id = lp.id
WHERE p.is_active = true AND m.is_active = true;

CREATE OR REPLACE VIEW manufacturer_profiles AS
SELECT 
  m.id as manufacturer_id,
  m.name as manufacturer_name,
  m.slug,
  m.price_tier,
  lp.id as profile_id,
  lp.name as profile_name,
  lp.binary_code,
  p.height_min,
  p.height_max,
  p.materials,
  p.depth_options
FROM manufacturers m
JOIN products p ON p.manufacturer_id = m.id
JOIN lighting_profiles lp ON p.profile_id = lp.id
WHERE m.is_active = true AND p.is_active = true;
