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
    </div>
  );
};

export default ConversationSidebar;