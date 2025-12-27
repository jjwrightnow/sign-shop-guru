import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  LogOut,
  ArrowLeft,
  Search,
  AlertCircle,
  Zap,
  ShoppingBag,
  Download,
  Building2,
  Handshake,
  Plus,
  GraduationCap,
  Mail,
  MailCheck,
  Lightbulb,
  TrendingUp,
  HelpCircle,
  MousePointerClick,
  Edit,
  Check,
  FlaskConical,
  Trash2,
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminDashboardProps {
  onLogout: () => void;
  adminToken: string;
}

interface Stats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  messagesToday: number;
  helpfulFeedback: number;
  notHelpfulFeedback: number;
  totalLeads: number;
  totalB2BInquiries: number;
}

interface ConversationRow {
  id: string;
  user_name: string;
  user_email: string;
  experience_level: string;
  created_at: string;
  message_count: number;
  last_message: string;
  messages?: any[];
  transcript_offered: boolean;
  transcript_emailed: boolean;
  transcript_emailed_at: string | null;
}

interface FeedbackRow {
  id: string;
  rating: string;
  comment: string | null;
  created_at: string;
  message_content: string;
  assistant_response: string;
}

interface GapRow {
  id: string;
  content: string;
  created_at: string;
  conversation_id: string;
}

interface SettingRow {
  id: string;
  setting_name: string;
  setting_value: string;
  is_active: boolean;
}

interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  project_type: string | null;
  timeline: string | null;
  location: string | null;
  created_at: string;
  contacted: boolean;
}

