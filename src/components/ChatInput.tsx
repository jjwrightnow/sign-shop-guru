import { useState, useEffect, KeyboardEvent } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useBranding } from "@/context/BrandingContext";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
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

  // Line height ~20px, 3 rows min = 60px + 24px padding = 84px, 8 rows max = 160px + 24px = 184px
  const minHeight = 84;
  const maxHeight = 184;

  return (
    <div className="sticky bottom-0 w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Ask your sign industry question..."}
              disabled={disabled}
              rows={3}
              className={cn(
                "w-full resize-none rounded-xl bg-muted border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50",
                "transition-all duration-200",
                "focus:neon-glow",
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
          </div>
          
          {isSupported && (
            <button
              onClick={handleToggleListening}
              disabled={disabled}
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "active:scale-95",
            isListening
              ? "bg-red-500 text-white"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          
          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-primary text-primary-foreground font-medium",
              "hover:neon-glow-strong transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
              "active:scale-95"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          {companyName} provides general guidance — always verify codes with local authorities.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;