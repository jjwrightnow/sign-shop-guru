import { Zap, Menu } from "lucide-react";
import { useBranding } from "@/context/BrandingContext";

interface ChatHeaderProps {
  onMenuClick?: () => void;
}

const ChatHeader = ({ onMenuClick }: ChatHeaderProps) => {
  const { companyName, logoUrl } = useBranding();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center justify-between px-4 max-w-[760px] mx-auto">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-8 w-auto max-w-[140px] object-contain" />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
            </div>
          )}
          <h1 className="text-sm font-semibold text-foreground tracking-tight">
            {companyName}
          </h1>
        </div>

        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;