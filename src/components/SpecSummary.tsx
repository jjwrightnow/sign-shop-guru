import React from 'react';

export interface Specs {
  environment?: string;
  lighting_profile?: string;
  budget?: string;
  material?: string;
  height?: string;
  mounting?: string;
  timeline?: string;
  [key: string]: string | undefined;
}

export interface SpecSummaryProps {
  specs: Specs;
  visible: boolean;
  onSubmit: () => void;
}

const SpecSummary: React.FC<SpecSummaryProps> = ({ specs, visible, onSubmit }) => {
  if (!visible) return null;

  const activeSpecs = Object.entries(specs).filter(([, v]) => v && v !== "—");

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Project Specs</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {activeSpecs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No specs selected yet.</p>
        ) : (
          <div className="space-y-4">
            {activeSpecs.map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-sm text-foreground font-medium mt-0.5">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeSpecs.length > 0 && (
        <div className="p-3 pb-5 border-t border-border mt-auto shrink-0 bg-background">
          <button
            onClick={onSubmit}
            className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400
                       text-black font-semibold text-sm transition-colors"
          >
            Request Quote →
          </button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Quote delivered by email · No pricing shown here
          </p>
        </div>
      )}
    </div>
  );
};

export default SpecSummary;
