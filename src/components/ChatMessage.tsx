import { useState } from "react";
import { ThumbsUp, ThumbsDown, Zap, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  showFeedback?: boolean;
  messageId?: string;
}

const ChatMessage = ({ content, isUser, showFeedback = false, messageId }: ChatMessageProps) => {
  const { toast } = useToast();
  const [feedbackGiven, setFeedbackGiven] = useState<"helpful" | "not_helpful" | null>(null);

  const handleFeedback = async (rating: "helpful" | "not_helpful") => {
    if (feedbackGiven || !messageId) return;

    try {
      const { error } = await supabase.from("feedback").insert({
        message_id: messageId,
        rating,
      });

      if (error) throw error;

      setFeedbackGiven(rating);
      toast({
        description: "Thanks for your feedback!",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

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
            {feedbackGiven ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-primary" />
                <span>Feedback submitted</span>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => handleFeedback("helpful")}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors group"
                >
                  <ThumbsUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
                <button 
                  onClick={() => handleFeedback("not_helpful")}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors group"
                >
                  <ThumbsDown className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
                </button>
              </>
            )}
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
