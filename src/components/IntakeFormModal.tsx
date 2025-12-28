import { useState, useEffect } from "react";
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

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

// Dynamic schema - intent is optional when experience level is "shopper"
const createFormSchema = (experienceLevel: string) => z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  experienceLevel: z.string().min(1, "Please select your experience level"),
  // Intent is required only for non-shoppers
  intent: experienceLevel === "shopper" 
    ? z.string().optional() 
    : z.string().min(1, "Please select what brings you here"),
  tosAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
  // Optional fields for shoppers
  businessName: z.string().max(200).optional(),
  projectType: z.string().optional(),
  timeline: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().max(20).optional(),
  rememberMe: z.boolean().optional(),
});

interface IntakeFormModalProps {
  open: boolean;
  onComplete: (userData: {
    userId: string;
    conversationId: string;
    name: string;
    experienceLevel: string;
    intent: string;
    email: string;
  }) => void;
}

interface ReturningUserData {
  id: string;
  name: string;
  email: string;
  experience_level: string;
  intent: string;
}

const IntakeFormModal = ({ open, onComplete }: IntakeFormModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [returningUser, setReturningUser] = useState<ReturningUserData | null>(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    experienceLevel: "",
    intent: "",
    tosAccepted: false,
    businessName: "",
    projectType: "",
    timeline: "",
    location: "",
    phone: "",
    rememberMe: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check for returning user on mount
  useEffect(() => {
    const checkReturningUser = async () => {
      const storedEmail = localStorage.getItem("signmaker_user_email");
      if (storedEmail && open) {
        try {
          const { data: userData, error } = await supabase.functions.invoke("get-user-by-email", {
            body: { email: storedEmail },
          });

          if (!error && userData?.user) {
            setReturningUser(userData.user);
          }
        } catch (error) {
          console.error("Error checking returning user:", error);
        }
      }
      setIsCheckingUser(false);
    };

    if (open) {
      checkReturningUser();
    }
  }, [open]);

  // User is treated as a shopper if they select "shopping" intent OR the "shopper" experience level
  const isShopper = formData.intent === "shopping" || formData.experienceLevel === "shopper";

  const handleContinueAsReturningUser = async () => {
    if (!returningUser) return;
    setIsLoading(true);

    try {
      // Get latest conversation or create new one
      const { data: convoData } = await supabase.functions.invoke("get-conversations", {
        body: { user_id: returningUser.id },
      });

      let conversationId = convoData?.conversations?.[0]?.id;

      if (!conversationId) {
        // Create new conversation
        const { data: newConvo, error } = await supabase
          .from("conversations")
          .insert({ user_id: returningUser.id })
          .select()
          .single();

        if (error) throw error;
        conversationId = newConvo.id;
      }

      onComplete({
        userId: returningUser.id,
        conversationId,
        name: returningUser.name,
        experienceLevel: returningUser.experience_level,
        intent: returningUser.intent,
        email: returningUser.email,
      });
    } catch (error: any) {
      console.error("Error continuing as returning user:", error);
      toast({
        title: "Error",
        description: "Failed to continue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewChat = async () => {
    if (!returningUser) return;
    setIsLoading(true);

    try {
      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({ user_id: returningUser.id })
        .select()
        .single();

      if (error) throw error;

      onComplete({
        userId: returningUser.id,
        conversationId: newConvo.id,
        name: returningUser.name,
        experienceLevel: returningUser.experience_level,
        intent: returningUser.intent,
        email: returningUser.email,
      });
    } catch (error: any) {
      console.error("Error starting new chat:", error);
      toast({
        title: "Error",
        description: "Failed to start new chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotYou = () => {
    localStorage.removeItem("signmaker_user_email");
    setReturningUser(null);
    setShowNewUserForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Use dynamic schema based on experience level
    const formSchema = createFormSchema(formData.experienceLevel);
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
      // Insert user with additional fields for shoppers
      const userData: any = {
        name: formData.name,
        email: formData.email,
        experience_level: formData.experienceLevel,
        intent: formData.intent,
        tos_accepted: formData.tosAccepted,
      };

      if (isShopper) {
        userData.business_name = formData.businessName || null;
        userData.project_type = formData.projectType || null;
        userData.timeline = formData.timeline || null;
        userData.location = formData.location || null;
        userData.phone = formData.phone || null;
      }

      const { data: userDataResult, error: userError } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (userError) throw userError;

      // Create conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          user_id: userDataResult.id,
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Store email if remember me is checked
      if (formData.rememberMe) {
        localStorage.setItem("signmaker_user_email", formData.email);
      }

      onComplete({
        userId: userDataResult.id,
        conversationId: conversationData.id,
        name: formData.name,
        experienceLevel: formData.experienceLevel,
        intent: formData.intent,
        email: formData.email,
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

  // Show loading while checking for returning user
  if (isCheckingUser && open) {
    return (
      <Dialog open={open}>
        <DialogContent className="sm:max-w-md border-border max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1a1a' }} hideCloseButton>
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Returning user welcome screen
  if (returningUser && !showNewUserForm && open) {
    return (
      <Dialog open={open}>
        <DialogContent className="sm:max-w-md border-border max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1a1a' }} hideCloseButton>
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20">
                <Zap className="w-7 h-7 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-semibold text-foreground">
              Welcome back, {returningUser.name}!
            </DialogTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Pick up where you left off or start fresh
            </p>
          </DialogHeader>

          <div className="space-y-3 mt-6">
            <Button
              onClick={handleContinueAsReturningUser}
              disabled={isLoading}
              className="w-full text-primary-foreground font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: '#00d4ff' }}
            >
              {isLoading ? "Loading..." : "Continue Chatting"}
            </Button>

            <Button
              onClick={handleStartNewChat}
              disabled={isLoading}
              variant="outline"
              className="w-full font-medium transition-all hover:bg-[#00d4ff]/10"
              style={{ borderColor: '#00d4ff', color: '#00d4ff' }}
            >
              Start New Chat
            </Button>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={handleNotYou}
              className="text-sm transition-colors hover:underline"
              style={{ color: '#a3a3a3' }}
            >
              Not you? Sign in with a different account
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // New user form
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md border-border max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1a1a' }} hideCloseButton>
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
            <p className="text-xs text-muted-foreground">
              Used to save your conversations. We won't contact you unless you opt in.
            </p>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Experience Level</Label>
            <Select
              value={formData.experienceLevel}
              onValueChange={(value) => {
                // Auto-set intent for shoppers
                if (value === "shopper") {
                  setFormData({ ...formData, experienceLevel: value, intent: "shopping" });
                } else {
                  // Clear auto-set intent if switching away from shopper
                  setFormData({ 
                    ...formData, 
                    experienceLevel: value, 
                    intent: formData.intent === "shopping" && formData.experienceLevel === "shopper" ? "" : formData.intent 
                  });
                }
              }}
            >
              <SelectTrigger className="bg-muted border-border focus:border-primary">
                <SelectValue placeholder="Select your experience" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="new">New to the industry</SelectItem>
                <SelectItem value="1-3">1-3 years experience</SelectItem>
                <SelectItem value="veteran">3+ years / Veteran</SelectItem>
                <SelectItem value="shopper">I'm not in the sign industry — just need a sign</SelectItem>
              </SelectContent>
            </Select>
            {errors.experienceLevel && <p className="text-xs text-destructive">{errors.experienceLevel}</p>}
          </div>

          {/* Only show intent dropdown for non-shoppers */}
          {formData.experienceLevel !== "shopper" && (
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
                  <SelectItem value="learning">Learning — just exploring the sign industry</SelectItem>
                  <SelectItem value="active">Active project — I'm a sign professional needing help</SelectItem>
                  <SelectItem value="training">Training — teaching myself or my team</SelectItem>
                  <SelectItem value="shopping">Shopping — I need a sign made</SelectItem>
                </SelectContent>
              </Select>
              {errors.intent && <p className="text-xs text-destructive">{errors.intent}</p>}
            </div>
          )}

          {/* Conditional fields for shoppers */}
          {isShopper && (
            <div className="space-y-4 pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">Tell us about your project (optional)</p>
              
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-foreground">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Your business name"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="bg-muted border-border focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Project Type</Label>
                <Select
                  value={formData.projectType}
                  onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                >
                  <SelectTrigger className="bg-muted border-border focus:border-primary">
                    <SelectValue placeholder="What type of sign?" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="channel-letters">Channel letters / Building sign</SelectItem>
                    <SelectItem value="monument">Monument sign</SelectItem>
                    <SelectItem value="dimensional">Dimensional letters (non-lit)</SelectItem>
                    <SelectItem value="led-neon">LED / Neon sign</SelectItem>
                    <SelectItem value="other">Other / Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Timeline</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                >
                  <SelectTrigger className="bg-muted border-border focus:border-primary">
                    <SelectValue placeholder="When do you need it?" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="asap">ASAP / Rush</SelectItem>
                    <SelectItem value="2-4-weeks">2-4 weeks</SelectItem>
                    <SelectItem value="1-2-months">1-2 months</SelectItem>
                    <SelectItem value="researching">Just researching</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger className="bg-muted border-border focus:border-primary">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          )}

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, rememberMe: checked === true })
              }
              className="mt-0.5"
            />
            <Label htmlFor="rememberMe" className="text-sm text-muted-foreground leading-tight cursor-pointer">
              Remember me on this device
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="tos"
              checked={formData.tosAccepted}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, tosAccepted: checked === true })
              }
              className="mt-0.5"
            />
            <Label htmlFor="tos" className="text-sm text-[#f5f5f5] leading-tight cursor-pointer">
              I agree to the{" "}
              <Link to="/terms" className="text-[#00d4ff] hover:underline" target="_blank">
                Terms of Service
              </Link>
            </Label>
          </div>
          {errors.tosAccepted && <p className="text-xs text-destructive">{errors.tosAccepted}</p>}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full text-primary-foreground hover:neon-glow-strong transition-all"
            style={{ backgroundColor: '#00d4ff' }}
          >
            {isLoading ? "Starting..." : "Start Chatting"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IntakeFormModal;