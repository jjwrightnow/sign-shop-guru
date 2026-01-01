import { Lightbulb, Wrench, FileText, Factory } from "lucide-react";
import { ChatMode } from "@/components/ModeSelector";

interface ModeBadgeProps {
  mode: ChatMode;
}

const modeConfig: Record<ChatMode, { icon: typeof Lightbulb; label: string; color: string }> = {
  learn: { 
    icon: Lightbulb, 
    label: "Learn", 
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" 
  },
  specs: { 
    icon: Wrench, 
    label: "Specs", 
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" 
  },
  quote: { 
    icon: FileText, 
    label: "Quote", 
    color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" 
  },
  suppliers: { 
    icon: Factory, 
    label: "Suppliers", 
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" 
  },
};

const ModeBadge = ({ mode }: ModeBadgeProps) => {
  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

export default ModeBadge;
