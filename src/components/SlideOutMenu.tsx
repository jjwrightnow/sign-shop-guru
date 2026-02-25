import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, MessageSquare, FileText, BookOpen, Mail, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: string;
  created_at: string;
  first_message?: string;
  message_count?: number;
}

interface SlideOutMenuProps {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onGlossaryClick?: () => void;
  onEmailTranscript?: () => void;
  onForgetMe?: () => void;
  transcriptSending?: boolean;
  transcriptAlreadySent?: boolean;
}

const SlideOutMenu = ({
  open,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onGlossaryClick,
  onEmailTranscript,
  onForgetMe,
  transcriptSending,
  transcriptAlreadySent,
}: SlideOutMenuProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const truncate = (text: string, max = 40) => {
    if (!text) return "New conversation";
    return text.length > max ? text.substring(0, max) + "…" : text;
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 left-0 z-[70] h-full w-[280px] bg-card border-r border-border flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <span className="text-sm font-semibold text-foreground">Menu</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversations */}
        <div className="px-3 pb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">History</span>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-0.5 pb-3">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2 transition-colors text-sm",
                    activeConversationId === conv.id
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate flex-1">{truncate(conv.first_message || "")}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-5.5">
                    {formatDate(conv.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Divider + links */}
        <div className="border-t border-border/50 p-3 space-y-0.5">
          <button
            onClick={() => { navigate("/notes"); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            My Notes
          </button>

          {onGlossaryClick && (
            <button
              onClick={() => { onGlossaryClick(); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Glossary
            </button>
          )}

          {onEmailTranscript && (
            <button
              onClick={() => { onEmailTranscript(); onClose(); }}
              disabled={transcriptSending}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              {transcriptSending ? "Sending…" : transcriptAlreadySent ? "Transcript Sent ✓" : "Email Transcript"}
            </button>
          )}

          {onForgetMe && (
            <button
              onClick={() => { onForgetMe(); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <UserX className="w-4 h-4" />
              Forget Me
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default SlideOutMenu;