interface B2BInquiry {
  id: string;
  company_name: string | null;
  role: string | null;
  contact_info: string | null;
  interest_type: string | null;
  goals: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Partner {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  location_city: string | null;
  location_state: string | null;
  services: string[] | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

interface Referral {
  id: string;
  user_id: string | null;
  partner_id: string | null;
  location_city: string | null;
  location_state: string | null;
  project_type: string | null;
  timeline: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  preferred_contact: string | null;
  best_time_to_call: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
  partner_name?: string;
}

interface TrainingStats {
  users_trained: number;
  users_trained_ids: string[];
  equipment_counts: Record<string, number>;
  material_counts: Record<string, number>;
  product_counts: Record<string, number>;
  custom_instructions_count: number;
  custom_instructions_samples: string[];
}

interface SuggestedFollowup {
  id: string;
  trigger_keywords: string[];
  category: string;
  followup_questions: string[];
  success_rate: number | null;
  usage_count: number;
  click_count: number;
  impression_count: number;
  variant_group: string;
  is_active: boolean;
  created_at: string;
}

interface ABTestResult {
  id: string;
  variant_group: string;
  followup_questions: string[];
  impressions: number;
  clicks: number;
  ctr: number;
  is_active: boolean;
}

interface KnowledgeGap {
  id: string;
  question: string;
  frequency: number;
  resolved: boolean;
  resolution: string | null;
  created_at: string;
}

interface ConversationPattern {
  id: string;
  pattern_type: string;
  trigger_phrase: string | null;
  successful_path: string[] | null;
  conversion_rate: number | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

const B2B_STATUSES = ['new', 'contacted', 'demo_scheduled', 'closed_won', 'closed_lost'];
const REFERRAL_STATUSES = ['new', 'referred', 'contacted', 'quoted', 'won', 'lost'];

const AdminDashboard = ({ onLogout, adminToken }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    messagesToday: 0,
    helpfulFeedback: 0,
    notHelpfulFeedback: 0,
    totalLeads: 0,
    totalB2BInquiries: 0,
  });
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [gaps, setGaps] = useState<GapRow[]>([]);
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [b2bInquiries, setB2BInquiries] = useState<B2BInquiry[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "helpful" | "not_helpful">("all");
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPartnerDialog, setShowPartnerDialog] = useState(false);
  const [newPartner, setNewPartner] = useState<Partial<Partner>>({
    company_name: "",
    is_active: true,
  });
  const [trainingStats, setTrainingStats] = useState<TrainingStats>({
    users_trained: 0,
    users_trained_ids: [],
    equipment_counts: {},
    material_counts: {},
    product_counts: {},
    custom_instructions_count: 0,
    custom_instructions_samples: [],
  });
  const [trainedUsers, setTrainedUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [suggestedFollowups, setSuggestedFollowups] = useState<SuggestedFollowup[]>([]);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [conversationPatterns, setConversationPatterns] = useState<ConversationPattern[]>([]);
  const [editingFollowup, setEditingFollowup] = useState<string | null>(null);
  const [editingGapResolution, setEditingGapResolution] = useState<string | null>(null);
  const [abTestResults, setABTestResults] = useState<Record<string, ABTestResult[]>>({});
  const [showCreateVariant, setShowCreateVariant] = useState<string | null>(null);
  const [newVariantQuestions, setNewVariantQuestions] = useState<string>("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "fetchAll" },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;

      // Process the data
      const users = data.users || [];
      const allConversations = data.conversations || [];
      const allMessages = data.messages || [];
      const allFeedback = data.feedback || [];
      const allSettings = data.settings || [];
      const allB2B = data.b2b_inquiries || [];
      const allPartners = data.partners || [];
      const allReferrals = data.referrals || [];

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const messagesToday = allMessages.filter(
        (m: any) => new Date(m.created_at) >= today
      ).length;
      const helpful = allFeedback.filter((f: any) => f.rating === "helpful").length;
      const notHelpful = allFeedback.filter((f: any) => f.rating === "not_helpful").length;
      const shopperLeads = users.filter((u: any) => u.intent === "shopping");

      setStats({
        totalUsers: users.length,
        totalConversations: allConversations.length,
        totalMessages: allMessages.length,
        messagesToday,
        helpfulFeedback: helpful,
        notHelpfulFeedback: notHelpful,
        totalLeads: shopperLeads.length,
        totalB2BInquiries: allB2B.length,
      });

      // Process conversations with messages
      const conversationsWithMessages = allConversations.map((conv: any) => {
        const user = users.find((u: any) => u.id === conv.user_id);
        const convMessages = allMessages.filter((m: any) => m.conversation_id === conv.id);
        return {
          id: conv.id,
          user_name: user?.name || "Unknown",
          user_email: user?.email || "Unknown",
          experience_level: user?.experience_level || "Unknown",
          created_at: conv.created_at,
          message_count: convMessages.length,
          last_message: convMessages[convMessages.length - 1]?.content || "",
          messages: convMessages,
          transcript_offered: conv.transcript_offered || false,
          transcript_emailed: conv.transcript_emailed || false,
          transcript_emailed_at: conv.transcript_emailed_at || null,
        };
      });
      setConversations(conversationsWithMessages);

      // Process feedback with context
      const feedbackWithContext = allFeedback.map((f: any) => {
        const message = allMessages.find((m: any) => m.id === f.message_id);
        let assistantResponse = "";
        if (message) {
          const convMessages = allMessages
            .filter((m: any) => m.conversation_id === message.conversation_id)
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          const msgIndex = convMessages.findIndex((m: any) => m.id === f.message_id);
          if (msgIndex >= 0 && convMessages[msgIndex + 1]) {
            assistantResponse = convMessages[msgIndex + 1].content;
          }
        }
        return {
          id: f.id,
          rating: f.rating,
          comment: f.comment,
          created_at: f.created_at,
          message_content: message?.content || "",
          assistant_response: assistantResponse,
        };
      });
      setFeedback(feedbackWithContext);

      // Process gaps
      const gapMessages = allMessages.filter((m: any) => {
        if (m.role !== "assistant") return false;
        const content = m.content.toLowerCase();
        return (
          content.includes("i don't have") ||
          content.includes("check with") ||
          content.includes("i'm not sure") ||
          content.includes("i cannot") ||
          content.includes("i can't verify")
        );
      });
      setGaps(gapMessages.slice(0, 50));

      // Set other data
      setSettings(allSettings);
      setLeads(shopperLeads.map((l: any) => ({ ...l, contacted: l.contacted ?? false })));
      setB2BInquiries(allB2B);
      setPartners(allPartners);

      // Process referrals with user/partner info
      const referralsWithDetails = allReferrals.map((r: any) => {
        const user = users.find((u: any) => u.id === r.user_id);
        const partner = allPartners.find((p: any) => p.id === r.partner_id);
        return {
          ...r,
          user_name: user?.name,
          user_email: user?.email,
          partner_name: partner?.company_name,
        };
      });
      setReferrals(referralsWithDetails);

      // Set training stats
      if (data.training_stats) {
        setTrainingStats(data.training_stats);
        // Map trained user IDs to user details
        const trainedUserDetails = users
          .filter((u: any) => data.training_stats.users_trained_ids.includes(u.id))
          .map((u: any) => ({ id: u.id, name: u.name, email: u.email }));
        setTrainedUsers(trainedUserDetails);
      }

      // Set intelligence data
      if (data.suggested_followups) {
        setSuggestedFollowups(data.suggested_followups);
      }
      if (data.knowledge_gaps) {
        setKnowledgeGaps(data.knowledge_gaps);
      }
      if (data.conversation_patterns) {
        setConversationPatterns(data.conversation_patterns);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast({ title: "Error", description: "Failed to load admin data", variant: "destructive" });
    }
    setIsLoading(false);
  };

  // Legacy fetch functions removed - all data now fetched via fetchAllData using edge function

  const updateSetting = async (id: string, value: string, isActive: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "updateSetting", data: { id, setting_value: value } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      toast({ description: "Setting updated successfully" });
      setSettings(settings.map(s => s.id === id ? { ...s, setting_value: value, is_active: isActive } : s));
    } catch (error) {
      console.error("Error updating setting:", error);
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
    }
  };

  const toggleLeadContacted = async (leadId: string, contacted: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "updateUserContacted", data: { id: leadId, contacted } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      setLeads(leads.map(l => l.id === leadId ? { ...l, contacted } : l));
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({ title: "Error", description: "Failed to update lead", variant: "destructive" });
    }
  };

