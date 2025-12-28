-- Add new glossary terms for fabrication techniques, installation methods, and materials

-- Fabrication Techniques
INSERT INTO public.glossary (term, short_definition, full_definition, category, related_terms) VALUES

-- Fabrication Techniques
('notch bending',
 'Creating clean bends in channel letter returns using notched cuts',
 'Notch bending involves making V-shaped cuts in aluminum returns to create sharp, clean corners. The spacing and depth of notches determine the bend radius. Essential for forming channel letter shapes accurately.',
 'fabrication',
 ARRAY['returns', 'channel letters', 'aluminum']),

('welder',
 'Machine that fuses aluminum returns to backs',
 'Channel letter welders use TIG or spot welding to join aluminum returns to letter backs. Proper settings prevent burn-through on thin materials. Clean welds are essential for paint adhesion and weatherproofing.',
 'fabrication',
 ARRAY['returns', 'channel letters', '.040 aluminum']),

('router table',
 'CNC cutting equipment for sign faces and letters',
 'CNC router tables cut acrylic faces, dimensional letters, and various sign materials with precision. Key specs include table size, spindle speed, and Z-axis travel. Common brands include MultiCam, AXYZ, and ShopBot.',
 'fabrication',
 ARRAY['acrylic face', 'dimensional letters', 'CNC']),

('pattern making',
 'Creating templates for letter fabrication',
 'Pattern making produces the templates used to cut and form channel letters. Modern shops use CAD software to create patterns, which are then cut on vinyl plotters or CNC machines. Accurate patterns are essential for proper fit.',
 'fabrication',
 ARRAY['channel letters', 'returns', 'CNC']),

('trimcap',
 'Plastic edging that holds acrylic faces in channel letters',
 'Trimcap is an extruded plastic channel that attaches to the front of channel letter returns. It holds the acrylic face in place and provides a finished edge. Available in various depths to match return height.',
 'fabrication',
 ARRAY['channel letters', 'acrylic face', 'returns']),

('brake forming',
 'Using a press brake to make bends in sheet metal',
 'Brake forming uses a hydraulic or mechanical press to create straight bends in aluminum or steel sheet. Used for making sign cabinets, pans, and other flat-to-angled transitions.',
 'fabrication',
 ARRAY['cabinets', 'aluminum', 'steel']),

-- Installation Methods
('stud mount',
 'Attaching letters using threaded rods through the wall',
 'Stud mounting uses threaded rods welded to letter backs that pass through drilled holes in the mounting surface. Nuts secure the letters from behind. Provides a clean, floating appearance with space for halo lighting.',
 'installation',
 ARRAY['flush mount', 'channel letters', 'dimensional letters']),

('z-clip mount',
 'Using interlocking metal clips for cabinet installation',
 'Z-clips (also called French cleats) are interlocking metal brackets. One mounts to the wall, the other to the sign. The sign hooks onto the wall bracket. Allows for easy leveling and removal.',
 'installation',
 ARRAY['cabinets', 'mounting', 'sign installation']),

('pole mount',
 'Installing signs on freestanding pole structures',
 'Pole mounting involves attaching signs to vertical poles set in concrete footings. Requires engineering for wind loads. Common for pylon signs, directional signs, and monument sign poles.',
 'installation',
 ARRAY['pylon sign', 'monument sign', 'freestanding']),

('concrete anchor',
 'Fasteners designed for mounting into concrete',
 'Concrete anchors secure signs to concrete surfaces. Types include wedge anchors, sleeve anchors, and drop-in anchors. Selection depends on load requirements, concrete condition, and installation access.',
 'installation',
 ARRAY['mounting', 'installation', 'monument sign']),

('wire chase',
 'Concealed pathway for electrical wiring',
 'Wire chases hide electrical connections between illuminated letters and power supplies. Can be routed through walls, raceways, or decorative enclosures. Code-compliant installation is essential.',
 'installation',
 ARRAY['electrical', 'flush mount', 'LED modules']),

