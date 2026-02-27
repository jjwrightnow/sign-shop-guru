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

interface StepProgressProps {
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

const StepProgress = ({ currentStep, onStepClick }: StepProgressProps) => {
  const isClickable = (i: number) => {
    if (i === currentStep) return false; // active step not clickable
    if (i < currentStep) return true;     // completed steps always clickable
    // future step clickable only if previous step is completed
    return i === currentStep + 1;
  };

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm overflow-x-auto">
      {STEPS.map((label, i) => {
        const clickable = isClickable(i);
        return (
          <div key={label} className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(i)}
              className={`flex flex-col items-center gap-0.5 bg-transparent border-none p-0 ${
                clickable ? "cursor-pointer" : "cursor-default"
              }`}
            >
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
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px mb-3 ${
                i < currentStep ? "bg-amber-500/60" : "bg-muted-foreground/20"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepProgress;
