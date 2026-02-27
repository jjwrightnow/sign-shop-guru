import { useState, useRef, useEffect } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatMessage, { type ChoiceCard } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import IntakeFormModal from "@/components/IntakeFormModal";
import SlideOutMenu from "@/components/SlideOutMenu";
import TrainMePanel from "@/components/TrainMePanel";
import SmartShortcuts from "@/components/SmartShortcuts";
import FollowUpShortcuts from "@/components/FollowUpShortcuts";
import SpecSummary from "@/components/SpecSummary";
import StepProgress from "@/components/StepProgress";
import { GlossaryProvider, useGlossary } from "@/components/GlossaryContext";
import { GlossaryPanel } from "@/components/GlossaryPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const N8N_CHAT_URL = "https://americanveteranowned.app.n8n.cloud/webhook/09cb1d89-72cc-4b58-a391-2a6f3e688bc4/chat";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  dbId?: string;
  choiceCards?: ChoiceCard[];
  choiceType?: "single" | "grid";
  choicesUsed?: boolean;
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

const FLOW_STAGES: Record<number, {
  aiMessage: string;
  choiceCards: ChoiceCard[];
  choiceType: "single" | "grid";
  specsKey?: string;
}> = {
  0: {
    aiMessage: "Hey, I'm LetterMan — your sign industry guide. What are we working on today?",
    choiceCards: [
      { id: "upload",    label: "Upload Artwork",     icon: "📎", sublabel: "PDF, AI, EPS, PNG, JPG" },
      { id: "describe",  label: "Describe My Sign",   icon: "✏️", sublabel: "I'll guide you through it" },
      { id: "pro",       label: "I'm a Pro",          icon: "⚡", sublabel: "I know my specs" },
      { id: "questions", label: "Just Browsing",      icon: "🔍", sublabel: "Learning about sign types" },
    ],
    choiceType: "grid",
  },
  1: {
    aiMessage: "Is this sign going inside or outside?",
    choiceCards: [
      { id: "interior", label: "Interior",  icon: "🏢", sublabel: "Lobby, retail, restaurant" },
      { id: "exterior", label: "Exterior",  icon: "🌧",  sublabel: "Storefront, monument, outdoor" },
      { id: "both",     label: "Both",      icon: "↔️",  sublabel: "Multiple locations" },
    ],
    choiceType: "single",
    specsKey: "environment",
  },
  2: {
    aiMessage: "How do you want your sign to light up? These are the most popular options — or I can show you all 16.",
    choiceCards: [
      { id: "halo",      label: "Halo Lit",     sublabel: "Glow behind the letter",   icon: "💡" },
      { id: "face",      label: "Face Lit",      sublabel: "Bright face illumination", icon: "💡" },
      { id: "face_halo", label: "Face + Halo",   sublabel: "Maximum impact",           icon: "💡" },
      { id: "non_lit",   label: "Non-Illuminated", sublabel: "Pure metal, no LEDs",   icon: "💡" },
      { id: "faux_neon", label: "Faux Neon",     sublabel: "LED flex tube, lower cost", icon: "💡" },
      { id: "show_all",  label: "Show All 16 →", sublabel: "See every option",         icon: "⋯" },
    ],
    choiceType: "grid",
    specsKey: "lighting_profile",
  },
  3: {
    aiMessage: "What's your approximate budget for this project? This helps me guide you toward the right options — it's not a commitment.",
    choiceCards: [
      { id: "under_1k",  label: "Under $1,000",    sublabel: "Faux Neon range",         icon: "💡" },
      { id: "1k_2500",   label: "$1,000 – $2,500",  sublabel: "Entry metal signs",       icon: "✦" },
      { id: "2500_5k",   label: "$2,500 – $5,000",  sublabel: "Premium profiles",        icon: "✦✦" },
      { id: "5k_plus",   label: "$5,000+",           sublabel: "Multi-sign, luxury spec", icon: "✦✦✦" },
    ],
    choiceType: "grid",
    specsKey: "budget",
  },
  4: {
    aiMessage: "What metal are you thinking? Most popular for exterior signs is brushed stainless.",
    choiceCards: [
      { id: "ss304",    label: "Stainless 304",    sublabel: "Most popular · Interior/Exterior", icon: "◈" },
      { id: "ss316",    label: "Stainless 316",    sublabel: "Coastal/marine grade",             icon: "◈" },
      { id: "brass",    label: "Brass",             sublabel: "Warm gold · Interior",             icon: "◈" },
      { id: "copper",   label: "Copper",            sublabel: "Rich tone · Patinas over time",    icon: "◈" },
      { id: "titanium", label: "Titanium PVD",      sublabel: "Ultra-premium · Gold/Black/Rose",  icon: "◈" },
      { id: "corten",   label: "Corten Steel",      sublabel: "Weathered rust · Exterior",        icon: "◈" },
    ],
    choiceType: "grid",
    specsKey: "material",
  },
  5: {
    aiMessage: "Roughly how tall are the letters? This affects fabrication complexity and cost range.",
    choiceCards: [
      { id: "3_5",    label: "3\" – 5\"",   sublabel: "Small, fine detail",    icon: "↕" },
      { id: "6_8",    label: "6\" – 8\"",   sublabel: "Standard storefront",   icon: "↕" },
      { id: "9_12",   label: "9\" – 12\"",  sublabel: "High visibility",       icon: "↕" },
      { id: "12plus", label: "12\" +",      sublabel: "Monument / landmark",   icon: "↕" },
    ],
    choiceType: "grid",
    specsKey: "height",
  },
  6: {
    aiMessage: "How will the sign mount to the wall?",
    choiceCards: [
      { id: "standoff",  label: "Standoff Studs",  sublabel: "Gap from wall · Halo-ready",   icon: "⊕" },
      { id: "flush",     label: "Flush Mount",      sublabel: "Flat against surface",          icon: "⊕" },
      { id: "raceway",   label: "Raceway Box",      sublabel: "Conceals all wiring",           icon: "⊕" },
      { id: "not_sure",  label: "Not Sure",         sublabel: "Factory will recommend",        icon: "?" },
    ],
    choiceType: "grid",
    specsKey: "mounting",
  },
  7: {
    aiMessage: "When do you need this? This helps us route your quote to the right production queue.",
    choiceCards: [
      { id: "asap",     label: "ASAP",           sublabel: "Rush — contact us to discuss", icon: "🔥" },
      { id: "2_4wk",    label: "2 – 4 weeks",    sublabel: "Standard lead time",           icon: "📅" },
      { id: "1_2mo",    label: "1 – 2 months",   sublabel: "Normal planning cycle",        icon: "📅" },
      { id: "planning", label: "Just Planning",  sublabel: "No rush, early stage",         icon: "💭" },
    ],
    choiceType: "grid",
    specsKey: "timeline",
  },
};

