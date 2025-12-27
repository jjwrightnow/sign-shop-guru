import { useState, useRef, useEffect } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import IntakeFormModal from "@/components/IntakeFormModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  dbId?: string;
}

interface UserData {
  userId: string;
  conversationId: string;
  name: string;
  experienceLevel: string;
  intent: string;
}

const Index = () => {
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastAssistantMessageId, setLastAssistantMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleIntakeComplete = (data: UserData) => {
    setUserData(data);
    
    // Set personalized welcome message
    const welcomeMessage = `Hey ${data.name} — I help with signage and fabrication questions. What would you like to know?`;
    setMessages([{ id: "welcome", content: welcomeMessage, isUser: false }]);
  };

  const handleSend = async (content: string) => {
    if (!userData) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      isUser: true,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          question: content,
          user_context: {
            name: userData.name,
            experience_level: userData.experienceLevel,
            intent: userData.intent,
          },
          conversation_id: userData.conversationId,
        },
      });

      if (error) throw error;

      // Get the latest message ID from the database for feedback
      const { data: messagesData } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", userData.conversationId)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(1);

      const dbMessageId = messagesData?.[0]?.id;
      setLastAssistantMessageId(dbMessageId || null);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.response,
        isUser: false,
        dbId: dbMessageId,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <IntakeFormModal open={!userData} onComplete={handleIntakeComplete} />
      
      <ChatHeader />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                showFeedback={!message.isUser && index === messages.length - 1 && !isTyping}
                messageId={message.dbId}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>
      
      <ChatInput onSend={handleSend} disabled={isTyping || !userData} />
    </div>
  );
};

export default Index;
