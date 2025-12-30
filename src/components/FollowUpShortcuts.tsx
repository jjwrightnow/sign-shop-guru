import { 
  Sparkles, Ruler, Palette, DollarSign, Clock, Wrench, 
  Zap, Box, Building2, Truck, HelpCircle, Users, ShieldCheck,
  Lightbulb, Settings, MapPin, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FollowUpShortcut {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
}

interface FollowUpShortcutsProps {
  initialSelection: string;
  userType: "shopper" | "professional-active" | "professional-training" | "freelancer";
  onSelectShortcut: (prompt: string) => void;
  onSkip: () => void;
}

// Follow-up shortcuts based on initial shopper selection
const shopperFollowUps: Record<string, FollowUpShortcut[]> = {
  "channel-letters": [
    { icon: Sparkles, label: "Face-lit vs Halo-lit", prompt: "What's the difference between face-lit and halo-lit channel letters?" },
    { icon: Ruler, label: "Size & Spacing", prompt: "How do I determine the right size and spacing for channel letters?" },
    { icon: DollarSign, label: "Pricing Range", prompt: "What's the typical price range for channel letters?" },
    { icon: Clock, label: "How Long to Make", prompt: "How long does it take to fabricate and install channel letters?" },
  ],
  "monument": [
    { icon: Ruler, label: "Size Options", prompt: "What sizes are typical for monument signs?" },
    { icon: Palette, label: "Style Options", prompt: "What style options are available for monument signs?" },
    { icon: ShieldCheck, label: "Permits Needed", prompt: "Do I need permits for a monument sign?" },
    { icon: DollarSign, label: "Cost Estimate", prompt: "What's the typical cost for a monument sign?" },
  ],
  "dimensional": [
    { icon: Box, label: "Material Options", prompt: "What materials are used for dimensional letters?" },
    { icon: Ruler, label: "Thickness Options", prompt: "What thickness options are available for dimensional letters?" },
    { icon: Wrench, label: "Mounting Methods", prompt: "How are dimensional letters mounted?" },
    { icon: DollarSign, label: "Price Comparison", prompt: "How do dimensional letters compare in price to lit signs?" },
  ],
  "led-neon": [
    { icon: Zap, label: "LED vs Real Neon", prompt: "What's the difference between LED neon and real glass neon?" },
    { icon: Palette, label: "Color Options", prompt: "What colors are available for LED/neon signs?" },
    { icon: Clock, label: "Lifespan", prompt: "How long do LED neon signs last?" },
    { icon: DollarSign, label: "Cost Range", prompt: "What's the price range for LED/neon signs?" },
  ],
  "outdoor": [
    { icon: ShieldCheck, label: "Weather Durability", prompt: "How do outdoor signs hold up in bad weather?" },
    { icon: Lightbulb, label: "Lighting Options", prompt: "What lighting options are available for outdoor signs?" },
    { icon: Building2, label: "Sign Types", prompt: "What types of outdoor signs work best for businesses?" },
    { icon: DollarSign, label: "Budget Options", prompt: "What are budget-friendly outdoor sign options?" },
  ],
  "not-sure": [
    { icon: Building2, label: "Storefront Signs", prompt: "Tell me about storefront sign options" },
    { icon: Truck, label: "Vehicle Signs", prompt: "What about vehicle wraps or signs?" },
    { icon: MapPin, label: "Wayfinding Signs", prompt: "I need directional or wayfinding signs" },
    { icon: HelpCircle, label: "Help Me Decide", prompt: "Can you ask me some questions to help figure out what I need?" },
  ],
};

// Follow-up shortcuts based on professional-active selection
const professionalActiveFollowUps: Record<string, FollowUpShortcut[]> = {
  "channel-letters": [
    { icon: Zap, label: "LED Layout", prompt: "How should I lay out LEDs for even illumination in channel letters?" },
    { icon: Box, label: "Return Depth", prompt: "What return depth should I use for these channel letters?" },
    { icon: Wrench, label: "Mounting", prompt: "What's the best mounting method for this installation?" },
    { icon: Settings, label: "Power Supply", prompt: "How do I size the power supply for this project?" },
  ],
  "cabinets": [
    { icon: Box, label: "Frame Design", prompt: "What frame design works best for this cabinet size?" },
    { icon: Lightbulb, label: "Internal Lighting", prompt: "How should I light the interior of this cabinet?" },
    { icon: Wrench, label: "Access Panel", prompt: "Where should I put the service access panel?" },
    { icon: ShieldCheck, label: "Weatherproofing", prompt: "How do I properly weatherproof this cabinet?" },
  ],
  "monument": [
    { icon: Building2, label: "Foundation", prompt: "What foundation does this monument sign need?" },
    { icon: Zap, label: "Electrical", prompt: "How should I run electrical to this monument?" },
    { icon: ShieldCheck, label: "Code Requirements", prompt: "What code requirements apply to this monument sign?" },
    { icon: Wrench, label: "Assembly", prompt: "What's the best assembly sequence for this monument?" },
  ],
  "dimensional": [
    { icon: Box, label: "Material Selection", prompt: "What material should I use for this dimensional letter project?" },
    { icon: Ruler, label: "Standoff Sizing", prompt: "What standoff size should I use?" },
    { icon: Wrench, label: "Pattern/Template", prompt: "How do I create a mounting pattern?" },
    { icon: Settings, label: "Finishing", prompt: "What finish options work best here?" },
  ],
  "installation": [
    { icon: Wrench, label: "Wall Type", prompt: "How do I mount to this wall type?" },
    { icon: Ruler, label: "Height/Positioning", prompt: "What's the right mounting height and position?" },
    { icon: Zap, label: "Electrical Hookup", prompt: "How do I connect the electrical?" },
    { icon: ShieldCheck, label: "Safety", prompt: "What safety considerations do I need for this install?" },
  ],
  "other": [
    { icon: HelpCircle, label: "Describe Project", prompt: "Let me describe my project in more detail" },
    { icon: DollarSign, label: "Estimating Help", prompt: "I need help estimating this job" },
    { icon: Users, label: "Client Question", prompt: "I have a client asking something I'm not sure about" },
    { icon: Settings, label: "Technical Issue", prompt: "I'm troubleshooting a technical issue" },
  ],
};

// Follow-up shortcuts based on professional-training selection
const professionalTrainingFollowUps: Record<string, FollowUpShortcut[]> = {
  "fabrication": [
    { icon: Box, label: "Channel Letters", prompt: "Teach me the basics of channel letter fabrication" },
    { icon: Wrench, label: "Bending/Forming", prompt: "How do I bend and form aluminum returns?" },
    { icon: Settings, label: "Equipment Basics", prompt: "What equipment do I need to start fabricating?" },
    { icon: ShieldCheck, label: "Safety Practices", prompt: "What safety practices should I follow in the shop?" },
  ],
  "led-electrical": [
    { icon: Zap, label: "LED Basics", prompt: "Explain LED modules and how to choose them" },
    { icon: Settings, label: "Power Supplies", prompt: "How do I calculate power supply requirements?" },
    { icon: Wrench, label: "Wiring", prompt: "What's the proper way to wire LED modules?" },
    { icon: ShieldCheck, label: "Code/Safety", prompt: "What electrical codes apply to sign work?" },
  ],
  "materials": [
    { icon: Box, label: "Aluminum", prompt: "Tell me about aluminum options for signs" },
    { icon: Sparkles, label: "Acrylic/Plastics", prompt: "What acrylics and plastics are used in signs?" },
    { icon: Palette, label: "Vinyl/Film", prompt: "Explain vinyl and film options" },
    { icon: ShieldCheck, label: "Outdoor Durability", prompt: "Which materials hold up best outdoors?" },
  ],
  "installation": [
    { icon: Wrench, label: "Mounting Methods", prompt: "What are the different mounting methods for signs?" },
    { icon: Building2, label: "Wall Types", prompt: "How do I mount to different wall types?" },
    { icon: Ruler, label: "Leveling/Layout", prompt: "How do I properly level and layout a sign?" },
    { icon: ShieldCheck, label: "Lift/Crane Work", prompt: "What should I know about lift and crane work?" },
  ],
  "estimating": [
    { icon: DollarSign, label: "Pricing Basics", prompt: "How do I price a sign job?" },
    { icon: Clock, label: "Time Estimation", prompt: "How do I estimate fabrication time?" },
    { icon: Box, label: "Material Takeoff", prompt: "How do I do a material takeoff?" },
    { icon: Users, label: "Presenting Quotes", prompt: "How do I present quotes to clients?" },
  ],
  "other": [
    { icon: HelpCircle, label: "Pick a Topic", prompt: "What topics are most important for beginners?" },
    { icon: Users, label: "Industry Basics", prompt: "Give me an overview of the sign industry" },
    { icon: Building2, label: "Shop Setup", prompt: "What do I need to set up a sign shop?" },
    { icon: Settings, label: "Tools/Software", prompt: "What tools and software do sign makers use?" },
  ],
};

// Follow-up shortcuts based on freelancer selection
const freelancerFollowUps: Record<string, FollowUpShortcut[]> = {
  "installation": [
    { icon: MapPin, label: "Service Area", prompt: "I serve the following area..." },
    { icon: Wrench, label: "Equipment/Lift", prompt: "I have the following equipment: ladder/lift/crane..." },
    { icon: Users, label: "Crew Size", prompt: "I work solo / have a crew of..." },
    { icon: Mail, label: "Email Contact", prompt: "The best way to reach me is by email at..." },
  ],
  "fabrication": [
    { icon: MapPin, label: "Location", prompt: "My shop is located in..." },
    { icon: Settings, label: "Capabilities", prompt: "My fabrication capabilities include..." },
    { icon: Clock, label: "Turnaround", prompt: "My typical turnaround time is..." },
    { icon: Mail, label: "Email Contact", prompt: "Here's my email for job inquiries..." },
  ],
  "design": [
    { icon: Palette, label: "Portfolio", prompt: "I can share my portfolio or samples..." },
    { icon: Settings, label: "Software", prompt: "I work with the following design software..." },
    { icon: Clock, label: "Turnaround", prompt: "My typical design turnaround is..." },
    { icon: Mail, label: "Email Contact", prompt: "The best way to send me design requests is by email..." },
  ],
  "brokering": [
    { icon: MapPin, label: "Territory", prompt: "I broker in the following territory..." },
    { icon: Users, label: "Vendor Network", prompt: "I have vendors for the following sign types..." },
    { icon: Building2, label: "Client Types", prompt: "I typically work with these client types..." },
    { icon: Mail, label: "Email Contact", prompt: "Here's my email to send me opportunities..." },
  ],
  "all": [
    { icon: Wrench, label: "Primary Service", prompt: "My primary service is..." },
    { icon: MapPin, label: "Location/Area", prompt: "I'm based in / serve..." },
    { icon: Users, label: "Availability", prompt: "My current availability is..." },
    { icon: Mail, label: "Email Contact", prompt: "The best way to reach me is by email at..." },
  ],
};

const getFollowUpShortcuts = (
  userType: "shopper" | "professional-active" | "professional-training" | "freelancer",
  initialSelection: string
): FollowUpShortcut[] => {
  switch (userType) {
    case "shopper":
      return shopperFollowUps[initialSelection] || shopperFollowUps["not-sure"];
    case "professional-active":
      return professionalActiveFollowUps[initialSelection] || professionalActiveFollowUps["other"];
    case "professional-training":
      return professionalTrainingFollowUps[initialSelection] || professionalTrainingFollowUps["other"];
    case "freelancer":
      return freelancerFollowUps[initialSelection] || freelancerFollowUps["all"];
    default:
      return [];
  }
};

const FollowUpShortcuts = ({ 
  initialSelection, 
  userType, 
  onSelectShortcut, 
  onSkip 
}: FollowUpShortcutsProps) => {
  const shortcuts = getFollowUpShortcuts(userType, initialSelection);

  if (shortcuts.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 mt-2 mb-2">
      <p className="text-xs text-muted-foreground">Quick follow-ups:</p>
      
      <div className="flex flex-wrap gap-2 justify-center max-w-xl">
        {shortcuts.map((item, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelectShortcut(item.prompt)}
            className="flex items-center gap-1.5 text-xs transition-all px-3 py-1.5 h-auto"
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
            <item.icon className="h-3 w-3 text-primary" />
            {item.label}
          </Button>
        ))}
      </div>

      <button
        onClick={onSkip}
        className="text-xs transition-colors hover:underline"
        style={{ color: '#666' }}
      >
        I'll type my own question
      </button>
    </div>
  );
};

export default FollowUpShortcuts;
