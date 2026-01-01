import { useState } from "react";
import { Check, Edit, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExpertFeedbackButtonsProps {
  messageId?: string;
  messageContent: string;
  userId: string;
  companyId: string | null;
  conversationId: string;
  onFeedbackSubmitted?: () => void;
}

type FeedbackType = "verify" | "correct" | "add_context" | null;

const ExpertFeedbackButtons = ({
  messageId,
  messageContent,
  userId,
  companyId,
  conversationId,
  onFeedbackSubmitted,
}: ExpertFeedbackButtonsProps) => {
  const { toast } = useToast();
  const [activeFeedback, setActiveFeedback] = useState<FeedbackType>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [topic, setTopic] = useState("");
  const [suggestForGlobal, setSuggestForGlobal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleVerify = async () => {
    setIsSubmitting(true);
    try {
      // Save verification as expert knowledge
      const { error } = await supabase.from("expert_knowledge").insert({
        scope: "company",
        company_id: companyId,
        topic: topic || messageContent.slice(0, 100),
        knowledge_text: "Verified as accurate by expert",
        knowledge_type: "verification",
        expert_id: userId,
        verified: true,
      });

      if (error) throw error;

      // Also save to ai_response_feedback
      if (messageId) {
        await supabase.from("ai_response_feedback").insert({
          message_id: messageId,
          user_id: userId,
          company_id: companyId,
          feedback_type: "correct",
        });
      }

      toast({ description: "Response verified as accurate" });
      setSubmitted(true);
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error("Error verifying response:", error);
      toast({
        title: "Error",
        description: "Failed to submit verification",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({ description: "Please enter your feedback", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const knowledgeType = activeFeedback === "correct" ? "correction" : "addition";

      // Save to expert_knowledge
      const { error: knowledgeError } = await supabase.from("expert_knowledge").insert({
        scope: suggestForGlobal ? "global" : "company",
        company_id: companyId,
        topic: topic || messageContent.slice(0, 100),
        knowledge_text: feedbackText,
        knowledge_type: knowledgeType,
        expert_id: userId,
        verified: !suggestForGlobal, // Company knowledge is auto-verified, global needs review
      });

      if (knowledgeError) throw knowledgeError;

      // Also save to ai_response_feedback
      if (messageId) {
        await supabase.from("ai_response_feedback").insert({
          message_id: messageId,
          user_id: userId,
          company_id: companyId,
          feedback_type: activeFeedback === "correct" ? "incorrect" : "needs_context",
          correction_text: feedbackText,
        });
      }

      toast({
        description: suggestForGlobal
          ? "Feedback submitted for global review"
          : "Feedback saved to company knowledge",
      });
      setSubmitted(true);
      setActiveFeedback(null);
      setFeedbackText("");
      setTopic("");
      setSuggestForGlobal(false);
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Check className="h-3.5 w-3.5 text-green-500" />
        <span>Expert feedback submitted</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2 border-t border-border/50">
      {!activeFeedback ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Expert:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVerify}
            disabled={isSubmitting}
            className="h-7 text-xs gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Check className="h-3.5 w-3.5" />
            Verify
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveFeedback("correct")}
            className="h-7 text-xs gap-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <Edit className="h-3.5 w-3.5" />
            Correct
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveFeedback("add_context")}
            className="h-7 text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Context
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">
              {activeFeedback === "correct" ? "Correction" : "Additional Context"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setActiveFeedback(null);
                setFeedbackText("");
                setTopic("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <Input
              placeholder="Topic (e.g., Channel letter depth)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-8 text-sm"
            />
            <Textarea
              placeholder={
                activeFeedback === "correct"
                  ? "What's the correct information?"
                  : "What context should be added?"
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="suggest-global"
              checked={suggestForGlobal}
              onCheckedChange={(checked) => setSuggestForGlobal(checked === true)}
            />
            <Label htmlFor="suggest-global" className="text-xs text-muted-foreground cursor-pointer">
              Suggest for global knowledge (requires admin review)
            </Label>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmitFeedback}
              disabled={isSubmitting || !feedbackText.trim()}
              className="h-8"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveFeedback(null);
                setFeedbackText("");
                setTopic("");
              }}
              className="h-8"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertFeedbackButtons;
