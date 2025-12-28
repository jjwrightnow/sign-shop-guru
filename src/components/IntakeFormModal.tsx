import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { Zap, Lightbulb, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PROFESSIONAL_ROLES = [
  { value: "owner", label: "Sign Shop Owner" },
  { value: "estimator", label: "Estimator / Sales" },
  { value: "fabricator", label: "Fabricator / Production" },
  { value: "designer", label: "Designer" },
  { value: "engineer", label: "Engineer" },
  { value: "project_manager", label: "Project Manager" },
  { value: "installer", label: "Installer" },
  { value: "broker", label: "Broker" },
  { value: "other", label: "Other" },
];

const EXPERIENCE_OPTIONS = [
  { value: "new", label: "New (< 1 year)" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-10", label: "3-10 years" },
  { value: "10+", label: "10+ years" },
];

const HELP_AREAS = [
  { value: "design", label: "Design" },
  { value: "production", label: "Production" },
  { value: "estimating", label: "Estimating" },
  { value: "sales", label: "Sales" },
  { value: "installation", label: "Installation" },
  { value: "outsourcing", label: "Outsourcing" },
  { value: "training", label: "Training" },
  { value: "general", label: "General" },
];

// Form schemas
const professionalSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  role: z.string().min(1, "Please select your role"),
  otherRole: z.string().max(100).optional(),
  experienceLevel: z.string().min(1, "Please select your experience"),
  helpAreas: z.array(z.string()).min(1, "Please select at least one area"),
  title: z.string().max(100).optional(),
  companyName: z.string().max(200).optional(),
  tosAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
  rememberMe: z.boolean().optional(),
});

const b2bInquirySchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  contactName: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  knowledgeProblem: z.string().max(1000).optional(),
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
    userType?: string;
    role?: string;
    helpAreas?: string[];
    signType?: string;
  }) => void;
}

interface ReturningUserData {
  id: string;
  name: string;
  email: string;
  experience_level: string;
  intent: string;
  user_type?: string;
}

