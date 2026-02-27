import React, { useState, useEffect, KeyboardEvent, forwardRef } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useBranding } from "@/context/BrandingContext";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({ onSend, disabled }, ref) => {
  const [message, setMessage] = useState("");
  const { companyName } = useBranding();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } =
    useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      resetTranscript();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const minHeight = 84;
  const maxHeight = 184;

  // Merge forwarded ref with internal needs
  const textareaRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    },
    [ref]
  );

  return (
    <div className="w-full bg-background border-t border-border/40 pt-3 pb-2">
      <div className="max-w-[760px] mx-auto px-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask your sign industry question..."}
            disabled={disabled}
            rows={3}
            className={cn(
              "w-full resize-none rounded-xl bg-muted border border-border px-4 py-3 pr-24 text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isListening && "border-red-500/50 ring-1 ring-red-500/30"
            )}
            style={{
              height: "auto",
              minHeight: `${minHeight}px`,
              maxHeight: `${maxHeight}px`,
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, maxHeight)}px`;
            }}
          />
          
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {isSupported && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleToggleListening}
                      disabled={disabled}
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        "transition-all duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        isListening
                          ? "bg-red-500 text-white animate-pulse"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Voice input — works best in Chrome.<br />Technical terms may need correction.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <button
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                "bg-primary text-primary-foreground",
                "transition-all duration-200",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "active:scale-95"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Quote delivered by email after factory review · No pricing shown
        </p>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
