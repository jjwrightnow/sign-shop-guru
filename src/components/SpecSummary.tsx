import { useState, useEffect } from "react";

interface SpecSummaryProps {
  specs: Record<string, string>;
  visible: boolean;
}

const specFields = [
  { key: "lighting_profile", label: "Lighting Profile" },
  { key: "material", label: "Material" },
  { key: "finish", label: "Finish" },
  { key: "environment", label: "Environment" },
  { key: "mounting", label: "Mounting" },
  { key: "price_range", label: "Price Range" },
  { key: "timeline", label: "Timeline" },
];

const LAYERS = [
  { id: "face",     label: "Face",           applies: ["face","combined"],                        activeColor: "#ffffff" },
  { id: "acrylic",  label: "Acrylic Insert", applies: ["face","combined"],                        activeColor: "#aaddff" },
  { id: "return",   label: "Return",         applies: ["face","halo","side","combined","nonlit"],  activeColor: "#e0e0e0" },
  { id: "backer",   label: "Backer",         applies: ["halo","combined","face","side"],          activeColor: "#888888" },
  { id: "mounting", label: "Mounting",       applies: ["face","halo","side","combined","nonlit"],  activeColor: "#c9a84c" },
];

const PROFILE_TO_CAT: Record<string, string> = {
  "Non-Illuminated": "nonlit",
  "Halo Lit": "halo",
  "Side Back Lit": "side", "Side Back + Halo": "side",
  "Side Front Lit": "side", "Side Front + Halo": "side",
  "Full Side Lit": "side", "Full Side + Halo": "side",
  "Face Lit": "face", "Face + Side Back": "face",
  "Face + Side Front": "face", "Face + Full Side": "face",
  "Face + Halo": "combined", "Face + Side Back + Halo": "combined",
  "Face + Side Front + Halo": "combined", "Fully Illuminated": "combined",
};

const LAYER_DESCRIPTIONS: Record<string, string> = {
  face: "The front face of the letter. On face-lit profiles this is translucent acrylic — light shines through it. On non-lit profiles it can be solid metal.",
  acrylic: "A secondary acrylic diffuser behind the face. Prevents LED hot spots and creates even, consistent glow across the face.",
  return: "The sides of the letter — the metal walls that give it depth. LED strips sit inside here on illuminated profiles. Depth affects both look and lighting quality.",
  backer: "A plate mounted behind the letters on the wall. Creates a clean backdrop for halo glow and conceals wiring.",
  mounting: "How the letter attaches to the wall or backer. Standoff mounting creates a gap for shadow lines and halo glow projection.",
};

const LAYER_OPTIONS: Record<string, { id: string; label: string; note: string }[]> = {
  face: [
    { id: "white-acrylic",   label: "White Acrylic",    note: "Standard for face-lit. Even light diffusion." },
    { id: "opal-acrylic",    label: "Opal Acrylic",     note: "Softer glow, slightly warm tone." },
    { id: "colored-acrylic", label: "Colored Acrylic",  note: "Match brand color. Affects lit color significantly." },
    { id: "solid-metal",     label: "Solid Metal Face", note: "Non-illuminated only. Premium look, no light transmission." },
    { id: "vinyl-face",      label: "Vinyl Applied",    note: "Printed or cut vinyl applied over acrylic or metal face." },
  ],
  acrylic: [
    { id: "white-diffuser",  label: "White Diffuser",  note: "Standard. Eliminates hot spots." },
    { id: "no-insert",       label: "No Insert",        note: "Direct LED to face. Can show hot spots on thin fonts." },
    { id: "milky-insert",    label: "Milky Diffuser",   note: "Warmer, creamier glow. Popular for luxury installs." },
  ],
  return: [
    { id: "ss-brushed",  label: "Stainless — Brushed", note: "Most popular. Clean, durable, interior or exterior." },
    { id: "ss-mirror",   label: "Stainless — Mirror",   note: "High-glam. Shows fingerprints. Interior preferred." },
    { id: "titanium",    label: "Titanium",              note: "Ultra-premium. Slight blue-grey tone." },
    { id: "brass",       label: "Brass",                 note: "Warm gold tone. Interior only." },
    { id: "copper",      label: "Copper",                note: "Rich warm tone. Patinas over time if desired." },
    { id: "corten",      label: "Corten Steel",          note: "Weathered rust aesthetic. Exterior architectural." },
    { id: "aluminum",    label: "Aluminum — Painted",    note: "Budget-friendly. Any RAL color." },
  ],
  backer: [
    { id: "no-backer",      label: "No Backer",          note: "Letters mount directly to wall. Halo glows on wall surface." },
    { id: "metal-backer",   label: "Metal Backer Plate", note: "Painted steel or aluminum. Defines the halo field cleanly." },
    { id: "acrylic-backer", label: "Acrylic Backer",     note: "Can be backlit separately for a glowing panel effect." },
    { id: "raceway",        label: "Raceway / Wireway",  note: "Concealed conduit box. Hides all wiring behind letters." },
  ],
  mounting: [
    { id: "standoff",      label: "Standoff Studs",  note: "Standard for halo. Creates shadow gap. 1–3 inch projection." },
    { id: "flush",         label: "Flush Mount",      note: "Letter sits flat on wall or backer. No gap." },
    { id: "raceway-mount", label: "Raceway Mount",    note: "Mounted to raceway box. Conceals all wiring." },
    { id: "french-cleat",  label: "French Cleat",     note: "Hidden wall mount system. Easy to level and remove." },
  ],
};