('silicone seal',
 'Weatherproofing material for sign connections',
 'Silicone sealant waterproofs wire penetrations, letter backs, and mounting points. Use neutral-cure silicone for aluminum compatibility. Critical for preventing water damage and electrical shorts.',
 'installation',
 ARRAY['weatherproofing', 'channel letters', 'electrical']),

-- Materials
('polycarbonate',
 'Impact-resistant plastic alternative to acrylic',
 'Polycarbonate is a tough, shatter-resistant plastic used for sign faces in high-impact areas. Costs more than acrylic but withstands vandalism and harsh weather. Can yellow over time without UV protection.',
 'materials',
 ARRAY['acrylic face', 'channel letters', 'face-lit']),

('HDU foam',
 'High-density urethane foam for carved signs',
 'HDU (High-Density Urethane) is a foam material that carves like wood but won''t rot or crack. Ideal for dimensional letters, carved signs, and decorative elements. Requires sealing and painting.',
 'materials',
 ARRAY['dimensional letters', 'carved signs', 'monument sign']),

('dibond',
 'Aluminum composite material for sign panels',
 'Dibond is an aluminum composite panel (ACP) with two aluminum sheets bonded to a polyethylene core. Lightweight, rigid, and weather-resistant. Popular for flat panel signs and cabinet faces.',
 'materials',
 ARRAY['sign panels', 'cabinets', 'aluminum']),

('vinyl wrap',
 'Adhesive film applied to sign surfaces',
 'Vinyl wrap is adhesive-backed film used for graphics, color changes, and surface protection. Available in numerous colors, finishes, and specialty films. Proper application requires surface prep and squeegee technique.',
 'materials',
 ARRAY['graphics', 'sign panels', 'vehicle wrap']),

('powder coating',
 'Durable paint finish baked onto metal',
 'Powder coating applies dry powder paint electrostatically, then bakes it to form a hard finish. More durable than liquid paint. Common for sign cabinets, poles, and metal letters. Requires proper surface prep.',
 'materials',
 ARRAY['metal letters', 'cabinets', 'finishing']),

('.063 aluminum',
 'Heavier gauge aluminum for larger letters',
 '.063" aluminum is thicker than standard .040" and provides more rigidity for larger channel letters (typically over 24"). Requires more power to bend but holds shape better.',
 'materials',
 ARRAY['.040 aluminum', 'returns', 'channel letters']),

-- Additional electrical terms
('daisy chain',
 'Connecting LED modules in series',
 'Daisy chaining connects LED modules end-to-end, with power flowing from one to the next. Simplifies wiring but requires attention to voltage drop over long runs. Most modules allow 15-20 in series.',
 'electrical',
 ARRAY['LED modules', 'power supply', 'wiring']),

('voltage drop',
 'Loss of power over long wire runs',
 'Voltage drop occurs when electrical resistance in wires reduces voltage at the end of long runs. Causes LED dimming. Mitigate with larger wire gauge or multiple power injection points.',
 'electrical',
 ARRAY['LED modules', 'power supply', 'wiring']),

('UL listing',
 'Safety certification for electrical sign components',
 'UL (Underwriters Laboratories) listing certifies that products meet safety standards. Many jurisdictions require UL-listed sign components. Applies to power supplies, LED modules, and complete sign systems.',
 'electrical',
 ARRAY['LED modules', 'power supply', 'code compliance']),

-- Sign types
('cabinet sign',
 'Box-style sign with internal illumination',
 'Cabinet signs are enclosed boxes with translucent faces that allow internal lighting to shine through. Also called box signs or lightboxes. Common for retail storefronts and commercial buildings.',
 'sign_types',
 ARRAY['lightbox', 'LED modules', 'face-lit']),

('blade sign',
 'Sign that projects perpendicular from a building',
 'Blade signs (or projecting signs) mount perpendicular to the building facade for visibility along the sidewalk or street. Often double-sided. May require structural engineering for wind loads.',
 'sign_types',
 ARRAY['mounting', 'dimensional letters', 'projecting sign']);

-- Add new columns to users table for intake form restructuring
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS help_areas TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sign_type_interest TEXT;

-- Note: company_name already exists as business_name in users table