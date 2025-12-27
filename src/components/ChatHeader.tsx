import { Zap } from "lucide-react";

const ChatHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                SignMaker<span className="text-primary">.ai</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-secondary/20 text-secondary border border-secondary/30 rounded-full">
                Beta
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Industry Q&A Assistant</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