const IntakeFormModal = ({ open, onComplete }: IntakeFormModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [returningUser, setReturningUser] = useState<ReturningUserData | null>(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  
  // View states
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLearnMore, setShowLearnMore] = useState(false);
  
  // Professional form data
  const [professionalData, setProfessionalData] = useState({
    name: "",
    email: "",
    role: "",
    otherRole: "",
    experienceLevel: "",
    helpAreas: [] as string[],
    title: "",
    companyName: "",
    tosAccepted: false,
    rememberMe: true,
  });

  // B2B inquiry form data
  const [b2bData, setB2bData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    knowledgeProblem: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [b2bErrors, setB2bErrors] = useState<Record<string, string>>({});
  const [b2bSubmitted, setB2bSubmitted] = useState(false);

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

  const handleContinueAsReturningUser = async () => {
    if (!returningUser) return;
    setIsLoading(true);

    try {
      const { data: convoData } = await supabase.functions.invoke("get-conversations", {
        body: { user_id: returningUser.id },
      });

      let conversationId = convoData?.conversations?.[0]?.id;

      if (!conversationId) {
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
        userType: returningUser.user_type,
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
        userType: returningUser.user_type,
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

  const toggleHelpArea = (value: string) => {
    setProfessionalData(prev => ({
      ...prev,
      helpAreas: prev.helpAreas.includes(value)
        ? prev.helpAreas.filter(a => a !== value)
        : [...prev.helpAreas, value],
    }));
  };

  const handleProfessionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = professionalSchema.safeParse(professionalData);
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
      const actualRole = professionalData.role === "other" 
        ? professionalData.otherRole 
        : professionalData.role;

      // Determine intent based on help areas
      let intent = "learning";
      if (professionalData.helpAreas.includes("training")) {
        intent = "training";
      } else if (professionalData.helpAreas.some(a => ["design", "production", "estimating", "installation"].includes(a))) {
        intent = "active";
      }

      const userData = {
        name: professionalData.name,
        email: professionalData.email,
        experience_level: professionalData.experienceLevel,
        intent,
        user_type: "professional",
        role: actualRole,
        title: professionalData.title || null,
        business_name: professionalData.companyName || null,
        help_areas: professionalData.helpAreas,
        tos_accepted: professionalData.tosAccepted,
      };

      const { data: userDataResult, error: userError } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (userError) throw userError;

      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .insert({ user_id: userDataResult.id })
        .select()
        .single();

      if (conversationError) throw conversationError;

      if (professionalData.rememberMe) {
        localStorage.setItem("signmaker_user_email", professionalData.email);
      }

      onComplete({
        userId: userDataResult.id,
        conversationId: conversationData.id,
        name: professionalData.name,
        experienceLevel: professionalData.experienceLevel,
        intent,
        email: professionalData.email,
        userType: "professional",
        role: actualRole,
        helpAreas: professionalData.helpAreas,
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

  const handleB2bSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setB2bErrors({});

    const result = b2bInquirySchema.safeParse(b2bData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setB2bErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("b2b_inquiries").insert({
        company_name: b2bData.companyName,
        contact_info: `${b2bData.contactName} - ${b2bData.email}`,
        goals: b2bData.knowledgeProblem || null,
        interest_type: "knowledge_preservation",
        status: "new",
      });

      if (error) throw error;

      setB2bSubmitted(true);
      toast({
        title: "Inquiry Submitted",
        description: "We'll be in touch soon to discuss how we can help preserve your shop's knowledge.",
      });
    } catch (error: any) {
      console.error("Error submitting B2B inquiry:", error);
      toast({
        title: "Error",
        description: "Failed to submit inquiry. Please try again.",
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

  // Learn More Modal
  if (showLearnMore) {
    return (
      <Dialog open={open}>
        <DialogContent className="sm:max-w-2xl border-border max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1a1a' }} hideCloseButton>
          <button
            onClick={() => setShowLearnMore(false)}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-foreground">
              Preserve Your Shop's Knowledge
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-6 text-foreground">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                The sign industry has a problem nobody talks about:
              </p>
              <p className="font-medium">
                The people who actually know how to BUILD signs are disappearing.
              </p>
              <p className="text-muted-foreground">
                The old-timers who bent metal, wired transformers, and solved problems on the fly — they're retiring. And they're taking decades of knowledge with them.
              </p>
              <p className="text-primary font-semibold text-lg">
                SignMaker.ai fixes this.
              </p>
              <p className="text-muted-foreground">
                We help you capture the tribal knowledge in your senior people's heads — and make it available to your entire team, forever.
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold">How it works:</p>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>We interview your experts (or you upload SOPs, specs, notes)</li>
                <li>We train a custom AI on YOUR shop's way of doing things</li>
                <li>Your team asks it anything — materials, processes, troubleshooting</li>
                <li>The knowledge stays, even when people leave</li>
              </ol>
              <p className="text-sm text-muted-foreground italic mt-4">
                This isn't about replacing people. It's about preserving what they know.
              </p>
            </div>

            <div className="border-t border-border pt-6 space-y-3">
              <p className="font-semibold">BONUS: Customer-Facing Mode</p>
              <p className="text-muted-foreground text-sm">
                SignMaker.ai includes a shopper-friendly version you can embed on your website.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-foreground mb-2">Your customers:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Ask questions in plain language</li>
                    <li>• Learn about sign types and options</li>
                    <li>• Submit project details (size, type, timeline)</li>
                    <li>• Get educated before contacting you</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-2">Your team:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Receives qualified leads, not random calls</li>
                    <li>• Spends less time explaining basics</li>
                    <li>• Closes faster because buyers understand</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <p className="font-semibold">Pricing:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="font-semibold text-foreground">Starter — $99/mo</p>
                  <p className="text-muted-foreground text-xs mt-1">Internal use only. 1 bot, 3 users, 500 questions/mo.</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="font-semibold text-foreground">Professional — $299/mo</p>
                  <p className="text-muted-foreground text-xs mt-1">Internal + customer embed. 3 bots, 10 users, 2,000 questions/mo.</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="font-semibold text-foreground">Enterprise — $499/mo</p>
                  <p className="text-muted-foreground text-xs mt-1">Unlimited everything + custom training + dedicated support.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              {b2bSubmitted ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">Thanks for your interest!</p>
                  <p className="text-muted-foreground text-sm mt-2">We'll be in touch soon.</p>
                  <Button
                    onClick={() => setShowLearnMore(false)}
                    className="mt-4"
                    style={{ backgroundColor: '#00d4ff' }}
                  >
                    Back to Form
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleB2bSubmit} className="space-y-4">
                  <p className="font-semibold text-foreground">Interested?</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="b2b-company" className="text-foreground text-sm">Company Name</Label>
                      <Input
                        id="b2b-company"
                        placeholder="Your sign shop"
                        value={b2bData.companyName}
                        onChange={(e) => setB2bData({ ...b2bData, companyName: e.target.value })}
                        className="bg-muted border-border focus:border-primary"
                      />
                      {b2bErrors.companyName && <p className="text-xs text-destructive">{b2bErrors.companyName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b2b-name" className="text-foreground text-sm">Your Name</Label>
                      <Input
                        id="b2b-name"
                        placeholder="Your name"
                        value={b2bData.contactName}
                        onChange={(e) => setB2bData({ ...b2bData, contactName: e.target.value })}
                        className="bg-muted border-border focus:border-primary"
                      />
                      {b2bErrors.contactName && <p className="text-xs text-destructive">{b2bErrors.contactName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="b2b-email" className="text-foreground text-sm">Email</Label>
                    <Input
                      id="b2b-email"
                      type="email"
                      placeholder="you@yourshop.com"
                      value={b2bData.email}
                      onChange={(e) => setB2bData({ ...b2bData, email: e.target.value })}
                      className="bg-muted border-border focus:border-primary"
                    />
                    {b2bErrors.email && <p className="text-xs text-destructive">{b2bErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="b2b-problem" className="text-foreground text-sm">Biggest knowledge problem in your shop?</Label>
                    <Textarea
                      id="b2b-problem"
                      placeholder="What knowledge are you worried about losing?"
                      value={b2bData.knowledgeProblem}
                      onChange={(e) => setB2bData({ ...b2bData, knowledgeProblem: e.target.value })}
                      className="bg-muted border-border focus:border-primary min-h-[80px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-primary-foreground font-medium"
                    style={{ backgroundColor: '#00d4ff' }}
                  >
                    {isLoading ? "Submitting..." : "Submit Inquiry"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Welcome screen
  if (showWelcome && !showNewUserForm) {
    return (
      <Dialog open={open}>
        <DialogContent className="sm:max-w-lg border-border max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1a1a' }} hideCloseButton>
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20">
                <Zap className="w-7 h-7 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-semibold text-foreground">
              Welcome to SignMaker<span className="text-primary">.ai</span>
            </DialogTitle>
          </DialogHeader>

          <div className="text-center mt-4 space-y-4">
            <p className="text-muted-foreground">
              The sign industry's best knowledge is retiring.
            </p>
            <p className="text-foreground font-medium text-lg">
              We're keeping it alive.
            </p>
            <p className="text-muted-foreground text-sm">
              Built for sign professionals — fabricators, estimators, designers, installers, and shop owners. Decades of tribal knowledge, accessible instantly.
            </p>
          </div>

          <Button
            onClick={() => setShowWelcome(false)}
            className="w-full mt-6 text-primary-foreground font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: '#00d4ff' }}
          >
            Get Started →
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Main professional form
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg border-border max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1a1a' }} hideCloseButton>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="w-7 h-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold text-foreground">
            Tell us about yourself
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleProfessionalSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-foreground">Your Role</Label>
            <Select
              value={professionalData.role}
              onValueChange={(value) => setProfessionalData({ ...professionalData, role: value })}
            >
              <SelectTrigger className="bg-muted border-border focus:border-primary">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {PROFESSIONAL_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
          </div>

          {professionalData.role === "other" && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="other-role" className="text-foreground">What's your role?</Label>
              <Input
                id="other-role"
                placeholder="Your role"
                value={professionalData.otherRole}
                onChange={(e) => setProfessionalData({ ...professionalData, otherRole: e.target.value })}
                className="bg-muted border-border focus:border-primary"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-foreground">Experience</Label>
            <Select
              value={professionalData.experienceLevel}
              onValueChange={(value) => setProfessionalData({ ...professionalData, experienceLevel: value })}
            >
              <SelectTrigger className="bg-muted border-border focus:border-primary">
                <SelectValue placeholder="Select your experience" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {EXPERIENCE_OPTIONS.map((exp) => (
                  <SelectItem key={exp.value} value={exp.value}>{exp.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.experienceLevel && <p className="text-xs text-destructive">{errors.experienceLevel}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-sm">What do you need help with today?</Label>
            <div className="flex flex-wrap gap-2">
              {HELP_AREAS.map((area) => (
                <button
                  key={area.value}
                  type="button"
                  onClick={() => toggleHelpArea(area.value)}
                  className={`px-3 py-2 rounded-full text-sm border transition-all ${
                    professionalData.helpAreas.includes(area.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-[#262626] text-foreground border-[#333] hover:border-primary"
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>
            {errors.helpAreas && <p className="text-xs text-destructive">{errors.helpAreas}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pro-name" className="text-foreground">Name</Label>
              <Input
                id="pro-name"
                placeholder="Your name"
                value={professionalData.name}
                onChange={(e) => setProfessionalData({ ...professionalData, name: e.target.value })}
                className="bg-muted border-border focus:border-primary"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pro-email" className="text-foreground">Email</Label>
              <Input
                id="pro-email"
                type="email"
                placeholder="you@example.com"
                value={professionalData.email}
                onChange={(e) => setProfessionalData({ ...professionalData, email: e.target.value })}
                className="bg-muted border-border focus:border-primary"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pro-title" className="text-foreground">Title <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="pro-title"
                placeholder="Your title"
                value={professionalData.title}
                onChange={(e) => setProfessionalData({ ...professionalData, title: e.target.value })}
                className="bg-muted border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pro-company" className="text-foreground">Company <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="pro-company"
                placeholder="Company name"
                value={professionalData.companyName}
                onChange={(e) => setProfessionalData({ ...professionalData, companyName: e.target.value })}
                className="bg-muted border-border focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="pro-remember"
              checked={professionalData.rememberMe}
              onCheckedChange={(checked) => setProfessionalData({ ...professionalData, rememberMe: checked === true })}
              className="mt-0.5"
            />
            <Label htmlFor="pro-remember" className="text-sm text-muted-foreground leading-tight cursor-pointer">
              Remember me on this device
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="pro-tos"
              checked={professionalData.tosAccepted}
              onCheckedChange={(checked) => setProfessionalData({ ...professionalData, tosAccepted: checked === true })}
              className="mt-0.5"
            />
            <Label htmlFor="pro-tos" className="text-sm text-foreground leading-tight cursor-pointer">
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
            className="w-full text-primary-foreground hover:neon-glow-strong transition-all"
            style={{ backgroundColor: '#00d4ff' }}
          >
            {isLoading ? "Starting..." : "Start Chatting →"}
          </Button>
        </form>

        {/* Shopper redirect */}
        <div className="text-center mt-3">
          <p className="text-xs" style={{ color: '#666' }}>
            Need a sign made?{" "}
            <a
              href="https://signexperts.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: '#666' }}
            >
              Find a sign professional →
            </a>
          </p>
        </div>

        {/* B2B Pitch Card */}
        <div className="p-4 rounded-lg border-l-4 border-l-primary mt-4" style={{ backgroundColor: '#1f1f1f' }}>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground text-sm">For Sign Shop Owners</p>
              <p className="text-xs text-muted-foreground mt-2">
                The guys who actually built signs are retiring. Their knowledge is walking out the door.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                SignMaker.ai captures it:
              </p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>✓ <strong>Tribal knowledge preserved</strong> — decades of expertise, always accessible</li>
                <li>✓ <strong>New hires ramp faster</strong> — answers without bothering senior staff</li>
                <li>✓ <strong>Consistency across your team</strong> — same right answer, every time</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Plus: Embed on your website</strong> — Let customers ask questions and submit qualified project details before they call.
              </p>
              <button
                onClick={() => setShowLearnMore(true)}
                className="text-xs text-primary hover:underline mt-3 inline-block font-medium"
              >
                Learn More →
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IntakeFormModal;
