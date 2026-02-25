import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/context/BrandingContext";

interface OptInPromptProps {
  onDismiss: () => void;
  isCollapsed?: boolean;
}

const OptInPrompt = ({ onDismiss, isCollapsed = false }: OptInPromptProps) => {
  const { supportEmail } = useBranding();

  const handleEmailClick = () => {
    window.location.href = `mailto:${supportEmail}`;
  };

  if (isCollapsed) {
    return (
      <div className="p-2">
        <Button
          onClick={handleEmailClick}
          size="icon"
          variant="ghost"
          className="w-full h-8 text-primary hover:text-primary hover:bg-primary/10"
          title="Email us"
        >
          <Mail className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-2 bg-primary/10 border border-primary/20 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-foreground font-medium text-xs mb-1">
            Finding this helpful?
          </p>
          <p className="text-muted-foreground text-xs">
            Questions? Email us anytime.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground p-0.5"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <Button
        onClick={handleEmailClick}
        size="sm"
        className="w-full mt-2 bg-primary text-primary-foreground text-xs h-7"
      >
        <Mail className="w-3 h-3 mr-1.5" />
        {supportEmail}
      </Button>
    </div>
  );
};

export default OptInPrompt;