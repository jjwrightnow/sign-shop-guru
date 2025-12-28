import { Store, Lightbulb, Building2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickStartPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const prompts = [
  {
    icon: Store,
    label: "Business storefront sign",
    prompt: "I need a sign for my business storefront. Can you help me understand my options?",
  },
  {
    icon: Lightbulb,
    label: "LED / Neon sign",
    prompt: "I'm interested in an LED or neon sign. What should I know about these options?",
  },
  {
    icon: Building2,
    label: "Monument sign",
    prompt: "I'm looking for a monument sign for my property. What are my options?",
  },
  {
    icon: HelpCircle,
    label: "Not sure yet",
    prompt: "I need a sign but I'm not sure what type. Can you help me figure out what I need?",
  },
];

const QuickStartPrompts = ({ onSelectPrompt }: QuickStartPromptsProps) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {prompts.map((item) => (
        <Button
          key={item.label}
          variant="outline"
          onClick={() => onSelectPrompt(item.prompt)}
          className="flex items-center gap-2 text-sm border-border hover:border-primary hover:bg-primary/10 transition-all"
        >
          <item.icon className="h-4 w-4 text-primary" />
          {item.label}
        </Button>
      ))}
    </div>
  );
};

export default QuickStartPrompts;