const sendToLetterMan = async (message: string, sessionId: string): Promise<string> => {
  try {
    const res = await fetch(N8N_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatInput: message,
        sessionId: sessionId,
      }),
    });
    const data = await res.json();
    return data.output || data.text || data.message || "I didn't catch that — could you rephrase?";
  } catch {
    return "Something went wrong. Please try again.";
  }
};

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  content: FLOW_STAGES[0].aiMessage,
  isUser: false,
  choiceCards: FLOW_STAGES[0].choiceCards,
  choiceType: FLOW_STAGES[0].choiceType,
  choicesUsed: false,
};

const IndexContent = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showTrainMe, setShowTrainMe] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [transcriptSending, setTranscriptSending] = useState(false);
  const [transcriptAlreadySent, setTranscriptAlreadySent] = useState(false);
  const [shortcutsSkipped, setShortcutsSkipped] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState<string | null>(null);
  const [followUpSkipped, setFollowUpSkipped] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showFullGlossary, setShowFullGlossary] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showMobileSpec, setShowMobileSpec] = useState(false);

  const { selectedTerm, setSelectedTerm } = useGlossary();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Check for returning user on mount
  useEffect(() => {
    const checkReturningUser = async () => {
      const storedEmail = localStorage.getItem("signmaker_user_email");
      if (storedEmail) {
        try {
          const { data: userData, error: userError } = await supabase.functions.invoke("get-user-by-email", {
            body: { email: storedEmail },
          });

          if (userError || !userData?.user) return;

          const user = userData.user;

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
        setShortcutsSkipped(true);
        setSelectedShortcut(null);
        setFollowUpSkipped(true);
      } else {
        setMessages([INITIAL_MESSAGE]);
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
    setMessages([INITIAL_MESSAGE]);
    setShortcutsSkipped(false);
    setSelectedShortcut(null);
    setFollowUpSkipped(false);

    await loadUserConversations(data.userId);
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (!userData) return;

    setUserData({ ...userData, conversationId });
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
      setMessages([INITIAL_MESSAGE]);
      setCurrentStage(0);
      setSpecs({});
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
      // Send to n8n LetterMan
      const aiResponse = await sendToLetterMan(content, userData?.conversationId || sessionId);

      // Also save to Supabase for persistence
      try {
        await supabase.functions.invoke("chat", {
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
      } catch (e) {
        console.error("Error saving to Supabase:", e);
      }

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
        content: aiResponse,
        isUser: false,
        dbId: dbMessageId,
      };
      setMessages((prev) => [...prev, assistantMessage]);

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

  const handleForgetMe = () => {
    localStorage.removeItem("signmaker_user_email");
    setUserData(null);
    setMessages([INITIAL_MESSAGE]);
    setConversations([]);
    setTranscriptAlreadySent(false);
    toast({ description: "Done. You'll see the signup form next time." });
  };

  const handleEmailTranscript = async () => {
    if (!userData || transcriptSending) return;
    
    if (transcriptAlreadySent) {
      toast({ description: `Already sent to ${userData.email}` });
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
        toast({ description: `Already sent to ${userData.email}` });
      } else if (data?.success) {
        setTranscriptAlreadySent(true);
        toast({ description: `Sent! Check your inbox at ${userData.email}` });
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
    if (userData.experienceLevel === 'shopper' || userData.intent === 'shopping') return "shopper";
    if (userData.experienceLevel === 'freelancer' || userData.intent === 'leads') return "freelancer";
    if (userData.intent === 'active') return "professional-active";
    if (userData.intent === 'training') return "professional-training";
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

  // Choice card selection handler
  const handleChoiceSelect = (card: ChoiceCard) => {
    // Mark current stage cards as used
    setMessages(prev => prev.map(msg =>
      msg.choiceCards && !msg.choicesUsed
        ? { ...msg, choicesUsed: true }
        : msg
    ));

    // Add user message showing their choice
    const userMsg: Message = {
      id: Date.now().toString(),
      content: card.label + (card.sublabel ? ` — ${card.sublabel}` : ""),
      isUser: true,
    };
    setMessages(prev => [...prev, userMsg]);

    // Update specs strip
    const stage = FLOW_STAGES[currentStage];
    if (stage?.specsKey) {
      setSpecs(prev => ({ ...prev, [stage.specsKey!]: card.label }));
    }

    // Handle special cards
    if (card.id === "upload") {
      // For now just send as message
      handleSend("I'd like to upload my artwork file.");
      return;
    }

    if (card.id === "pro") {
      handleSend("I'm a sign industry professional. I know my specs.");
      return;
    }

    if (card.id === "show_all") {
      handleSend("Show me all 16 lighting profiles");
      return;
    }

    // Budget tier — send to LetterMan for contextual guidance
    if (currentStage === 3) {
      const budgetContext: Record<string, string> = {
        "under_1k":  "My budget is under $1,000. What are my realistic options?",
        "1k_2500":   "My budget is $1,000 to $2,500.",
        "2500_5k":   "My budget is $2,500 to $5,000.",
        "5k_plus":   "My budget is $5,000 or more.",
      };
      handleSend(budgetContext[card.id] || card.label);
      return;
    }

    // Advance stage and show next question
    const nextStage = currentStage + 1;
    if (nextStage <= 7) {
      setCurrentStage(nextStage);
      const next = FLOW_STAGES[nextStage];
      if (next) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            content: next.aiMessage,
            isUser: false,
            choiceCards: next.choiceCards,
            choiceType: next.choiceType,
            choicesUsed: false,
          };
          setMessages(prev => [...prev, aiMsg]);
          // Also send to LetterMan for memory
          sendToLetterMan(`User selected: ${card.label}`, userData?.conversationId || sessionId);
        }, 800);
      }
    } else {
      handleSubmitQuote();
    }
  };

  const handleSubmitQuote = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const summary = Object.entries(specs)
        .filter(([, v]) => v && v !== "—")
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");

      const aiMsg: Message = {
        id: Date.now().toString(),
        content: `Here's what I have:\n\n${summary}\n\nYour quote request has been sent to our team. You'll receive a detailed quote by email — typically within 1 business day. Is there anything else you'd like to add or change?`,
        isUser: false,
      };
      setMessages(prev => [...prev, aiMsg]);

      // POST to n8n quote submission webhook
      fetch("https://americanveteranowned.app.n8n.cloud/webhook/quote-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "sign-shop-guru",
          specs,
          email: userData?.email || null,
          name: userData?.name || null,
          conversationId: userData?.conversationId || null,
          submitted_at: new Date().toISOString(),
        }),
      }).catch(() => {});
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <IntakeFormModal open={!userData} onComplete={handleIntakeComplete} />
      
      {userData && (
        <>
          <SlideOutMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            conversations={conversations}
            activeConversationId={userData.conversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onGlossaryClick={handleGlossaryClick}
            onEmailTranscript={messages.length > 2 ? handleEmailTranscript : undefined}
            onForgetMe={handleForgetMe}
            transcriptSending={transcriptSending}
            transcriptAlreadySent={transcriptAlreadySent}
          />
          
          {isSignProfessional && (
            <TrainMePanel
              open={showTrainMe}
              onClose={() => setShowTrainMe(false)}
              userId={userData.userId}
              onTrainingComplete={() => setIsTrained(true)}
            />
          )}
        </>
      )}

      {/* Header */}
      <ChatHeader onMenuClick={userData ? () => setMenuOpen(true) : undefined} />

      {/* Mobile spec pill */}
      {Object.values(specs).some(v => v && v !== "—") && (
        <div
          onClick={() => setShowMobileSpec(prev => !prev)}
          className="md:hidden mx-4 mb-2 px-3 py-1.5 rounded-full border border-amber-500/40
                     bg-amber-500/10 text-amber-400 text-xs cursor-pointer truncate"
        >
          {Object.entries(specs)
            .filter(([, v]) => v && v !== "—")
            .map(([, v]) => v)
            .join(" · ")}
        </div>
      )}

      {/* Mobile spec backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          showMobileSpec ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setShowMobileSpec(false)}
        aria-hidden="true"
      />
      {/* Mobile spec bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-2xl z-50 transition-transform duration-300 ease-out flex flex-col max-h-[80vh] pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:hidden ${
          showMobileSpec ? "translate-y-0 shadow-2xl shadow-amber-500/10" : "translate-y-full"
        }`}
      >
        <div
          className="w-full flex justify-center pt-4 pb-2 cursor-pointer"
          onClick={() => setShowMobileSpec(false)}
        >
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>
        <div className="flex-1 overflow-hidden">
          <SpecSummary
            specs={specs}
            visible={true}
            onSubmit={() => {
              setShowMobileSpec(false);
              handleSubmitQuote();
            }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Step progress bar */}
          <StepProgress currentStep={currentStage} />

          {/* Messages */}
          <main className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-[760px] mx-auto py-6 px-4">
              <div className="flex flex-col gap-6">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    content={message.content}
                    isUser={message.isUser}
                    showFeedback={!message.isUser && index === messages.length - 1 && !isTyping}
                    messageId={message.dbId}
                    userId={userData?.userId}
                    conversationId={userData?.conversationId}
                    choiceCards={message.choiceCards}
                    choiceType={message.choiceType}
                    choicesUsed={message.choicesUsed}
                    onChoiceSelect={handleChoiceSelect}
                  />
                ))}
                
                
                {isTyping && <TypingIndicator />}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          </main>
          
          {/* Input bar */}
          <div className="border-t border-border bg-background">
            <ChatInput ref={textareaRef} onSend={handleSend} disabled={isTyping || !userData} />
          </div>
        </div>

        {/* Spec strip — desktop only */}
        <div className="hidden md:flex w-[280px] border-l border-border flex-col overflow-y-auto">
          <SpecSummary specs={specs} visible={true} onSubmit={handleSubmitQuote} />
        </div>
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
