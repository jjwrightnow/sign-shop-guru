import { useState, useRef, useEffect } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import IntakeFormModal from "@/components/IntakeFormModal";
import ConversationSidebar from "@/components/ConversationSidebar";
import OptInPrompt from "@/components/OptInPrompt";
import TrainMePanel from "@/components/TrainMePanel";
import SmartShortcuts from "@/components/SmartShortcuts";
import FollowUpShortcuts from "@/components/FollowUpShortcuts";
import { GlossaryProvider, useGlossary } from "@/components/GlossaryContext";
import { GlossaryPanel } from "@/components/GlossaryPanel";
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
  email: string;
}

interface ConversationData {
  id: string;
  created_at: string;
  first_message?: string;
  message_count?: number;
}

const IndexContent = () => {
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showOptIn, setShowOptIn] = useState(false);
  const [optInDismissed, setOptInDismissed] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showTrainMe, setShowTrainMe] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [transcriptSending, setTranscriptSending] = useState(false);
  const [transcriptAlreadySent, setTranscriptAlreadySent] = useState(false);
  const [shortcutsSkipped, setShortcutsSkipped] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState<string | null>(null);
  const [followUpSkipped, setFollowUpSkipped] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showFullGlossary, setShowFullGlossary] = useState(false);
  
  const { selectedTerm, setSelectedTerm } = useGlossary();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, showOptIn]);

  // Check for returning user on mount
  useEffect(() => {
    const checkReturningUser = async () => {
      const storedEmail = localStorage.getItem("signmaker_user_email");
      if (storedEmail) {
        try {
          const { data: userData, error: userError } = await supabase.functions.invoke("get-user-by-email", {
            body: { email: storedEmail },
          });

          if (userError || !userData?.user) {
            console.log("Could not verify returning user, starting fresh");
            return;
          }

          const user = userData.user;
          
          const optInDismissedStored = localStorage.getItem("signmaker_optin_dismissed");
          if (optInDismissedStored === "true") {
            setOptInDismissed(true);
          }

          const { data: convoData } = await supabase.functions.invoke("get-conversations", {
            body: { user_id: user.id },
          });

          const latestConvo = convoData?.conversations?.[0];

          if (latestConvo) {
            setUserData({
              userId: user.id,
              conversationId: latestConvo.id,
              name: user.name,
              experienceLevel: user.experience_level,
              intent: user.intent,
              email: storedEmail,
            });
            
            await loadConversationMessages(latestConvo.id, user.name);
            await loadUserConversations(user.id);
            await checkUserTrainingStatus(user.id);
          }
        } catch (error) {
          console.error("Error checking returning user:", error);
        }
      }
    };

    checkReturningUser();
  }, []);

  const checkUserTrainingStatus = async (userId: string) => {
    try {
      const { data } = await supabase.functions.invoke("user-context", {
        body: { action: "get", user_id: userId },
      });
      if (data?.context && data.context.length > 0) {
        setIsTrained(true);
      }
    } catch (error) {
      console.error("Error checking training status:", error);
    }
  };

  useEffect(() => {
    const userMessages = messages.filter(m => m.isUser).length;
    if (userMessages >= 5 && !optInDismissed) {
      setShowOptIn(true);
    }
  }, [messages, optInDismissed]);

  const loadUserConversations = async (userId: string) => {
    setIsLoadingConversations(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-conversations", {
        body: { user_id: userId },
      });

      if (error) throw error;

      const convos = data?.conversations || [];

      const conversationsWithPreview = await Promise.all(
        convos.map(async (conv: { id: string; created_at: string }) => {
          try {
            const { data: msgData } = await supabase.functions.invoke("get-messages", {
              body: { conversation_id: conv.id, user_id: userId },
            });
            const userMessages = (msgData?.messages || []).filter((m: any) => m.role === "user");
            return {
              id: conv.id,
              created_at: conv.created_at,
              first_message: userMessages[0]?.content || "",
              message_count: msgData?.messages?.length || 0,
            };
          } catch {
            return {
              id: conv.id,
              created_at: conv.created_at,
              first_message: "",
              message_count: 0,
            };
          }
        })
      );

      setConversations(conversationsWithPreview);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const getWelcomeMessage = (name: string, experienceLevel: string, intent: string): string => {
    if (experienceLevel === 'shopper' || intent === 'shopping') {
      return `Hey ${name} — I'll help you understand your sign options. What kind of sign are you thinking about?`;
    }
    if (experienceLevel === 'freelancer' || intent === 'leads') {
      return `Hey ${name} — I can help you find leads and connect with sign shops. What services do you offer?`;
    }
    if (intent === 'active') {
      return `Hey ${name} — I'm here to help with your project. What are you working on?`;
    }
    if (intent === 'training') {
      return `Hey ${name} — Ready to learn! What topic would you like to dive into?`;
    }
    return `Hey ${name} — I help with signage and fabrication questions. What would you like to know?`;
  };

  const loadConversationMessages = async (conversationId: string, userName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("get-messages", {
        body: { conversation_id: conversationId },
      });

      if (error) throw error;

      const dbMessages = data?.messages || [];
      if (dbMessages.length > 0) {
        const loadedMessages: Message[] = dbMessages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.role === "user",
          dbId: msg.id,
        }));
        setMessages(loadedMessages);
        setMessageCount(dbMessages.filter((m: any) => m.role === "user").length);
        setShortcutsSkipped(true);
        setSelectedShortcut(null);
        setFollowUpSkipped(true);
      } else {
        const welcomeMessage = getWelcomeMessage(
          userName, 
          userData?.experienceLevel || '', 
          userData?.intent || ''
        );
        setMessages([{ id: "welcome", content: welcomeMessage, isUser: false }]);
        setMessageCount(0);
        setShortcutsSkipped(false);
        setSelectedShortcut(null);
        setFollowUpSkipped(false);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleIntakeComplete = async (data: UserData) => {
    const storedEmail = localStorage.getItem("signmaker_user_email");
    if (!storedEmail && data.email) {
      localStorage.setItem("signmaker_user_email", data.email);
    }

    setUserData(data);
    
    const welcomeMessage = getWelcomeMessage(data.name, data.experienceLevel, data.intent);
    setMessages([{ id: "welcome", content: welcomeMessage, isUser: false }]);
    setMessageCount(0);
    setShortcutsSkipped(false);
    setSelectedShortcut(null);
    setFollowUpSkipped(false);

    await loadUserConversations(data.userId);
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (!userData) return;

    setUserData({ ...userData, conversationId });
    setShowOptIn(false);
    setTranscriptAlreadySent(false);
    await loadConversationMessages(conversationId, userData.name);
  };

  const handleNewChat = async () => {
    if (!userData) return;

    try {
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({ user_id: userData.userId })
        .select()
        .single();

      if (error) throw error;

      setUserData({ ...userData, conversationId: newConvo.id });
      
      const welcomeMessage = getWelcomeMessage(userData.name, userData.experienceLevel, userData.intent);
      setMessages([{ id: "welcome", content: welcomeMessage, isUser: false }]);
      setMessageCount(0);
      setShowOptIn(false);
      setTranscriptAlreadySent(false);
      setShortcutsSkipped(false);
      setSelectedShortcut(null);
      setFollowUpSkipped(false);

      await loadUserConversations(userData.userId);
    } catch (error: any) {
      console.error("Error creating new chat:", error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
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

      let dbMessageId: string | undefined;
      try {
        const { data: msgData } = await supabase.functions.invoke("get-messages", {
          body: { conversation_id: userData.conversationId },
        });
        const assistantMsgs = (msgData?.messages || [])
          .filter((m: any) => m.role === "assistant")
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        dbMessageId = assistantMsgs[0]?.id;
      } catch (e) {
        console.error("Error fetching message ID for feedback:", e);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.response,
        isUser: false,
        dbId: dbMessageId,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setMessageCount((prev) => prev + 1);

      await loadUserConversations(userData.userId);
    } catch (error: any) {
      console.error("Chat error:", error);
      
      let errorMessage = "Failed to get response. Please try again.";
      
      try {
        const errorBody = error.message?.includes('{') 
          ? JSON.parse(error.message.substring(error.message.indexOf('{')))
          : null;
        
        if (errorBody?.retryAfter) {
          errorMessage = `Please wait ${errorBody.retryAfter} seconds before sending another message.`;
        } else if (errorBody?.error) {
          errorMessage = errorBody.error;
        }
      } catch {
        if (error.message?.includes('429') || error.message?.toLowerCase().includes('wait')) {
          errorMessage = "Please wait a moment before sending another message.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Please slow down",
        description: errorMessage,
        variant: "destructive",
      });
      
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsTyping(false);
    }
  };

  const handleOptInDismiss = () => {
    setShowOptIn(false);
    setOptInDismissed(true);
    localStorage.setItem("signmaker_optin_dismissed", "true");
  };

  const handleTrainMeClick = () => {
    setShowTrainMe(true);
  };

  const handleTrainingComplete = () => {
    setIsTrained(true);
  };

  const handleForgetMe = () => {
    localStorage.removeItem("signmaker_user_email");
    setUserData(null);
    setMessages([]);
    setConversations([]);
    setTranscriptAlreadySent(false);
    toast({
      description: "Done. You'll see the signup form next time.",
    });
  };

  const handleEmailTranscript = async () => {
    if (!userData || transcriptSending) return;
    
    if (transcriptAlreadySent) {
      toast({
        description: `Already sent to ${userData.email}`,
      });
      return;
    }

    setTranscriptSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-transcript", {
        body: {
          conversation_id: userData.conversationId,
          user_email: userData.email,
          user_name: userData.name,
        },
      });

      if (error) throw error;

      if (data?.alreadySent) {
        setTranscriptAlreadySent(true);
        toast({
          description: `Already sent to ${userData.email}`,
        });
      } else if (data?.success) {
        setTranscriptAlreadySent(true);
        toast({
          description: `Sent! Check your inbox at ${userData.email}`,
        });
      } else {
        throw new Error(data?.error || "Failed to send transcript");
      }
    } catch (error: any) {
      console.error("Error sending transcript:", error);
      toast({
        title: "Error",
        description: "Failed to send transcript. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTranscriptSending(false);
    }
  };

  const isSignProfessional = userData && 
    userData.experienceLevel !== 'shopper' && 
    userData.experienceLevel !== 'freelancer' &&
    userData.intent !== 'shopping' &&
    userData.intent !== 'leads';

  const getSmartShortcutType = (): "shopper" | "professional-active" | "professional-training" | "freelancer" | null => {
    if (!userData) return null;
    
    if (userData.experienceLevel === 'shopper' || userData.intent === 'shopping') {
      return "shopper";
    }
    if (userData.experienceLevel === 'freelancer' || userData.intent === 'leads') {
      return "freelancer";
    }
    if (userData.intent === 'active') {
      return "professional-active";
    }
    if (userData.intent === 'training') {
      return "professional-training";
    }
    return null;
  };

  const smartShortcutType = getSmartShortcutType();
  const isFreshConversation = messages.length === 1 && !messages[0]?.isUser;
  const showSmartShortcuts = smartShortcutType && isFreshConversation && !isTyping && !shortcutsSkipped;

  const handleShortcutSelect = async (shortcut: { value: string; prompt: string }) => {
    if (!userData) return;
    
    setSelectedShortcut(shortcut.value);
    
    try {
      await supabase
        .from("conversations")
        .update({ shortcut_selected: shortcut.value })
        .eq("id", userData.conversationId);
    } catch (error) {
      console.error("Error tracking shortcut:", error);
    }
    
    handleSend(shortcut.prompt);
  };

  const handleShortcutsSkip = () => {
    setShortcutsSkipped(true);
  };

  const handleFollowUpSelect = (prompt: string) => {
    setFollowUpSkipped(true);
    handleSend(prompt);
  };

  const handleFollowUpSkip = () => {
    setFollowUpSkipped(true);
  };

  const showFollowUpShortcuts = selectedShortcut && 
    smartShortcutType && 
    messages.length === 3 && 
    !messages[messages.length - 1]?.isUser && 
    !isTyping && 
    !followUpSkipped;

  const handleGlossaryClick = () => {
    setShowFullGlossary(true);
    setShowGlossary(true);
    setSelectedTerm(null);
  };

  const handleGlossaryClose = () => {
    setShowGlossary(false);
    setShowFullGlossary(false);
    setSelectedTerm(null);
  };

  useEffect(() => {
    if (selectedTerm) {
      setShowGlossary(true);
      setShowFullGlossary(false);
    }
  }, [selectedTerm]);

  return (
    <div className="flex min-h-screen bg-background">
      <IntakeFormModal open={!userData} onComplete={handleIntakeComplete} />
      
      {userData && (
        <>
          <ConversationSidebar
            conversations={conversations}
            activeConversationId={userData.conversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            isLoading={isLoadingConversations}
            showOptIn={showOptIn}
            onOptInDismiss={handleOptInDismiss}
          />
          
          {isSignProfessional && (
            <TrainMePanel
              open={showTrainMe}
              onClose={() => setShowTrainMe(false)}
              userId={userData.userId}
              onTrainingComplete={handleTrainingComplete}
            />
          )}
        </>
      )}

      <div className="flex-1 flex flex-col">
        <ChatHeader 
          onTrainMeClick={isSignProfessional ? handleTrainMeClick : undefined}
          isTrained={isTrained}
          onForgetMe={userData ? handleForgetMe : undefined}
          onEmailTranscript={userData && messages.length > 2 ? handleEmailTranscript : undefined}
          transcriptSending={transcriptSending}
          transcriptAlreadySent={transcriptAlreadySent}
          userEmail={userData?.email}
          onGlossaryClick={userData ? handleGlossaryClick : undefined}
        />
        
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
                  userId={userData?.userId}
                  conversationId={userData?.conversationId}
                />
              ))}
              
              {showSmartShortcuts && smartShortcutType && (
                <SmartShortcuts 
                  userType={smartShortcutType}
                  onSelectShortcut={handleShortcutSelect}
                  onSkip={handleShortcutsSkip}
                />
              )}

              {showFollowUpShortcuts && smartShortcutType && selectedShortcut && (
                <FollowUpShortcuts
                  initialSelection={selectedShortcut}
                  userType={smartShortcutType}
                  onSelectShortcut={handleFollowUpSelect}
                  onSkip={handleFollowUpSkip}
                />
              )}
              
              {isTyping && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>
        
        <ChatInput onSend={handleSend} disabled={isTyping || !userData} />
      </div>

      {showGlossary && (
        <GlossaryPanel 
          onClose={handleGlossaryClose}
          showFullGlossary={showFullGlossary}
        />
      )}
    </div>
  );
};

const Index = () => {
  return (
    <GlossaryProvider>
      <IndexContent />
    </GlossaryProvider>
  );
};

export default Index;
