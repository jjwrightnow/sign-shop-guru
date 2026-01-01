import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Plus, ChevronLeft, ChevronRight, ShieldCheck, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import OptInPrompt from "@/components/OptInPrompt";

interface Conversation {
  id: string;
  created_at: string;
  first_message?: string;
  message_count?: number;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
  showOptIn?: boolean;
  onOptInDismiss?: () => void;
}

const ConversationSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  isLoading,
  showOptIn = false,
  onOptInDismiss,
}: ConversationSidebarProps) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateText = (text: string, maxLength: number = 35) => {
    if (!text) return "New conversation";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div
      className={cn(
        "h-screen sticky top-0 border-r border-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-14" : "w-64"
      )}
      style={{ backgroundColor: '#1a1a1a' }}
    >
      {/* Opt-in prompt - above header */}
      {showOptIn && onOptInDismiss && (
        <OptInPrompt onDismiss={onOptInDismiss} isCollapsed={isCollapsed} />
      )}

      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-foreground">Your Conversations</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-2">
        <Button
          onClick={onNewChat}
          className={cn(
            "w-full text-primary-foreground transition-all",
            isCollapsed ? "px-0" : ""
          )}
          style={{ backgroundColor: '#00d4ff' }}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">New Chat</span>}
        </Button>
      </div>

      {/* My Notes Button */}
      <div className="px-2">
        <Button
          onClick={() => navigate("/notes")}
          variant="ghost"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-foreground",
            isCollapsed ? "px-0 justify-center" : ""
          )}
        >
          <FileText className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">📝 My Notes</span>}
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse text-muted-foreground text-sm">
                Loading...
              </div>
            </div>
          ) : conversations.length === 0 ? (
            !isCollapsed && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No conversations yet
              </p>
            )
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "w-full text-left rounded-lg p-2.5 transition-colors",
                  activeConversationId === conv.id
                    ? "bg-primary/20 border border-primary/30"
                    : "hover:bg-muted/50",
                  isCollapsed ? "flex justify-center" : ""
                )}
              >
                {isCollapsed ? (
                  <MessageSquare className={cn(
                    "h-4 w-4",
                    activeConversationId === conv.id ? "text-primary" : "text-muted-foreground"
                  )} />
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatDate(conv.created_at)}
                      </span>
                      {conv.message_count !== undefined && conv.message_count > 0 && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {conv.message_count} msgs
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground truncate">
                      {truncateText(conv.first_message || "")}
                    </p>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Privacy Notice */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground/80">Email-Only Communication</p>
              <p className="leading-relaxed">
                We never ask for phone numbers and will never call you. All communication is in writing via{" "}
                <a 
                  href="mailto:ask@signmaker.ai" 
                  className="text-primary hover:underline"
                >
                  ask@signmaker.ai
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationSidebar;