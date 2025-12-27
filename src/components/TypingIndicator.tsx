import { Zap } from "lucide-react";

const TypingIndicator = () => {
  return (
    <div className="flex gap-3 w-full justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
        <Zap className="w-4 h-4 text-primary" />
      </div>
      <div className="bg-bubble-assistant rounded-xl px-4 py-3 flex items-center gap-1.5">
        <span 
          className="w-2 h-2 rounded-full bg-primary animate-typing-dot"
          style={{ animationDelay: "0ms" }}
        />
        <span 
          className="w-2 h-2 rounded-full bg-primary animate-typing-dot"
          style={{ animationDelay: "200ms" }}
        />
        <span 
          className="w-2 h-2 rounded-full bg-primary animate-typing-dot"
          style={{ animationDelay: "400ms" }}
        />
      </div>
    </div>
  );
};

export default TypingIndicator;
