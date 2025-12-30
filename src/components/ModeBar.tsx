import { Lightbulb, Wrench, FileText, Factory } from "lucide-react";
import { ChatMode } from "@/components/ModeSelector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModeBarProps {
  activeMode: ChatMode | null;
  onSelectMode: (mode: ChatMode) => void;
}

const modes: { mode: ChatMode; icon: typeof Lightbulb; label: string; description: string }[] = [
  { mode: "learn", icon: Lightbulb, label: "Learn", description: "Ask about signs, materials, and processes" },
  { mode: "specs", icon: Wrench, label: "Specs", description: "Get detailed product specifications" },
  { mode: "quote", icon: FileText, label: "Quote", description: "Submit a project for pricing" },
  { mode: "suppliers", icon: Factory, label: "Suppliers", description: "Explore manufacturers & suppliers" },
];

const ModeBar = ({ activeMode, onSelectMode }: ModeBarProps) => {
  return (
    <div className="w-full border-t border-border bg-surface">
      <div className="container max-w-4xl mx-auto px-4 py-2">
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center justify-center gap-2">
            {modes.map((item) => {
              const Icon = item.icon;
              const isActive = activeMode === item.mode;
              
              return (
                <Tooltip key={item.mode}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelectMode(item.mode)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-blue-500 text-white shadow-sm scale-105"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-102"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 transition-transform duration-200 ${isActive ? "animate-pulse" : ""}`} />
                      <span>{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="bg-popover text-popover-foreground border border-border shadow-lg z-50"
                  >
                    <p className="text-xs">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ModeBar;
