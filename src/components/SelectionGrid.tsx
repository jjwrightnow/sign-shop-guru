interface SelectionGridProps {
  stage: number;
  onSelect: (value: string) => void;
  visible: boolean;
}

const stages: Record<number, { label: string; options: string[]; hasImage?: boolean }> = {
  0: {
    label: "How can I help?",
    options: ["I need a quote for a project", "I'm speccing a project", "I'm evaluating this platform"],
  },
  1: {
    label: "Sign type",
    options: ["Channel letters", "Dimensional letters", "Logo or shape cut-out", "Monument or cabinet"],
  },
  2: {
    label: "Lighting profile",
    options: ["Face-lit", "Halo-lit", "Face + Halo", "Side-lit", "Non-illuminated", "Show all 16"],
    hasImage: true,
  },
  3: {
    label: "Environment",
    options: ["Interior", "Exterior", "Coastal", "Covered/Canopy"],
  },
  4: {
    label: "Letter height",
    options: ["Under 6 inches", "6–12 inches", "12–24 inches", "24–48 inches", "Over 48 inches"],
  },
  5: {
    label: "Material",
    options: ["Aluminum", "Stainless 304", "Stainless 316", "Brass", "Copper", "Corten", "Acrylic"],
  },
  6: {
    label: "Finish",
    options: ["Brushed", "Mirror", "Painted", "Natural/Raw", "PVD"],
  },
  7: {
    label: "Mounting",
    options: ["Flush to wall", "Standoff", "Raceway", "Freestanding"],
  },
  8: {
    label: "Artwork",
    options: ["Vector file ready (AI/EPS)", "Raster image (JPG/PNG)", "Still designing", "Need design help"],
  },
  9: {
    label: "Timeline",
    options: ["ASAP", "4–6 weeks", "2–3 months", "Planning phase"],
  },
  10: {
    label: "What's next?",
    options: ["Upload artwork", "Email spec summary", "Talk to someone"],
  },
};

const SelectionGrid = ({ stage, onSelect, visible }: SelectionGridProps) => {
  if (!visible) return null;

  const current = stages[stage];
  if (!current) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1">
        {current.label}
      </p>
      {current.options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className="w-full text-left rounded-lg bg-muted border border-border/60 px-3 py-2.5 text-[13px] text-foreground transition-colors hover:border-primary/60 hover:bg-muted/80 focus:outline-none focus:border-primary"
        >
          {current.hasImage && (
            <div className="w-full h-[40px] rounded bg-border/30 mb-2" />
          )}
          {option}
        </button>
      ))}
    </div>
  );
};

export default SelectionGrid;