const SpecSummary = ({ specs, visible }: SpecSummaryProps) => {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [chosenLayers, setChosenLayers] = useState<Record<string, string>>({});

  useEffect(() => {
    setActiveLayer(null);
    setChosenLayers({});
  }, [specs['lighting_profile']]);

  if (!visible) return null;

  const profileName = specs['lighting_profile'];
  const cat = profileName ? (PROFILE_TO_CAT[profileName] ?? 'nonlit') : null;
  const visibleLayers = cat ? LAYERS.filter(l => l.applies.includes(cat)) : [];

  return (
    <>
      {/* Lighting profile illustration */}
      <div className="w-full rounded-lg border border-border/60 bg-muted/30 mb-3 overflow-hidden">
        <div className="w-full h-[160px] flex items-center justify-center bg-muted/50">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-12 h-12 rounded-lg bg-border/40 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <span className="text-[11px]">
              {profileName
                ? profileName + " profile"
                : "Lighting profile illustration"}
            </span>
          </div>
        </div>
      </div>

      {/* Layer buttons — only when a profile is selected */}
      {profileName && visibleLayers.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-muted/30 overflow-hidden mb-3">
          <div className="px-3 py-2 border-b border-border/40">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Layers — front to back
            </p>
          </div>

          <div className="flex items-center gap-1 px-3 py-2 flex-wrap">
            {visibleLayers.map((layer, i) => (
              <div key={layer.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveLayer(prev => prev === layer.id ? null : layer.id)}
                  style={{
                    borderColor: activeLayer === layer.id ? layer.activeColor : undefined,
                    color: activeLayer === layer.id ? layer.activeColor : undefined,
                    boxShadow: activeLayer === layer.id ? `0 0 8px ${layer.activeColor}44` : undefined,
                  }}
                  className={`px-2.5 py-1 text-[10px] rounded border transition-all
                    ${activeLayer === layer.id
                      ? 'bg-white/5 font-semibold'
                      : 'border-border text-muted-foreground hover:border-white/30'
                    }`}
                >
                  {layer.label}
                </button>
                {i < visibleLayers.length - 1 && (
                  <span className="text-[9px] text-muted-foreground/40">→</span>
                )}
              </div>
            ))}
          </div>

          {/* Layer option panel */}
          {activeLayer && LAYER_OPTIONS[activeLayer] && (
            <div className="px-3 pb-3">
              <p className="text-[10px] text-muted-foreground mb-2">
                {LAYER_DESCRIPTIONS[activeLayer]}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {LAYER_OPTIONS[activeLayer].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setChosenLayers(prev => ({ ...prev, [activeLayer]: opt.id }))}
                    className={`text-left px-2.5 py-2 rounded border text-[11px] transition-all
                      ${chosenLayers[activeLayer] === opt.id
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                        : 'border-border bg-background/50 text-muted-foreground hover:border-white/20'
                      }`}
                  >
                    <span className="block font-medium">{opt.label}</span>
                    <span className="block text-[10px] opacity-70">{opt.note}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spec fields */}
      <div className="rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
        <div className="px-3 py-2 border-b border-border/40">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Project Spec
          </p>
        </div>
        <div className="divide-y divide-border/30">
          {specFields.map(({ key, label }) => {
            const value = specs[key];
            const hasValue = value && value !== "—";
            return (
              <div key={key} className="flex items-center justify-between px-3 py-2">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <span
                  className={`text-[13px] ${
                    hasValue ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  {value || "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SpecSummary;
