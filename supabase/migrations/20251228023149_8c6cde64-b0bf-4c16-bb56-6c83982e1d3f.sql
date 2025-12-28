-- Create glossary table
CREATE TABLE public.glossary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  short_definition TEXT NOT NULL,
  full_definition TEXT,
  image_url TEXT,
  category TEXT,
  related_terms TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read" ON public.glossary FOR SELECT USING (true);

-- Service role write access
CREATE POLICY "Service role write" ON public.glossary FOR ALL TO service_role USING (true);

-- Create glossary_analytics table for term engagement tracking
CREATE TABLE public.glossary_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term_id UUID REFERENCES public.glossary(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('hover', 'click')),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.glossary_analytics ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon key (users can log their own interactions)
CREATE POLICY "Allow insert" ON public.glossary_analytics FOR INSERT WITH CHECK (true);

-- Service role read access for admin
CREATE POLICY "Service role read" ON public.glossary_analytics FOR SELECT TO service_role USING (true);

-- Seed initial glossary terms
INSERT INTO public.glossary (term, short_definition, full_definition, category, related_terms) VALUES
-- Letter Types
('channel letters', 
 '3D illuminated letters with metal sides (returns) and plastic faces',
 'Channel letters are three-dimensional signs made from aluminum returns (sides), an aluminum back, and a translucent acrylic or polycarbonate face. They contain LED modules for illumination. Types include face-lit, halo-lit, and combination.',
 'letter_types',
 ARRAY['face-lit', 'halo-lit', 'returns', 'LED modules']),

('dimensional letters',
 '3D letters with depth but no illumination',
 'Dimensional letters are non-illuminated 3D letters cut from materials like acrylic, metal, PVC, or HDU foam. They add depth and dimension to signage without electrical components.',
 'letter_types',
 ARRAY['flat-cut', 'acrylic', 'metal letters']),

('face-lit',
 'Light shines through the front face of the letter',
 'Face-lit (also called front-lit) channel letters have LEDs that illuminate the translucent face, making the letter itself glow. Best for high visibility and readability from a distance.',
 'lighting_styles',
 ARRAY['channel letters', 'LED modules', 'acrylic face']),

('halo-lit',
 'Light glows from behind the letter onto the wall',
 'Halo-lit (also called reverse-lit or backlit) channel letters have LEDs that shine backward, creating a soft glow around the letter against the mounting surface. Creates an upscale, subtle look.',
 'lighting_styles',
 ARRAY['channel letters', 'reverse channel', 'backlit']),

('combo-lit',
 'Light shines both through the face and behind the letter',
 'Combination-lit letters combine face-lit and halo-lit effects, with LEDs illuminating both the front face and casting a halo behind. Maximum visual impact.',
 'lighting_styles',
 ARRAY['face-lit', 'halo-lit', 'channel letters']),

-- Components
('returns',
 'The metal sides of a channel letter',
 'Returns are the aluminum strips that form the sides of channel letters, connecting the face to the back. Standard thickness is .040" aluminum. Return depth typically ranges from 3" to 5" depending on letter size.',
 'components',
 ARRAY['channel letters', 'aluminum', '.040']),

('raceway',
 'A metal box that houses wiring and mounts letters',
 'A raceway is a rectangular metal enclosure that holds the electrical components and provides a mounting structure for channel letters. Letters attach to the raceway, which then mounts to the building.',
 'mounting',
 ARRAY['flush mount', 'mounting', 'electrical']),

('flush mount',
 'Letters mounted directly to the wall surface',
 'Flush mounting attaches letters directly to the building surface using studs or standoffs, with wiring routed through the wall. Cleaner look than raceway but requires more installation work.',
 'mounting',
 ARRAY['raceway', 'standoffs', 'mounting']),

-- Materials  
('.040 aluminum',
 'Standard thickness for channel letter returns',
 '.040" aluminum is the industry standard thickness for channel letter returns. It bends easily while maintaining shape. For letters over 24", .063" provides extra rigidity.',
 'materials',
 ARRAY['returns', 'aluminum', '.063']),

('acrylic face',
 'The translucent plastic front of a channel letter',
 'Acrylic faces are the front panels of channel letters that allow light to pass through. Common thicknesses are 3mm and 4.5mm. Available in many colors and can be painted for specific PMS matches.',
 'materials',
 ARRAY['polycarbonate', 'channel letters', 'face-lit']),

-- Sign Types
('monument sign',
 'Freestanding sign at ground level',
 'Monument signs are low-profile, ground-mounted signs typically used at entrances to businesses, developments, or campuses. They often incorporate landscaping and can include illuminated elements.',
 'sign_types',
 ARRAY['pylon sign', 'ground sign', 'freestanding']),

('pylon sign',
 'Tall freestanding sign on a pole structure',
 'Pylon signs are elevated signs mounted on poles, designed for visibility from roads and highways. Common for shopping centers, gas stations, and businesses needing long-distance visibility.',
 'sign_types',
 ARRAY['monument sign', 'pole sign', 'freestanding']),

-- Electrical
('LED modules',
 'Small LED units used to illuminate signs',
 'LED modules are self-contained lighting units containing multiple LED chips. They connect in series and attach inside channel letters. Common spacing is 3" apart for even illumination.',
 'electrical',
 ARRAY['power supply', 'face-lit', 'channel letters']),

('power supply',
 'Converts AC power to DC for LEDs',
 'Power supplies (also called drivers or transformers) convert 120V AC building power to low-voltage DC (typically 12V or 24V) for LED modules. Sized based on total LED wattage plus 20% headroom.',
 'electrical',
 ARRAY['LED modules', 'wattage', 'electrical']);