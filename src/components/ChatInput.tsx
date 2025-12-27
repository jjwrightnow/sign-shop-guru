import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your sign industry question..."
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl bg-muted border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50",
                "transition-all duration-200",
                "focus:neon-glow",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[48px] max-h-[200px]"
              )}
              style={{
                height: "auto",
                minHeight: "48px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
          </div>
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
          SignMaker.ai provides general guidance — always verify codes with local authorities.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
