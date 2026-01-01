import { GraduationCap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExpertModeToggleProps {
  isExpertMode: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

const ExpertModeToggle = ({ isExpertMode, onToggle, disabled }: ExpertModeToggleProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <Switch
            id="expert-mode"
            checked={isExpertMode}
            onCheckedChange={onToggle}
            disabled={disabled}
            className="data-[state=checked]:bg-primary"
          />
          <Label
            htmlFor="expert-mode"
            className={`flex items-center gap-1.5 text-xs cursor-pointer transition-colors ${
              isExpertMode ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Expert Mode</span>
          </Label>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">
          {isExpertMode
            ? "Expert mode enabled - you can provide feedback on AI responses"
            : "Enable to verify and correct AI responses"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ExpertModeToggle;
