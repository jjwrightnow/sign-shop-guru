import { Lightbulb, Wrench, FileText, Factory } from "lucide-react";
import { ChatMode } from "@/components/ModeSelector";

interface ModeBarProps {
  activeMode: ChatMode | null;
  onSelectMode: (mode: ChatMode) => void;
}

const modes: { mode: ChatMode; icon: typeof Lightbulb; label: string }[] = [
  { mode: "learn", icon: Lightbulb, label: "Learn" },
  { mode: "specs", icon: Wrench, label: "Specs" },
  { mode: "quote", icon: FileText, label: "Quote" },
  { mode: "suppliers", icon: Factory, label: "Suppliers" },
];

const ModeBar = ({ activeMode, onSelectMode }: ModeBarProps) => {
  return (
    <div className="sticky top-16 z-40 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="container max-w-4xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2">
          {modes.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.mode;
            
            return (
              <button
                key={item.mode}
                onClick={() => onSelectMode(item.mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModeBar;
