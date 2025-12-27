import { useState, useRef, useEffect } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

const WELCOME_MESSAGE = `Hey there — I'm SignMaker.ai, here to help with signage and fabrication questions. Whether you're working on channel letters, monument signs, or just trying to figure out the right materials, I've got you covered.

What would you like to know?`;

const SAMPLE_RESPONSES: Record<string, string> = {
  aluminum: `Most US shops use .040" aluminum for channel letter returns — it bends well and holds shape. For letters over 24", some go to .050" or .063" for extra rigidity.`,
  led: `Common LED brands include SloanLED, Principal LED, and GE. Each has pros and cons depending on application and your distributor. What type of letters are you lighting?`,
  channel: `Channel letters come in several styles: face-lit (most common), halo-lit (backlit glow), reverse/back-lit, open-face (exposed neon look), and combination. What style are you considering?`,
  price: `Pricing varies a lot by market and overhead. Most shops start with per-inch pricing, then adjust for complexity — open-face vs standard, paint colors, installation. Your local competition matters more than any formula.`,
  code: `I can't verify code compliance — that needs a licensed electrician and local AHJ sign-off. Generally, sign circuits should be dedicated, grounded, and use UL-listed components. What specific aspect are you trying to figure out?`,
};

const getResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("aluminum") || lowerMessage.includes("thickness") || lowerMessage.includes("return")) {
    return SAMPLE_RESPONSES.aluminum;
  }
  if (lowerMessage.includes("led") || lowerMessage.includes("light") || lowerMessage.includes("brand")) {
    return SAMPLE_RESPONSES.led;
  }
  if (lowerMessage.includes("channel") || lowerMessage.includes("letter") || lowerMessage.includes("type")) {
    return SAMPLE_RESPONSES.channel;
  }
  if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("charge")) {
    return SAMPLE_RESPONSES.price;
  }
  if (lowerMessage.includes("code") || lowerMessage.includes("wiring") || lowerMessage.includes("electrical")) {
    return SAMPLE_RESPONSES.code;
  }
  
  return `That's a good question. In the sign industry, the answer often depends on specific project details. Could you tell me more about what you're working on? For example, the sign type, size, or location (indoor/outdoor) would help me give you better guidance.`;
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", content: WELCOME_MESSAGE, isUser: false },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      isUser: true,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = getResponse(content);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response,
        isUser: false,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>
      
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
};

export default Index;
