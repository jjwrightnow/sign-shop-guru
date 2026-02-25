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

const SpecSummary = ({ specs, visible }: SpecSummaryProps) => {
  if (!visible) return null;

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
            {specs["lighting_profile"]
              ? specs["lighting_profile"] + " profile"
              : "Lighting profile illustration"}
          </span>
        </div>
      </div>
    </div>

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
