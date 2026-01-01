import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, ArrowLeft, Trash2, Edit2, Tag, Eye, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddNoteModal from "@/components/AddNoteModal";

interface Note {
  id: string;
  content: string;
  note_type: string | null;
  tags: string[] | null;
  visibility: string | null;
  created_at: string;
}

const NOTE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  job: { label: "Job", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  supplier: { label: "Supplier", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  install_tip: { label: "Install Tip", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  pricing: { label: "Pricing", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  mistake: { label: "Mistake", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  idea: { label: "Idea", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  general: { label: "General", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
};

const Notes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterVisibility, setFilterVisibility] = useState<string>("all");
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from localStorage
  useEffect(() => {
    const checkUser = async () => {
      const storedEmail = localStorage.getItem("signmaker_user_email");
      if (!storedEmail) {
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("get-user-by-email", {
          body: { email: storedEmail },
        });

        if (error || !data?.user) {
          navigate("/");
          return;
        }

        setUserId(data.user.id);
      } catch {
        navigate("/");
      }
    };

    checkUser();
  }, [navigate]);

  // Load notes
  const loadNotes = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from("knowledge_notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Apply search if present
      if (searchQuery.trim()) {
        query = query.textSearch("content", searchQuery.trim());
      }

      // Apply type filter
      if (filterType !== "all") {
        query = query.eq("note_type", filterType);
      }

      // Apply visibility filter
      if (filterVisibility !== "all") {
        query = query.eq("visibility", filterVisibility);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      console.error("Error loading notes:", error);
      toast({ description: "Failed to load notes", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotes();
    }
  }, [userId, searchQuery, filterType, filterVisibility]);

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;

    try {
      const { error } = await supabase.from("knowledge_notes").delete().eq("id", noteId);

      if (error) throw error;

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast({ description: "Note deleted" });
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast({ description: "Failed to delete note", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">📝 My Notes</h1>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(NOTE_TYPE_LABELS).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Visibility Filter */}
          <Select value={filterVisibility} onValueChange={setFilterVisibility}>
            <SelectTrigger className="w-[140px]">
              <Eye className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes List */}
      <div className="container max-w-4xl mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== "all" || filterVisibility !== "all"
                ? "No notes match your filters"
                : "No notes yet"}
            </p>
            {!searchQuery && filterType === "all" && filterVisibility === "all" && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add your first note
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {notes.map((note) => {
              const typeInfo = NOTE_TYPE_LABELS[note.note_type || "general"] || NOTE_TYPE_LABELS.general;
              
              return (
                <Card key={note.id} className="hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(note.created_at)}
                        </span>
                        {note.visibility && note.visibility !== "private" && (
                          <Badge variant="outline" className="text-xs">
                            {note.visibility}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{truncateContent(note.content)}</p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-3 flex-wrap">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {note.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      <AddNoteModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        userId={userId}
        onNoteAdded={loadNotes}
      />
    </div>
  );
};

export default Notes;
