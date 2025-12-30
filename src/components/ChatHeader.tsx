import { Zap, GraduationCap, Mail, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onTrainMeClick?: () => void;
  isTrained?: boolean;
  onForgetMe?: () => void;
  onEmailTranscript?: () => void;
  transcriptSending?: boolean;
  transcriptAlreadySent?: boolean;
  userEmail?: string;
  onGlossaryClick?: () => void;
}

const ChatHeader = ({ 
  onTrainMeClick, 
  isTrained, 
  onForgetMe, 
  onEmailTranscript,
  transcriptSending,
  transcriptAlreadySent,
  userEmail,
  onGlossaryClick
}: ChatHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                SignMaker<span className="text-primary">.ai</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-secondary/20 text-secondary border border-secondary/30 rounded-full">
                Beta
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Industry Q&A Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onGlossaryClick && (
            <button
              onClick={onGlossaryClick}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              title="View glossary"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Glossary</span>
            </button>
          )}
          {onEmailTranscript && (
            <button
              onClick={onEmailTranscript}
              disabled={transcriptSending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              title={transcriptAlreadySent ? `Already sent to ${userEmail}` : "Email this chat"}
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {transcriptSending ? 'Sending...' : transcriptAlreadySent ? 'Sent!' : 'Email this chat'}
              </span>
            </button>
          )}
          {onForgetMe && (
            <button
              onClick={onForgetMe}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Forget me
            </button>
          )}
          {isTrained && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
              <GraduationCap className="h-3 w-3" />
              Trained
            </span>
          )}
          {onTrainMeClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTrainMeClick}
              className="flex items-center gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
            >
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Train Me</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;