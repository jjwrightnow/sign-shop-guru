import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lightbulb, Plus, Check, X, ThumbsUp, Eye, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExpertKnowledge {
  id: string;
  scope: string;
  company_id: string | null;
  topic: string;
  question_pattern: string | null;
  knowledge_text: string;
  knowledge_type: string;
  expert_id: string | null;
  upvotes: number;
  verified: boolean;
  created_at: string;
  company_name?: string;
  expert_name?: string;
}

interface GlobalKnowledgeManagementProps {
  adminToken: string;
}

const KNOWLEDGE_TYPES = ["correction", "addition", "verification"];

const GlobalKnowledgeManagement = ({ adminToken }: GlobalKnowledgeManagementProps) => {
  const { toast } = useToast();
  const [knowledge, setKnowledge] = useState<ExpertKnowledge[]>([]);
  const [pendingKnowledge, setPendingKnowledge] = useState<ExpertKnowledge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewingKnowledge, setViewingKnowledge] = useState<ExpertKnowledge | null>(null);
  const [filter, setFilter] = useState<"all" | "global" | "pending">("all");
  const [newKnowledge, setNewKnowledge] = useState({
    topic: "",
    question_pattern: "",
    knowledge_text: "",
    knowledge_type: "addition",
  });

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "fetchExpertKnowledge" },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;

      const allKnowledge = data?.knowledge || [];
      setKnowledge(allKnowledge.filter((k: ExpertKnowledge) => k.verified));
      setPendingKnowledge(allKnowledge.filter((k: ExpertKnowledge) => !k.verified));
    } catch (error) {
      console.error("Error fetching knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to load expert knowledge",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGlobalKnowledge = async () => {
    if (!newKnowledge.topic.trim() || !newKnowledge.knowledge_text.trim()) {
      toast({ description: "Topic and knowledge text are required", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: {
          action: "createGlobalKnowledge",
          knowledge: {
            ...newKnowledge,
            scope: "global",
            verified: true,
          },
        },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;

      toast({ description: "Global knowledge added successfully" });
      setShowAddDialog(false);
      setNewKnowledge({
        topic: "",
        question_pattern: "",
        knowledge_text: "",
        knowledge_type: "addition",
      });
      fetchKnowledge();
    } catch (error) {
      console.error("Error creating knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to create knowledge entry",
        variant: "destructive",
      });
    }
  };

  const handleApproveKnowledge = async (knowledgeId: string, promoteToGlobal: boolean) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: {
          action: "approveKnowledge",
          knowledgeId,
          promoteToGlobal,
        },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;

      toast({
        description: promoteToGlobal
          ? "Knowledge approved and promoted to global"
          : "Knowledge approved",
      });
      fetchKnowledge();
    } catch (error) {
      console.error("Error approving knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to approve knowledge",
        variant: "destructive",
      });
    }
  };

  const handleRejectKnowledge = async (knowledgeId: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: {
          action: "deleteKnowledge",
          knowledgeId,
        },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;

      toast({ description: "Knowledge entry rejected" });
      fetchKnowledge();
    } catch (error) {
      console.error("Error rejecting knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to reject knowledge",
        variant: "destructive",
      });
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "correction":
        return "destructive";
      case "addition":
        return "default";
      case "verification":
        return "secondary";
      default:
        return "outline";
    }
  };

  const filteredKnowledge = filter === "pending" 
    ? pendingKnowledge 
    : filter === "global"
    ? knowledge.filter(k => k.scope === "global")
    : knowledge;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading knowledge base...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Expert Knowledge</h2>
          {pendingKnowledge.length > 0 && (
            <Badge variant="destructive">{pendingKnowledge.length} pending</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v: "all" | "global" | "pending") => setFilter(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verified</SelectItem>
              <SelectItem value="global">Global Only</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Global Knowledge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Global Knowledge</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={newKnowledge.topic}
                    onChange={(e) =>
                      setNewKnowledge({ ...newKnowledge, topic: e.target.value })
                    }
                    placeholder="e.g., Channel letter depth for outdoor use"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pattern">Question Pattern (optional)</Label>
                  <Input
                    id="pattern"
                    value={newKnowledge.question_pattern}
                    onChange={(e) =>
                      setNewKnowledge({ ...newKnowledge, question_pattern: e.target.value })
                    }
                    placeholder="e.g., depth for channel letters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Knowledge Type</Label>
                  <Select
                    value={newKnowledge.knowledge_type}
                    onValueChange={(value) =>
                      setNewKnowledge({ ...newKnowledge, knowledge_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KNOWLEDGE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text">Knowledge Text</Label>
                  <Textarea
                    id="text"
                    value={newKnowledge.knowledge_text}
                    onChange={(e) =>
                      setNewKnowledge({ ...newKnowledge, knowledge_text: e.target.value })
                    }
                    placeholder="The expert knowledge to add to responses..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleAddGlobalKnowledge} className="w-full">
                  Add to Global Knowledge Base
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Upvotes</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKnowledge.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {item.topic}
                </TableCell>
                <TableCell>
                  <Badge variant={getTypeBadgeVariant(item.knowledge_type)}>
                    {item.knowledge_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {item.scope === "global" ? (
                      <Badge variant="outline">Global</Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Building2 className="h-3 w-3 mr-1" />
                        Company
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.upvotes}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewingKnowledge(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {filter === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleApproveKnowledge(item.id, false)}
                          title="Approve"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleApproveKnowledge(item.id, true)}
                          title="Approve & Promote to Global"
                        >
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRejectKnowledge(item.id)}
                          title="Reject"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredKnowledge.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {filter === "pending"
                    ? "No pending knowledge submissions"
                    : "No knowledge entries yet"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* View Knowledge Dialog */}
      <Dialog open={!!viewingKnowledge} onOpenChange={() => setViewingKnowledge(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Knowledge Details</DialogTitle>
          </DialogHeader>
          {viewingKnowledge && (
            <div className="space-y-4 pt-4">
              <div>
                <Label className="text-muted-foreground">Topic</Label>
                <p className="font-medium">{viewingKnowledge.topic}</p>
              </div>
              {viewingKnowledge.question_pattern && (
                <div>
                  <Label className="text-muted-foreground">Question Pattern</Label>
                  <p className="text-sm">{viewingKnowledge.question_pattern}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Knowledge</Label>
                <p className="text-sm bg-muted p-3 rounded-md">{viewingKnowledge.knowledge_text}</p>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Type: {viewingKnowledge.knowledge_type}</span>
                <span>Scope: {viewingKnowledge.scope}</span>
                <span>Upvotes: {viewingKnowledge.upvotes}</span>
              </div>
              {viewingKnowledge.company_name && (
                <div className="text-sm text-muted-foreground">
                  Company: {viewingKnowledge.company_name}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalKnowledgeManagement;
