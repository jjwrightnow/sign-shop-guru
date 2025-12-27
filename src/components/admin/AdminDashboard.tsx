import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Settings,
  LogOut,
  ArrowLeft,
  Search,
  AlertCircle,
  Zap,
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

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    messagesToday: 0,
    helpfulFeedback: 0,
    notHelpfulFeedback: 0,
  });
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [gaps, setGaps] = useState<GapRow[]>([]);
  const [settings, setSettings] = useState<SettingRow[]>([]);
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
    ]);
    setIsLoading(false);
  };

  const fetchStats = async () => {
    try {
      const [users, convos, messages, feedbackData] = await Promise.all([
        supabase.from("users").select("id", { count: "exact" }),
        supabase.from("conversations").select("id", { count: "exact" }),
        supabase.from("messages").select("id, created_at", { count: "exact" }),
        supabase.from("feedback").select("rating"),
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
              <StatCard icon={MessageSquare} label="Conversations" value={stats.totalConversations} />
              <StatCard icon={MessageSquare} label="Total Messages" value={stats.totalMessages} />
              <StatCard icon={MessageSquare} label="Messages Today" value={stats.messagesToday} accent />
              <StatCard icon={ThumbsUp} label="Helpful" value={stats.helpfulFeedback} />
              <StatCard icon={ThumbsDown} label="Not Helpful" value={stats.notHelpfulFeedback} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="conversations" className="space-y-4">
              <TabsList className="bg-surface border border-border">
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="gaps">Gap Tracking</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

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
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <span>Responses containing uncertainty phrases that may indicate knowledge gaps</span>
                </div>

                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {gaps.map((gap) => (
                      <div key={gap.id} className="bg-card border border-border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-2">{formatDate(gap.created_at)}</p>
                        <p className="text-sm text-foreground">{gap.content}</p>
                      </div>
                    ))}
                    {gaps.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No knowledge gaps detected</p>
                    )}
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
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            <Label className="font-medium text-foreground">{setting.setting_name}</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Active</span>
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
                          size="sm"
                          className="mt-2 bg-primary text-primary-foreground"
                          onClick={() => updateSetting(setting.id, setting.setting_value, setting.is_active)}
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
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
  </div>
);

export default AdminDashboard;
