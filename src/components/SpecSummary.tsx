interface SpecSummaryProps {
  specs: Record<string, string>;
  visible: boolean;
}

const specFields = [
  { key: "lighting_profile", label: "Lighting Profile" },
  { key: "height", label: "Height" },
  { key: "material", label: "Material" },
  { key: "finish", label: "Finish" },
  { key: "environment", label: "Environment" },
  { key: "mounting", label: "Mounting" },
  { key: "artwork", label: "Artwork" },
  { key: "timeline", label: "Timeline" },
];

const SpecSummary = ({ specs, visible }: SpecSummaryProps) => {
  if (!visible) return null;

  return (
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
  );
};

export default SpecSummary;
