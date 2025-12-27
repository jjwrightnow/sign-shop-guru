import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  experienceLevel: z.string().min(1, "Please select your experience level"),
  intent: z.string().min(1, "Please select what brings you here"),
  tosAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
});

interface IntakeFormModalProps {
  open: boolean;
  onComplete: (userData: {
    userId: string;
    conversationId: string;
    name: string;
    experienceLevel: string;
    intent: string;
  }) => void;
}

const IntakeFormModal = ({ open, onComplete }: IntakeFormModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    experienceLevel: "",
    intent: "",
    tosAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Insert user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          name: formData.name,
          email: formData.email,
          experience_level: formData.experienceLevel,
          intent: formData.intent,
          tos_accepted: formData.tosAccepted,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          user_id: userData.id,
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      onComplete({
        userId: userData.id,
        conversationId: conversationData.id,
        name: formData.name,
        experienceLevel: formData.experienceLevel,
        intent: formData.intent,
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-card border-border" hideCloseButton>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="w-7 h-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold text-foreground">
            Welcome to SignMaker<span className="text-primary">.ai</span>
          </DialogTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Let's personalize your experience
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-muted border-border focus:border-primary"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-muted border-border focus:border-primary"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Experience Level</Label>
            <Select
              value={formData.experienceLevel}
              onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
            >
              <SelectTrigger className="bg-muted border-border focus:border-primary">
                <SelectValue placeholder="Select your experience" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="new">New to the industry</SelectItem>
                <SelectItem value="1-3">1-3 years experience</SelectItem>
                <SelectItem value="veteran">3+ years / Veteran</SelectItem>
              </SelectContent>
            </Select>
            {errors.experienceLevel && <p className="text-xs text-destructive">{errors.experienceLevel}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">What brings you here?</Label>
            <Select
              value={formData.intent}
              onValueChange={(value) => setFormData({ ...formData, intent: value })}
            >
              <SelectTrigger className="bg-muted border-border focus:border-primary">
                <SelectValue placeholder="Select your intent" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="learning">Learning — just exploring</SelectItem>
                <SelectItem value="active">Active project — need specific help</SelectItem>
                <SelectItem value="training">Training — teaching myself or my team</SelectItem>
              </SelectContent>
            </Select>
            {errors.intent && <p className="text-xs text-destructive">{errors.intent}</p>}
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="tos"
              checked={formData.tosAccepted}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, tosAccepted: checked === true })
              }
              className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="tos" className="text-sm text-muted-foreground leading-tight">
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline" target="_blank">
                Terms of Service
              </Link>
            </Label>
          </div>
          {errors.tosAccepted && <p className="text-xs text-destructive">{errors.tosAccepted}</p>}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:neon-glow-strong transition-all"
          >
            {isLoading ? "Starting..." : "Start Chatting"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IntakeFormModal;
