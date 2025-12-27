import { ThumbsUp, ThumbsDown, Zap, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  showFeedback?: boolean;
}

const ChatMessage = ({ content, isUser, showFeedback = false }: ChatMessageProps) => {
  return (
    <div className={cn("flex gap-3 w-full", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[80%] md:max-w-[70%] rounded-xl px-4 py-3",
        isUser 
          ? "bg-bubble-user border border-bubble-user-border text-foreground" 
          : "bg-bubble-assistant text-foreground"
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        
        {showFeedback && !isUser && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
            <button className="p-1.5 rounded-md hover:bg-muted transition-colors group">
              <ThumbsUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-muted transition-colors group">
              <ThumbsDown className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
            </button>
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
          <User className="w-4 h-4 text-secondary" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
