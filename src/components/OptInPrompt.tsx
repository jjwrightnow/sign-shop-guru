import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OptInPromptProps {
  userId: string;
  onDismiss: () => void;
  onComplete: () => void;
}

const OptInPrompt = ({ userId, onDismiss, onComplete }: OptInPromptProps) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptIn = async () => {
    if (!phone.trim()) {
      toast({
        title: "Phone required",
        description: "Please enter your phone number for follow-up.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ phone: phone.trim() })
        .eq("id", userId);

      if (error) throw error;

      toast({
        description: "Thanks! We'll be in touch soon.",
      });
      onComplete();
    } catch (error) {
      console.error("Error saving phone:", error);
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mx-auto max-w-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-foreground font-medium text-sm mb-1">
              Finding this helpful?
            </p>
            <p className="text-muted-foreground text-sm">
              If you'd like a sign professional to follow up with a quote or more guidance, we can connect you — no obligation.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            className="bg-primary text-primary-foreground"
          >
            <Phone className="w-4 h-4 mr-2" />
            Yes, contact me
          </Button>
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            No thanks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mx-auto max-w-xl">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-foreground font-medium text-sm">
          Great! What's the best number to reach you?
        </p>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <Input
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="bg-muted border-border flex-1"
        />
        <Button
          onClick={handleOptIn}
          disabled={isSubmitting}
          size="sm"
          className="bg-primary text-primary-foreground"
        >
          {isSubmitting ? "Saving..." : "Submit"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        A sign professional will reach out within 1 business day.
      </p>
    </div>
  );
};

export default OptInPrompt;