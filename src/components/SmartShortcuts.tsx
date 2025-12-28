import { 
  Store, Lightbulb, Building2, HelpCircle, Wrench, Box, Zap, 
  BookOpen, DollarSign, Hammer, PenTool, Users, Truck 
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ShortcutType = "shopper" | "professional-active" | "professional-training" | "freelancer";

interface ShortcutOption {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  prompt: string;
}

interface SmartShortcutsProps {
  userType: ShortcutType;
  onSelectShortcut: (shortcut: { value: string; prompt: string }) => void;
  onSkip: () => void;
}

const shopperShortcuts: ShortcutOption[] = [
  {
    icon: Store,
    label: "Channel Letters",
    value: "channel-letters",
    prompt: "I'm interested in channel letters for my business. Can you tell me about the options?",
  },
  {
    icon: Building2,
    label: "Monument Sign",
    value: "monument",
    prompt: "I'm looking for a monument sign. What should I know?",
  },
  {
    icon: Box,
    label: "Dimensional Letters",
    value: "dimensional",
    prompt: "I want dimensional letters (non-lit). What are my options?",
  },
  {
    icon: Lightbulb,
    label: "LED/Neon Sign",
    value: "led-neon",
    prompt: "I'm interested in an LED or neon sign. What should I know?",
  },
  {
    icon: Truck,
    label: "Outdoor Sign",
    value: "outdoor",
    prompt: "I need an outdoor sign for my business. What are my options?",
  },
  {
    icon: HelpCircle,
    label: "Not Sure",
    value: "not-sure",
    prompt: "I need a sign but I'm not sure what type. Can you help me figure out what I need?",
  },
];

const professionalActiveShortcuts: ShortcutOption[] = [
  {
    icon: Store,
    label: "Channel Letters",
    value: "channel-letters",
    prompt: "I have a channel letters project I need help with.",
  },
  {
    icon: Box,
    label: "Cabinets/Lightboxes",
    value: "cabinets",
    prompt: "I'm working on a cabinet or lightbox project. Can you help?",
  },
  {
    icon: Building2,
    label: "Monument Signs",
    value: "monument",
    prompt: "I have a monument sign project I need guidance on.",
  },
  {
    icon: PenTool,
    label: "Dimensional Letters",
    value: "dimensional",
    prompt: "I'm working on a dimensional letters project.",
  },
  {
    icon: Wrench,
    label: "Installation",
    value: "installation",
    prompt: "I have an installation question. What's the best approach?",
  },
  {
    icon: HelpCircle,
    label: "Other",
    value: "other",
    prompt: "I have a project question that doesn't fit these categories.",
  },
];

const professionalTrainingShortcuts: ShortcutOption[] = [
  {
    icon: Hammer,
    label: "Fabrication Basics",
    value: "fabrication",
    prompt: "I want to learn about fabrication basics. Where should I start?",
  },
  {
    icon: Zap,
    label: "LED/Electrical",
    value: "led-electrical",
    prompt: "I want to learn about LED and electrical work for signs.",
  },
  {
    icon: Box,
    label: "Materials",
    value: "materials",
    prompt: "I want to learn about sign materials and their properties.",
  },
  {
    icon: Wrench,
    label: "Installation",
    value: "installation",
    prompt: "I want to learn about sign installation techniques.",
  },
  {
    icon: DollarSign,
    label: "Estimating",
    value: "estimating",
    prompt: "I want to learn about estimating and pricing sign jobs.",
  },
  {
    icon: HelpCircle,
    label: "Other",
    value: "other",
    prompt: "I want to learn about something else in the sign industry.",
  },
];

const freelancerShortcuts: ShortcutOption[] = [
  {
    icon: Wrench,
    label: "Installation",
    value: "installation",
    prompt: "I do sign installation work and I'm looking for leads.",
  },
  {
    icon: Hammer,
    label: "Fabrication",
    value: "fabrication",
    prompt: "I do sign fabrication and I'm looking for leads.",
  },
  {
    icon: PenTool,
    label: "Design",
    value: "design",
    prompt: "I do sign design work and I'm looking for leads.",
  },
  {
    icon: Users,
    label: "Brokering",
    value: "brokering",
    prompt: "I broker sign projects and I'm looking for leads.",
  },
  {
    icon: BookOpen,
    label: "All of the Above",
    value: "all",
    prompt: "I offer multiple sign services and I'm looking for leads.",
  },
];

const getShortcutsConfig = (userType: ShortcutType): { title: string; shortcuts: ShortcutOption[] } => {
  switch (userType) {
    case "shopper":
      return {
        title: "What kind of sign are you looking for?",
        shortcuts: shopperShortcuts,
      };
    case "professional-active":
      return {
        title: "What's the project about?",
        shortcuts: professionalActiveShortcuts,
      };
    case "professional-training":
      return {
        title: "What topic?",
        shortcuts: professionalTrainingShortcuts,
      };
    case "freelancer":
      return {
        title: "What services do you offer?",
        shortcuts: freelancerShortcuts,
      };
    default:
      return {
        title: "What would you like help with?",
        shortcuts: shopperShortcuts,
      };
  }
};

const SmartShortcuts = ({ userType, onSelectShortcut, onSkip }: SmartShortcutsProps) => {
  const { title, shortcuts } = getShortcutsConfig(userType);

  return (
    <div className="flex flex-col items-center gap-4 mt-4 mb-2">
      <p className="text-sm text-muted-foreground">{title}</p>
      
      <div className="flex flex-wrap gap-2 justify-center max-w-xl">
        {shortcuts.map((item) => (
          <Button
            key={item.value}
            variant="outline"
            onClick={() => onSelectShortcut({ value: item.value, prompt: item.prompt })}
            className="flex items-center gap-2 text-sm transition-all px-4 py-2 h-auto"
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
            <item.icon className="h-4 w-4 text-primary" />
            {item.label}
          </Button>
        ))}
      </div>

      <button
        onClick={onSkip}
        className="text-xs transition-colors hover:underline mt-2"
        style={{ color: '#666' }}
      >
        Skip — just let me type my question
      </button>
    </div>
  );
};

export default SmartShortcuts;