  const updateB2BStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "updateB2BInquiry", data: { id, updates: { status } } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      setB2BInquiries(b2bInquiries.map(i => i.id === id ? { ...i, status } : i));
    } catch (error) {
      console.error("Error updating B2B inquiry:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const updateB2BNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "updateB2BInquiry", data: { id, updates: { notes } } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      setB2BInquiries(b2bInquiries.map(i => i.id === id ? { ...i, notes } : i));
      toast({ description: "Notes saved" });
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const updateReferralStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "updateReferral", data: { id, updates: { status } } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      setReferrals(referrals.map(r => r.id === id ? { ...r, status } : r));
    } catch (error) {
      console.error("Error updating referral:", error);
    }
  };

  const updateReferralPartner = async (id: string, partnerId: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "updateReferral", data: { id, updates: { partner_id: partnerId } } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      const partner = partners.find(p => p.id === partnerId);
      setReferrals(referrals.map(r => r.id === id ? { ...r, partner_id: partnerId, partner_name: partner?.company_name } : r));
    } catch (error) {
      console.error("Error updating referral partner:", error);
    }
  };

  const togglePartnerActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "togglePartner", data: { id, is_active: isActive } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      setPartners(partners.map(p => p.id === id ? { ...p, is_active: isActive } : p));
    } catch (error) {
      console.error("Error updating partner:", error);
    }
  };

  const addPartner = async () => {
    if (!newPartner.company_name) return;
    
    try {
      const partnerData = {
        company_name: newPartner.company_name,
        contact_name: newPartner.contact_name || null,
        email: newPartner.email || null,
        phone: newPartner.phone || null,
        location_city: newPartner.location_city || null,
        location_state: newPartner.location_state || null,
        services: newPartner.services || null,
        is_active: newPartner.is_active ?? true,
        notes: newPartner.notes || null,
      };

      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "addPartner", data: partnerData },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      
      setShowPartnerDialog(false);
      setNewPartner({ company_name: "", is_active: true });
      fetchAllData(); // Refresh all data
      toast({ description: "Partner added successfully" });
    } catch (error) {
      console.error("Error adding partner:", error);
      toast({ title: "Error", description: "Failed to add partner", variant: "destructive" });
    }
  };

  // Intelligence functions
  const toggleFollowup = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "toggleFollowup", data: { id, is_active: isActive } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      setSuggestedFollowups(suggestedFollowups.map(f => f.id === id ? { ...f, is_active: isActive } : f));
    } catch (error) {
      console.error("Error toggling followup:", error);
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const updateFollowupQuestions = async (id: string, questions: string[]) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "updateFollowup", data: { id, updates: { followup_questions: questions } } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      setSuggestedFollowups(suggestedFollowups.map(f => f.id === id ? { ...f, followup_questions: questions } : f));
      setEditingFollowup(null);
      toast({ description: "Follow-ups updated" });
    } catch (error) {
      console.error("Error updating followup:", error);
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const resolveKnowledgeGap = async (id: string, resolution: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "resolveKnowledgeGap", data: { id, resolution } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      setKnowledgeGaps(knowledgeGaps.map(g => g.id === id ? { ...g, resolved: true, resolution } : g));
      setEditingGapResolution(null);
      toast({ description: "Knowledge gap resolved" });
    } catch (error) {
      console.error("Error resolving gap:", error);
      toast({ title: "Error", description: "Failed to resolve", variant: "destructive" });
    }
  };

  const deleteKnowledgeGap = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "deleteKnowledgeGap", data: { id } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      setKnowledgeGaps(knowledgeGaps.filter(g => g.id !== id));
    } catch (error) {
      console.error("Error deleting gap:", error);
    }
  };

  const fetchABTestResults = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "getABTestResults" },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      if (data?.results) {
        setABTestResults(data.results);
      }
    } catch (error) {
      console.error("Error fetching A/B test results:", error);
    }
  };

  const createVariant = async (originalId: string, newQuestions: string[]) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { 
          action: "createVariant", 
          data: { 
            original_id: originalId, 
            new_questions: newQuestions,
            variant_name: `variant_${Date.now()}` 
          } 
        },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      toast({ description: "Variant created successfully" });
      setShowCreateVariant(null);
      setNewVariantQuestions("");
      fetchAllData();
      fetchABTestResults();
    } catch (error) {
      console.error("Error creating variant:", error);
      toast({ title: "Error", description: "Failed to create variant", variant: "destructive" });
    }
  };

  const deleteVariant = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: { action: "deleteVariant", data: { id } },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;
      toast({ description: "Variant deleted" });
      fetchAllData();
      fetchABTestResults();
    } catch (error) {
      console.error("Error deleting variant:", error);
      toast({ title: "Error", description: "Failed to delete variant", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchABTestResults();
  }, [suggestedFollowups]);

  const exportLeadsToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Business", "Project Type", "Timeline", "Location", "Date", "Contacted"];
    const rows = leads.map(l => [
      l.name,
      l.email,
      l.phone || "",
      l.business_name || "",
      l.project_type || "",
      l.timeline || "",
      l.location || "",
      new Date(l.created_at).toLocaleDateString(),
      l.contacted ? "Yes" : "No"
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signmaker-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFeedback = feedback.filter((f) => {
    if (feedbackFilter === "all") return true;
    return f.rating === feedbackFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatProjectType = (type: string | null) => {
    if (!type) return "—";
    const types: Record<string, string> = {
      "channel-letters": "Channel Letters",
      "monument": "Monument Sign",
      "dimensional": "Dimensional Letters",
      "led-neon": "LED / Neon",
      "other": "Other",
    };
    return types[type] || type;
  };

  const formatTimeline = (timeline: string | null) => {
    if (!timeline) return "—";
    const timelines: Record<string, string> = {
      "asap": "ASAP / Rush",
      "2-4-weeks": "2-4 weeks",
      "1-2-months": "1-2 months",
      "researching": "Researching",
    };
    return timelines[timeline] || timeline;
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                SignMaker<span className="text-primary">.ai</span> Admin
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
              <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
              <StatCard icon={MessageSquare} label="Conversations" value={stats.totalConversations} />
              <StatCard icon={MessageSquare} label="Total Messages" value={stats.totalMessages} />
              <StatCard icon={MessageSquare} label="Messages Today" value={stats.messagesToday} accent />
              <StatCard icon={ThumbsUp} label="Helpful" value={stats.helpfulFeedback} />
              <StatCard icon={ThumbsDown} label="Not Helpful" value={stats.notHelpfulFeedback} />
              <StatCard icon={ShoppingBag} label="Leads" value={stats.totalLeads} accent />
              <StatCard icon={Building2} label="B2B Inquiries" value={stats.totalB2BInquiries} accent />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="leads" className="space-y-4">
              <TabsList className="bg-surface border border-border flex-wrap h-auto">
                <TabsTrigger value="leads">Leads</TabsTrigger>
                <TabsTrigger value="b2b">B2B Inquiries</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
                <TabsTrigger value="partners">Partners</TabsTrigger>
                <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
                <TabsTrigger value="training">Training Stats</TabsTrigger>
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="gaps">Gap Tracking</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Leads Tab */}
              <TabsContent value="leads" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-foreground">Sign Buyer Leads</h2>
                  <Button onClick={exportLeadsToCSV} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>

                <ScrollArea className="h-[600px]">
                  {leads.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No leads yet. Leads appear when users select "Shopping — I need a sign made"
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leads.map((lead) => (
                        <div
                          key={lead.id}
                          className={`bg-card border rounded-lg p-4 ${
                            !lead.contacted ? "border-primary/50 bg-primary/5" : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground">{lead.name}</span>
                                {!lead.contacted && (
                                  <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                                    New Lead
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-0.5">
                                <p>{lead.email} {lead.phone && `• ${lead.phone}`}</p>
                                {lead.business_name && <p>Business: {lead.business_name}</p>}
                                <div className="flex gap-4 flex-wrap text-xs">
                                  <span>Project: {formatProjectType(lead.project_type)}</span>
                                  <span>Timeline: {formatTimeline(lead.timeline)}</span>
                                  <span>Location: {lead.location || "—"}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <p className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</p>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`contacted-${lead.id}`}
                                  checked={lead.contacted}
                                  onCheckedChange={(checked) => toggleLeadContacted(lead.id, checked === true)}
                                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <Label htmlFor={`contacted-${lead.id}`} className="text-xs text-muted-foreground">
                                  Contacted
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* B2B Inquiries Tab */}
              <TabsContent value="b2b" className="space-y-4">
                <h2 className="text-lg font-medium text-foreground">B2B Inquiries</h2>

                <ScrollArea className="h-[600px]">
                  {b2bInquiries.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No B2B inquiries yet. These appear when users express interest in customized solutions.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {b2bInquiries.map((inquiry) => (
                        <div key={inquiry.id} className="bg-card border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{inquiry.company_name || "—"}</span>
                                <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                                  {inquiry.role || "Unknown role"}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{inquiry.contact_info || "No contact info"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{formatDate(inquiry.created_at)}</p>
                              <Select
                                value={inquiry.status}
                                onValueChange={(v) => updateB2BStatus(inquiry.id, v)}
                              >
                                <SelectTrigger className="w-32 h-8 mt-1 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                  {B2B_STATUSES.map(s => (
                                    <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {inquiry.interest_type && (
                            <p className="text-sm text-foreground mb-2">
                              <span className="text-muted-foreground">Interest:</span> {inquiry.interest_type}
                            </p>
                          )}
                          {inquiry.goals && (
                            <p className="text-sm text-foreground mb-2">
                              <span className="text-muted-foreground">Goals:</span> {inquiry.goals}
                            </p>
                          )}
                          <Textarea
                            placeholder="Add notes..."
                            value={inquiry.notes || ""}
                            onChange={(e) => setB2BInquiries(b2bInquiries.map(i => i.id === inquiry.id ? { ...i, notes: e.target.value } : i))}
                            onBlur={() => updateB2BNotes(inquiry.id, inquiry.notes || "")}
                            className="bg-muted border-border text-sm min-h-[60px]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Referrals Tab */}
              <TabsContent value="referrals" className="space-y-4">
                <h2 className="text-lg font-medium text-foreground">Shopper Referrals</h2>

                <ScrollArea className="h-[600px]">
                  {referrals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No referrals yet. These appear when shoppers request to be connected with a sign professional.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referrals.map((referral) => (
                        <div key={referral.id} className="bg-card border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="font-medium text-foreground">{referral.user_name || "Unknown"}</span>
                              <p className="text-sm text-muted-foreground">
                                {referral.email || referral.user_email} {referral.phone && `• ${referral.phone}`}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDate(referral.created_at)}</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Location:</span>{" "}
                              {referral.location_city && referral.location_state 
                                ? `${referral.location_city}, ${referral.location_state}` 
                                : "—"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Project:</span>{" "}
                              {formatProjectType(referral.project_type)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Timeline:</span>{" "}
                              {formatTimeline(referral.timeline)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Preferred:</span>{" "}
                              <span className={referral.preferred_contact ? "font-medium text-primary" : ""}>
                                {referral.preferred_contact ? referral.preferred_contact.charAt(0).toUpperCase() + referral.preferred_contact.slice(1) : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Best Time:</span>{" "}
                              {referral.best_time_to_call || "—"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Timezone:</span>{" "}
                              {referral.timezone || "—"}
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Select
                              value={referral.partner_id || ""}
                              onValueChange={(v) => updateReferralPartner(referral.id, v)}
                            >
                              <SelectTrigger className="flex-1 h-8 text-xs">
                                <SelectValue placeholder="Assign Partner" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border">
                                {partners.filter(p => p.is_active).map(p => (
                                  <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={referral.status}
                              onValueChange={(v) => updateReferralStatus(referral.id, v)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border">
                                {REFERRAL_STATUSES.map(s => (
                                  <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Partners Tab */}
              <TabsContent value="partners" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-foreground">Partner Sign Shops</h2>
                  <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2 bg-primary">
                        <Plus className="w-4 h-4" />
                        Add Partner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle>Add Partner Shop</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Company Name *</Label>
                          <Input
                            value={newPartner.company_name || ""}
                            onChange={e => setNewPartner({ ...newPartner, company_name: e.target.value })}
                            className="bg-muted border-border"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Contact Name</Label>
                            <Input
                              value={newPartner.contact_name || ""}
                              onChange={e => setNewPartner({ ...newPartner, contact_name: e.target.value })}
                              className="bg-muted border-border"
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={newPartner.email || ""}
                              onChange={e => setNewPartner({ ...newPartner, email: e.target.value })}
                              className="bg-muted border-border"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={newPartner.phone || ""}
                              onChange={e => setNewPartner({ ...newPartner, phone: e.target.value })}
                              className="bg-muted border-border"
                            />
                          </div>
                          <div>
                            <Label>City</Label>
                            <Input
                              value={newPartner.location_city || ""}
                              onChange={e => setNewPartner({ ...newPartner, location_city: e.target.value })}
                              className="bg-muted border-border"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input
                            value={newPartner.location_state || ""}
                            onChange={e => setNewPartner({ ...newPartner, location_state: e.target.value })}
                            className="bg-muted border-border"
                          />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Textarea
                            value={newPartner.notes || ""}
                            onChange={e => setNewPartner({ ...newPartner, notes: e.target.value })}
                            className="bg-muted border-border"
                          />
                        </div>
                        <Button onClick={addPartner} className="w-full bg-primary">Add Partner</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <ScrollArea className="h-[600px]">
                  {partners.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No partners yet. Add partner sign shops to assign referrals.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {partners.map((partner) => (
                        <div
                          key={partner.id}
                          className={`bg-card border rounded-lg p-4 ${
                            partner.is_active ? "border-border" : "border-border opacity-60"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{partner.company_name}</span>
                                {!partner.is_active && (
                                  <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {partner.contact_name && <p>{partner.contact_name}</p>}
                                <p>
                                  {partner.email && partner.email}
                                  {partner.email && partner.phone && " • "}
                                  {partner.phone && partner.phone}
                                </p>
                                {(partner.location_city || partner.location_state) && (
                                  <p>{[partner.location_city, partner.location_state].filter(Boolean).join(", ")}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Active</Label>
                              <Switch
                                checked={partner.is_active}
                                onCheckedChange={(checked) => togglePartnerActive(partner.id, checked)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Intelligence Tab */}
              <TabsContent value="intelligence" className="space-y-6">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-medium text-foreground">Conversation Intelligence</h2>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MousePointerClick className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Active Follow-ups</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">
                      {suggestedFollowups.filter(f => f.is_active).length}
                    </span>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Total Impressions</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">
                      {suggestedFollowups.reduce((sum, f) => sum + (f.impression_count || 0), 0)}
                    </span>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MousePointerClick className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">Total Clicks</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">
                      {suggestedFollowups.reduce((sum, f) => sum + (f.click_count || 0), 0)}
                    </span>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">Unresolved Gaps</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">
                      {knowledgeGaps.filter(g => !g.resolved).length}
                    </span>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FlaskConical className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-muted-foreground">A/B Tests</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">
                      {Object.keys(abTestResults).filter(cat => 
                        abTestResults[cat]?.length > 1
                      ).length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Suggested Follow-ups Management */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4" />
                      Follow-up Suggestions
                    </h3>
                    <ScrollArea className="h-[400px]">
                      {suggestedFollowups.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No follow-up suggestions configured.</p>
                      ) : (
                        <div className="space-y-3">
                          {suggestedFollowups.map((followup) => {
                            const impressions = followup.impression_count || 0;
                            const clicks = followup.click_count || 0;
                            const ctr = impressions > 0 ? (clicks / impressions * 100).toFixed(1) : "0.0";
                            const variantLabel = followup.variant_group || 'control';
                            const hasVariants = suggestedFollowups.some(f => 
                              f.category === followup.category && f.id !== followup.id
                            );
                            
                            return (
                            <div
                              key={followup.id}
                              className={`border rounded-lg p-3 ${followup.is_active ? "border-border" : "border-border opacity-60"} ${variantLabel !== 'control' ? "border-l-4 border-l-purple-500" : ""}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                                    {followup.category}
                                  </span>
                                  {variantLabel !== 'control' && (
                                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full flex items-center gap-1">
                                      <FlaskConical className="w-3 h-3" />
                                      {variantLabel}
                                    </span>
                                  )}
                                  {hasVariants && variantLabel === 'control' && (
                                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                      control
                                    </span>
                                  )}
                                </div>
                                <Switch
                                  checked={followup.is_active}
                                  onCheckedChange={(checked) => toggleFollowup(followup.id, checked)}
                                />
                              </div>
                              
                              {/* Stats row */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                <span>{impressions} impressions</span>
                                <span>{clicks} clicks</span>
                                <span className={`font-medium ${parseFloat(ctr) > 5 ? "text-green-400" : parseFloat(ctr) > 2 ? "text-yellow-400" : "text-muted-foreground"}`}>
                                  {ctr}% CTR
                                </span>
                              </div>
                              
                              <div className="text-xs text-muted-foreground mb-2">
                                Keywords: {followup.trigger_keywords?.join(", ")}
                              </div>
                              
                              {editingFollowup === followup.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={followup.followup_questions?.join("\n") || ""}
                                    onChange={(e) => {
                                      const questions = e.target.value.split("\n").filter(q => q.trim());
                                      setSuggestedFollowups(suggestedFollowups.map(f => 
                                        f.id === followup.id ? { ...f, followup_questions: questions } : f
                                      ));
                                    }}
                                    className="bg-muted border-border text-sm min-h-[80px]"
                                    placeholder="One question per line"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-primary"
                                      onClick={() => updateFollowupQuestions(followup.id, followup.followup_questions || [])}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingFollowup(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : showCreateVariant === followup.id ? (
                                <div className="space-y-2 mt-2 p-2 bg-purple-500/10 rounded border border-purple-500/30">
                                  <Label className="text-xs text-purple-400">Create A/B Test Variant</Label>
                                  <Textarea
                                    value={newVariantQuestions}
                                    onChange={(e) => setNewVariantQuestions(e.target.value)}
                                    className="bg-muted border-border text-sm min-h-[80px]"
                                    placeholder="Enter alternative questions (one per line)"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-purple-500 hover:bg-purple-600"
                                      onClick={() => {
                                        const questions = newVariantQuestions.split("\n").filter(q => q.trim());
                                        if (questions.length > 0) {
                                          createVariant(followup.id, questions);
                                        }
                                      }}
                                    >
                                      <FlaskConical className="w-3 h-3 mr-1" />
                                      Create Variant
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setShowCreateVariant(null);
                                        setNewVariantQuestions("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <ul className="text-sm space-y-1">
                                    {followup.followup_questions?.map((q, i) => (
                                      <li key={i} className="text-foreground">→ {q}</li>
                                    ))}
                                  </ul>
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => setEditingFollowup(followup.id)}
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    {variantLabel === 'control' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-purple-400 hover:text-purple-300"
                                        onClick={() => {
                                          setShowCreateVariant(followup.id);
                                          setNewVariantQuestions(followup.followup_questions?.join("\n") || "");
                                        }}
                                      >
                                        <Copy className="w-3 h-3 mr-1" />
                                        Create A/B Variant
                                      </Button>
                                    )}
                                    {variantLabel !== 'control' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-red-400 hover:text-red-300"
                                        onClick={() => deleteVariant(followup.id)}
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Delete Variant
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Knowledge Gaps */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Knowledge Gaps
                      <span className="text-xs text-muted-foreground">(Questions AI struggled with)</span>
                    </h3>
                    <ScrollArea className="h-[400px]">
                      {knowledgeGaps.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No knowledge gaps detected yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {knowledgeGaps.filter(g => !g.resolved).map((gap) => (
                            <div key={gap.id} className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm text-foreground">{gap.question}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      Asked {gap.frequency}x
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(gap.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {editingGapResolution === gap.id ? (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    placeholder="How did you resolve this? (e.g., 'Added to knowledge base', 'Updated system prompt')"
                                    className="bg-muted border-border text-sm min-h-[60px]"
                                    id={`resolution-${gap.id}`}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        const input = document.getElementById(`resolution-${gap.id}`) as HTMLTextAreaElement;
                                        resolveKnowledgeGap(gap.id, input?.value || "Resolved");
                                      }}
                                    >
                                      Mark Resolved
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingGapResolution(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setEditingGapResolution(gap.id)}
                                  >
                                    Resolve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-muted-foreground"
                                    onClick={() => deleteKnowledgeGap(gap.id)}
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {/* Show resolved gaps collapsed */}
                          {knowledgeGaps.filter(g => g.resolved).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <h4 className="text-xs text-muted-foreground mb-2">
                                Resolved ({knowledgeGaps.filter(g => g.resolved).length})
                              </h4>
                              {knowledgeGaps.filter(g => g.resolved).slice(0, 5).map((gap) => (
                                <div key={gap.id} className="border border-green-500/20 bg-green-500/5 rounded-lg p-2 mb-2 opacity-70">
                                  <p className="text-xs text-foreground line-clamp-1">{gap.question}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Resolution: {gap.resolution}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>

              {/* Training Stats Tab */}
              <TabsContent value="training" className="space-y-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-medium text-foreground">Training Stats</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Users Trained</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">{trainingStats.users_trained}</span>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Custom Instructions</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">{trainingStats.custom_instructions_count}</span>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Equipment Types Selected</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">{Object.keys(trainingStats.equipment_counts).length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Trained Users List */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">Users Who Trained Their Bot</h3>
                    <ScrollArea className="h-[200px]">
                      {trainedUsers.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No users have trained their bot yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {trainedUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                              <span className="text-foreground">{user.name}</span>
                              <span className="text-muted-foreground text-xs">{user.email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Equipment Stats */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">Most Common Equipment</h3>
                    <ScrollArea className="h-[200px]">
                      {Object.keys(trainingStats.equipment_counts).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No equipment selected yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(trainingStats.equipment_counts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([key, count]) => (
                              <div key={key} className="flex items-center justify-between text-sm">
                                <span className="text-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                <span className="text-primary font-medium">{count}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Materials Stats */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">Most Common Materials</h3>
                    <ScrollArea className="h-[200px]">
                      {Object.keys(trainingStats.material_counts).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No materials selected yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(trainingStats.material_counts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([key, count]) => (
                              <div key={key} className="flex items-center justify-between text-sm">
                                <span className="text-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                <span className="text-primary font-medium">{count}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Products Stats */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">Most Common Products</h3>
                    <ScrollArea className="h-[200px]">
                      {Object.keys(trainingStats.product_counts).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No products selected yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(trainingStats.product_counts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([key, count]) => (
                              <div key={key} className="flex items-center justify-between text-sm">
                                <span className="text-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                <span className="text-primary font-medium">{count}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>

                {/* Custom Instructions Samples */}
                {trainingStats.custom_instructions_samples.length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-foreground mb-3">Custom Instructions (Anonymized Themes)</h3>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
                        {trainingStats.custom_instructions_samples.map((instruction, i) => (
                          <div key={i} className="text-sm text-muted-foreground p-2 bg-muted rounded border border-border">
                            "{instruction}"
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>

              {/* Conversations Tab */}
              <TabsContent value="conversations" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-muted border-border"
                  />
                </div>

                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {filteredConversations.map((conv) => (
                      <div key={conv.id} className="bg-card border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            setExpandedConversation(
                              expandedConversation === conv.id ? null : conv.id
                            )
                          }
                          className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground">{conv.user_name}</span>
                                <span className="text-xs text-muted-foreground">{conv.user_email}</span>
                                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                                  {conv.experience_level}
                                </span>
                                {conv.transcript_emailed && (
                                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                    <MailCheck className="w-3 h-3" />
                                    Emailed
                                  </span>
                                )}
                                {!conv.transcript_emailed && conv.transcript_offered && (
                                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                                    <Mail className="w-3 h-3" />
                                    Offered
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {conv.last_message || "No messages"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{formatDate(conv.created_at)}</p>
                              <p className="text-xs text-primary">{conv.message_count} messages</p>
                              {conv.transcript_emailed_at && (
                                <p className="text-xs text-green-400">
                                  Sent {formatDate(conv.transcript_emailed_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>

                        {expandedConversation === conv.id && conv.messages && (
                          <div className="border-t border-border p-4 bg-muted/30 space-y-3 max-h-80 overflow-y-auto">
                            {conv.messages.map((msg: any, idx: number) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg ${
                                  msg.role === "user"
                                    ? "bg-bubble-user border border-bubble-user-border ml-8"
                                    : "bg-bubble-assistant mr-8"
                                }`}
                              >
                                <p className="text-xs text-muted-foreground mb-1">
                                  {msg.role === "user" ? "User" : "Assistant"}
                                </p>
                                <p className="text-sm text-foreground">{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Feedback Tab */}
              <TabsContent value="feedback" className="space-y-4">
                <div className="flex gap-2">
                  {(["all", "helpful", "not_helpful"] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={feedbackFilter === filter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFeedbackFilter(filter)}
                      className={feedbackFilter === filter ? "bg-primary" : ""}
                    >
                      {filter === "all" ? "All" : filter === "helpful" ? "Helpful" : "Not Helpful"}
                    </Button>
                  ))}
                </div>

                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {filteredFeedback.map((f) => (
                      <div key={f.id} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {f.rating === "helpful" ? (
                              <ThumbsUp className="w-4 h-4 text-primary" />
                            ) : (
                              <ThumbsDown className="w-4 h-4 text-secondary" />
                            )}
                            <span className="text-xs text-muted-foreground">{formatDate(f.created_at)}</span>
                          </div>
                        </div>
                        {f.message_content && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">User asked:</p>
                            <p className="text-sm text-foreground bg-muted/50 p-2 rounded">{f.message_content}</p>
                          </div>
                        )}
                        {f.assistant_response && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Assistant replied:</p>
                            <p className="text-sm text-foreground bg-muted/50 p-2 rounded">{f.assistant_response}</p>
                          </div>
                        )}
                        {f.comment && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Comment:</p>
                            <p className="text-sm text-foreground italic">{f.comment}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Gap Tracking Tab */}
              <TabsContent value="gaps" className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-secondary" />
                  <p className="text-sm text-muted-foreground">
                    Messages where the assistant indicated uncertainty or lack of information
                  </p>
                </div>

                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {gaps.map((gap) => (
                      <div key={gap.id} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">{formatDate(gap.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground">{gap.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {settings.map((setting) => (
                      <div key={setting.id} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground capitalize">
                              {setting.setting_name.replace(/_/g, " ")}
                            </h3>
                            <Switch
                              checked={setting.is_active}
                              onCheckedChange={(checked) =>
                                updateSetting(setting.id, setting.setting_value, checked)
                              }
                            />
                          </div>
                        </div>
                        <Textarea
                          value={setting.setting_value}
                          onChange={(e) => {
                            const updated = settings.map((s) =>
                              s.id === setting.id ? { ...s, setting_value: e.target.value } : s
                            );
                            setSettings(updated);
                          }}
                          className="bg-muted border-border min-h-[100px]"
                        />
                        <Button
                          onClick={() => updateSetting(setting.id, setting.setting_value, setting.is_active)}
                          size="sm"
                          className="mt-2 bg-primary"
                        >
                          Save Changes
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: number;
  accent?: boolean;
}) => (
  <div className={`bg-card border rounded-lg p-4 ${accent ? "border-primary/30" : "border-border"}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
  </div>
);

export default AdminDashboard;