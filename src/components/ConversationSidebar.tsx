import { useState } from "react";
import { MessageSquare, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

const ConversationSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  isLoading,
}: ConversationSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 40) => {
    if (!text) return "New conversation";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div
      className={cn(
        "h-full bg-surface border-r border-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
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
            "w-full bg-primary text-primary-foreground hover:neon-glow-strong transition-all",
            isCollapsed ? "px-0" : ""
          )}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">New Chat</span>}
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
                  "w-full text-left rounded-lg p-2 transition-colors",
                  activeConversationId === conv.id
                    ? "bg-primary/20 border border-primary/30"
                    : "hover:bg-muted",
                  isCollapsed ? "flex justify-center" : ""
                )}
              >
                {isCollapsed ? (
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <>
                    <p className="text-sm text-foreground truncate">
                      {truncateText(conv.first_message || "")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(conv.created_at)}
                    </p>
                  </>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationSidebar;
