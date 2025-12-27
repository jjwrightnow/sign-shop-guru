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
  Check,
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

interface AdminDashboardProps {
  onLogout: () => void;
}

interface Stats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  messagesToday: number;
  helpfulFeedback: number;
  notHelpfulFeedback: number;
  totalLeads: number;
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
}

interface FeedbackRow {
  id: string;
  rating: string;
  comment: string | null;
  created_at: string;
  message_content: string;
  assistant_response: string;
  flagged?: boolean;
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

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    messagesToday: 0,
    helpfulFeedback: 0,
    notHelpfulFeedback: 0,
    totalLeads: 0,
  });
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [gaps, setGaps] = useState<GapRow[]>([]);
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "helpful" | "not_helpful">("all");
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchStats(),
      fetchConversations(),
      fetchFeedback(),
      fetchGaps(),
      fetchSettings(),
      fetchLeads(),
    ]);
    setIsLoading(false);
  };

  const fetchStats = async () => {
    try {
      const [users, convos, messages, feedbackData, leadsData] = await Promise.all([
        supabase.from("users").select("id", { count: "exact" }),
        supabase.from("conversations").select("id", { count: "exact" }),
        supabase.from("messages").select("id, created_at", { count: "exact" }),
        supabase.from("feedback").select("rating"),
        supabase.from("users").select("id", { count: "exact" }).eq("intent", "shopping"),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const messagesToday = messages.data?.filter(
        (m) => new Date(m.created_at) >= today
      ).length || 0;

      const helpful = feedbackData.data?.filter((f) => f.rating === "helpful").length || 0;
      const notHelpful = feedbackData.data?.filter((f) => f.rating === "not_helpful").length || 0;

      setStats({
        totalUsers: users.count || 0,
        totalConversations: convos.count || 0,
        totalMessages: messages.count || 0,
        messagesToday,
        helpfulFeedback: helpful,
        notHelpfulFeedback: notHelpful,
        totalLeads: leadsData.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data: convos, error } = await supabase
        .from("conversations")
        .select(`
          id,
          created_at,
          user_id,
          users (name, email, experience_level)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const conversationsWithMessages = await Promise.all(
        (convos || []).map(async (conv: any) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("content, role, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true });

          return {
            id: conv.id,
            user_name: conv.users?.name || "Unknown",
            user_email: conv.users?.email || "Unknown",
            experience_level: conv.users?.experience_level || "Unknown",
            created_at: conv.created_at,
            message_count: messages?.length || 0,
            last_message: messages?.[messages.length - 1]?.content || "",
            messages: messages || [],
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          id,
          rating,
          comment,
          created_at,
          message_id,
          messages (content, conversation_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const feedbackWithContext = await Promise.all(
        (data || []).map(async (f: any) => {
          let assistantResponse = "";
          if (f.messages?.conversation_id) {
            const { data: prevMessages } = await supabase
              .from("messages")
              .select("content, role")
              .eq("conversation_id", f.messages.conversation_id)
              .order("created_at", { ascending: true });

            const msgIndex = prevMessages?.findIndex(
              (m) => m.content === f.messages.content && m.role === "user"
            );
            if (msgIndex !== undefined && msgIndex >= 0 && prevMessages?.[msgIndex + 1]) {
              assistantResponse = prevMessages[msgIndex + 1].content;
            }
          }

          return {
            id: f.id,
            rating: f.rating,
            comment: f.comment,
            created_at: f.created_at,
            message_content: f.messages?.content || "",
            assistant_response: assistantResponse,
          };
        })
      );

      setFeedback(feedbackWithContext);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  const fetchGaps = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, content, created_at, conversation_id")
        .eq("role", "assistant")
        .or(
          "content.ilike.%I don't have%,content.ilike.%check with%,content.ilike.%I'm not sure%,content.ilike.%I cannot%,content.ilike.%I can't verify%"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setGaps(data || []);
    } catch (error) {
      console.error("Error fetching gaps:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .order("setting_name");

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, phone, business_name, project_type, timeline, location, created_at, contacted")
        .eq("intent", "shopping")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads((data || []).map(l => ({ ...l, contacted: l.contacted ?? false })));
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const updateSetting = async (id: string, value: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("settings")
        .update({ setting_value: value, is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast({ description: "Setting updated successfully" });
      fetchSettings();
    } catch (error) {
      console.error("Error updating setting:", error);
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
    }
  };

  const toggleLeadContacted = async (leadId: string, contacted: boolean) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ contacted })
        .eq("id", leadId);

      if (error) throw error;
      setLeads(leads.map(l => l.id === leadId ? { ...l, contacted } : l));
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({ title: "Error", description: "Failed to update lead", variant: "destructive" });
    }
  };

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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
              <StatCard icon={MessageSquare} label="Conversations" value={stats.totalConversations} />
              <StatCard icon={MessageSquare} label="Total Messages" value={stats.totalMessages} />
              <StatCard icon={MessageSquare} label="Messages Today" value={stats.messagesToday} accent />
              <StatCard icon={ThumbsUp} label="Helpful" value={stats.helpfulFeedback} />
              <StatCard icon={ThumbsDown} label="Not Helpful" value={stats.notHelpfulFeedback} />
              <StatCard icon={ShoppingBag} label="Leads" value={stats.totalLeads} accent />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="leads" className="space-y-4">
              <TabsList className="bg-surface border border-border">
                <TabsTrigger value="leads">Leads</TabsTrigger>
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
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{conv.user_name}</span>
                                <span className="text-xs text-muted-foreground">{conv.user_email}</span>
                                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                                  {conv.experience_level}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {conv.last_message || "No messages"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{formatDate(conv.created_at)}</p>
                              <p className="text-xs text-primary">{conv.message_count} messages</p>
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