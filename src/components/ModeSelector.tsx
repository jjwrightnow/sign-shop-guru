import { Lightbulb, Wrench, FileText, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ChatMode = "learn" | "specs" | "quote" | "suppliers";

interface ModeSelectorProps {
  onSelectMode: (mode: ChatMode) => void;
}

const modes = [
  {
    mode: "learn" as ChatMode,
    icon: Lightbulb,
    label: "Learn",
    description: "Ask about signs, materials, processes",
  },
  {
    mode: "specs" as ChatMode,
    icon: Wrench,
    label: "Specs",
    description: "Get detailed product specifications",
  },
  {
    mode: "quote" as ChatMode,
    icon: FileText,
    label: "Quote",
    description: "Submit a project for pricing",
  },
  {
    mode: "suppliers" as ChatMode,
    icon: Factory,
    label: "Suppliers",
    description: "Explore manufacturers & suppliers",
  },
];

const ModeSelector = ({ onSelectMode }: ModeSelectorProps) => {
  return (
    <div className="flex flex-col items-center gap-6 mt-6 mb-4">
      <p className="text-sm text-muted-foreground">What brings you here today?</p>
      
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {modes.map((item) => (
          <Button
            key={item.mode}
            variant="outline"
            onClick={() => onSelectMode(item.mode)}
            className="flex flex-col items-center gap-2 h-auto py-4 px-4 transition-all"
            style={{
              backgroundColor: '#262626',
              borderColor: '#333',
              color: '#f5f5f5',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00d4ff';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 212, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <item.icon className="h-6 w-6 text-primary" />
            <span className="font-medium">{item.label}</span>
            <span className="text-xs text-muted-foreground text-center leading-tight">
              {item.description}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
