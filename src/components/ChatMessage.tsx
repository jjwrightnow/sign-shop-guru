import { useState } from "react";
import { ThumbsUp, ThumbsDown, Zap, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlossaryHighlighter } from "./GlossaryHighlighter";
import { useBranding } from "@/context/BrandingContext";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  showFeedback?: boolean;
  messageId?: string;
  userId?: string;
  conversationId?: string;
}

// Parse message content for images and text
const parseMessageContent = (content: string) => {
  const parts: Array<{ type: 'text' | 'image'; content: string; url?: string; source?: string }> = [];
  
  const imagePattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)(?:\s*\n?\*(?:Source|Image source):\s*([^*]+)\*)?/gi;
  
  let lastIndex = 0;
  let match;
  
  while ((match = imagePattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) {
        parts.push({ type: 'text', content: textBefore });
      }
    }
    
    const url = match[2];
    const source = match[3]?.trim() || new URL(url).hostname;
    
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url) || 
                    url.includes('images') || 
                    url.includes('photo') ||
                    url.includes('img');
    
    if (isImage) {
      parts.push({ type: 'image', content: match[1], url, source });
    } else {
      parts.push({ type: 'text', content: match[0] });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) {
      parts.push({ type: 'text', content: remaining });
    }
  }
  
  return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
};

const ChatMessage = ({ content, isUser, showFeedback = false, messageId, userId, conversationId }: ChatMessageProps) => {
  const { toast } = useToast();
  const { botAvatarUrl } = useBranding();
  const [feedbackGiven, setFeedbackGiven] = useState<"helpful" | "not_helpful" | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleFeedback = async (rating: "helpful" | "not_helpful") => {
    if (feedbackGiven || !messageId) return;

    try {
      const { error } = await supabase.from("feedback").insert({
        message_id: messageId,
        rating,
      });

      if (error) throw error;

      setFeedbackGiven(rating);
      toast({ description: "Thanks for your feedback!" });
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  const parsedContent = parseMessageContent(content);

  return (
    <div className={cn(
      "flex gap-3 w-full animate-fade-in",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        botAvatarUrl ? (
          <img src={botAvatarUrl} alt="Bot" className="flex-shrink-0 w-7 h-7 rounded-full object-cover border border-primary/30 mt-1" />
        ) : (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center mt-1">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
        )
      )}
      
      <div className={cn(
        "rounded-2xl px-4 py-3 transition-all duration-300",
        isUser 
          ? "max-w-[75%] bg-primary/15 border border-primary/25 text-foreground ml-auto" 
          : "max-w-full bg-muted/50 text-foreground"
      )}>
        {parsedContent.map((part, index) => {
          if (part.type === 'image' && part.url && !imageErrors.has(part.url)) {
            return (
              <div key={index} className="my-3 first:mt-0 last:mb-0">
                <a href={part.url} target="_blank" rel="noopener noreferrer" className="block group">
                  <div className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                    <img 
                      src={part.url} alt={part.content}
                      className="w-full max-h-64 object-cover transition-transform group-hover:scale-105"
                      onError={() => handleImageError(part.url!)}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                      <span className="text-white text-xs font-medium">{part.content}</span>
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </a>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span>Source:</span>
                  <a href={part.url} target="_blank" rel="noopener noreferrer"
                    className="hover:text-primary transition-colors underline underline-offset-2">
                    {part.source}
                  </a>
                </p>
              </div>
            );
          }
          
          if (part.type === 'image' && part.url && imageErrors.has(part.url)) {
            return (
              <p key={index} className="text-sm leading-relaxed my-2">
                <a href={part.url} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1">
                  {part.content}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-xs text-muted-foreground ml-1">({part.source})</span>
              </p>
            );
          }
          
          if (!isUser) {
            return (
              <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">
                <GlossaryHighlighter text={part.content} userId={userId} conversationId={conversationId} />
              </p>
            );
          }
          
          return (
            <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">{part.content}</p>
          );
        })}
        
        {showFeedback && !isUser && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
            {feedbackGiven ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-primary" />
                <span>Feedback submitted</span>
              </div>
            ) : (
              <>
                <button onClick={() => handleFeedback("helpful")}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors group">
                  <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
                <button onClick={() => handleFeedback("not_helpful")}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors group">
                  <ThumbsDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-secondary transition-colors" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;