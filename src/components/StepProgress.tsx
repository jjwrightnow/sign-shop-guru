const STEPS = [
  "Artwork",
  "Location",
  "Lighting",
  "Budget",
  "Material",
  "Height",
  "Mounting",
  "Timeline",
];

const StepProgress = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm overflow-x-auto">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5 shrink-0">
          <div className="flex flex-col items-center gap-0.5">
            <div className={`w-2 h-2 rounded-full transition-all ${
              i < currentStep
                ? "bg-amber-500"
                : i === currentStep
                ? "bg-amber-400 ring-2 ring-amber-400/30"
                : "bg-muted-foreground/30"
            }`} />
            <span className={`text-[9px] hidden sm:block ${
              i <= currentStep ? "text-amber-400" : "text-muted-foreground/40"
            }`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-4 h-px mb-3 ${
              i < currentStep ? "bg-amber-500/60" : "bg-muted-foreground/20"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepProgress;
