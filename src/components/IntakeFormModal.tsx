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
import { Zap, ShoppingCart, Wrench, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PROFESSIONAL_ROLES = [
  { value: "owner", label: "Owner / Principal" },
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

const SIGN_TYPES = [
  { value: "lit-letters", label: "Lit-Up Letters" },
  { value: "building-sign", label: "Building Sign" },
  { value: "monument", label: "Monument/Ground Sign" },
  { value: "dimensional", label: "Non-Lit 3D Letters" },
  { value: "not-sure", label: "Not Sure" },
];

// Form schemas
const shopperSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  signType: z.string().min(1, "Please select a sign type"),
  businessName: z.string().max(200).optional(),
  tosAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
  rememberMe: z.boolean().optional(),
});

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
  
  // User type selection
  const [userType, setUserType] = useState<"shopper" | "professional" | null>(null);
  
  // Shopper form data
  const [shopperData, setShopperData] = useState({
    name: "",
    email: "",
    signType: "",
    businessName: "",
    tosAccepted: false,
    rememberMe: true,
  });
  
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

  const handleShopperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = shopperSchema.safeParse(shopperData);
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
      const userData = {
        name: shopperData.name,
        email: shopperData.email,
        experience_level: "shopper",
        intent: "shopping",
        user_type: "shopper",
        sign_type_interest: shopperData.signType,
        business_name: shopperData.businessName || null,
        tos_accepted: shopperData.tosAccepted,
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

      if (shopperData.rememberMe) {
        localStorage.setItem("signmaker_user_email", shopperData.email);
      }

      onComplete({
        userId: userDataResult.id,
        conversationId: conversationData.id,
        name: shopperData.name,
        experienceLevel: "shopper",
        intent: "shopping",
        email: shopperData.email,
        userType: "shopper",
        signType: shopperData.signType,
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

  // Main form with user type selection
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
          <p className="text-muted-foreground text-sm mt-2">
            {!userType ? "Are you here to..." : userType === "shopper" ? "Tell us about your sign project" : "Tell us about yourself"}
          </p>
        </DialogHeader>

        {/* Step 1: User Type Selection */}
        {!userType && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setUserType("shopper")}
                className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all hover:border-primary bg-[#262626] border-[#333] hover:bg-[#0a3d4f]/30"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Get a Sign Made</p>
                  <p className="text-xs text-muted-foreground mt-1">I need a sign for my business or project</p>
                </div>
              </button>

              <button
                onClick={() => setUserType("professional")}
                className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all hover:border-primary bg-[#262626] border-[#333] hover:bg-[#0a3d4f]/30"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Sign Industry Pro</p>
                  <p className="text-xs text-muted-foreground mt-1">I work in the sign industry and have technical questions</p>
                </div>
              </button>
            </div>

            {/* B2B Pitch Card */}
            <div className="p-4 rounded-lg border-l-4 border-l-primary" style={{ backgroundColor: '#1f1f1f' }}>
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">For Sign Shops & Organizations</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    SignMaker.ai can be customized for your team — train employees with your SOPs, create role-specific bots, or embed on your website as a 24/7 assistant.
                  </p>
                  <button
                    onClick={() => window.open('mailto:partners@signmaker.ai', '_blank')}
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    Learn More →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2A: Shopper Form */}
        {userType === "shopper" && (
          <form onSubmit={handleShopperSubmit} className="space-y-4 mt-4 animate-fade-in">
            <button
              type="button"
              onClick={() => setUserType(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              ← Back
            </button>

            <div className="space-y-2">
              <Label className="text-foreground text-sm">What kind of sign?</Label>
              <div className="flex flex-wrap gap-2">
                {SIGN_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setShopperData({ ...shopperData, signType: type.value })}
                    className={`px-3 py-2 rounded-full text-sm border transition-all ${
                      shopperData.signType === type.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-[#262626] text-foreground border-[#333] hover:border-primary"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {errors.signType && <p className="text-xs text-destructive">{errors.signType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopper-name" className="text-foreground">Name</Label>
              <Input
                id="shopper-name"
                placeholder="Your name"
                value={shopperData.name}
                onChange={(e) => setShopperData({ ...shopperData, name: e.target.value })}
                className="bg-muted border-border focus:border-primary"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopper-email" className="text-foreground">Email</Label>
              <Input
                id="shopper-email"
                type="email"
                placeholder="you@example.com"
                value={shopperData.email}
                onChange={(e) => setShopperData({ ...shopperData, email: e.target.value })}
                className="bg-muted border-border focus:border-primary"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopper-business" className="text-foreground">Company/Business Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="shopper-business"
                placeholder="Your business name"
                value={shopperData.businessName}
                onChange={(e) => setShopperData({ ...shopperData, businessName: e.target.value })}
                className="bg-muted border-border focus:border-primary"
              />
            </div>

            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="shopper-remember"
                checked={shopperData.rememberMe}
                onCheckedChange={(checked) => setShopperData({ ...shopperData, rememberMe: checked === true })}
                className="mt-0.5"
              />
              <Label htmlFor="shopper-remember" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                Remember me on this device
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="shopper-tos"
                checked={shopperData.tosAccepted}
                onCheckedChange={(checked) => setShopperData({ ...shopperData, tosAccepted: checked === true })}
                className="mt-0.5"
              />
              <Label htmlFor="shopper-tos" className="text-sm text-foreground leading-tight cursor-pointer">
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
        )}

        {/* Step 2B: Professional Form */}
        {userType === "professional" && (
          <form onSubmit={handleProfessionalSubmit} className="space-y-4 mt-4 animate-fade-in">
            <button
              type="button"
              onClick={() => setUserType(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              ← Back
            </button>

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
        )}

        {/* B2B Pitch for Shopper and Professional */}
        {userType && (
          <div className="p-4 rounded-lg border-l-4 border-l-primary mt-4" style={{ backgroundColor: '#1f1f1f' }}>
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground text-sm">For Sign Shops & Organizations</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Customize SignMaker.ai for your team — train with your SOPs, create role-specific bots, or embed as a 24/7 assistant.
                </p>
                <button
                  onClick={() => window.open('mailto:partners@signmaker.ai', '_blank')}
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  Learn More →
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IntakeFormModal;
