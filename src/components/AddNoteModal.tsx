import { useState, useEffect } from "react";
import { Mic, MicOff, X, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AddNoteModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  companyId?: string;
  onNoteAdded?: () => void;
}

const NOTE_TYPES = [
  { value: "job", label: "Job" },
  { value: "supplier", label: "Supplier" },
  { value: "install_tip", label: "Install Tip" },
  { value: "pricing", label: "Pricing" },
  { value: "mistake", label: "Mistake" },
  { value: "idea", label: "Idea" },
  { value: "general", label: "General" },
];

const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "company", label: "Company" },
  { value: "public", label: "Public" },
];

const AddNoteModal = ({ open, onClose, userId, companyId, onNoteAdded }: AddNoteModalProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState<string>("general");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<string>("private");
  const [isSaving, setIsSaving] = useState(false);

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } =
    useSpeechRecognition();

  // Append transcript to content when it changes
  useEffect(() => {
    if (transcript) {
      setContent(transcript);
    }
  }, [transcript]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({ description: "Please enter some content", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const { error } = await supabase.from("knowledge_notes").insert({
        user_id: userId,
        company_id: companyId || null,
        content: content.trim(),
        note_type: noteType,
        tags: tagsArray.length > 0 ? tagsArray : null,
        visibility,
      });

      if (error) throw error;

      toast({ description: "Note saved!" });
      setContent("");
      setTags("");
      setNoteType("general");
      setVisibility("private");
      resetTranscript();
      onNoteAdded?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving note:", error);
      toast({ description: "Failed to save note", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isListening) stopListening();
    setContent("");
    setTags("");
    setNoteType("general");
    setVisibility("private");
    resetTranscript();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📝 Add Note
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Content with voice */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Note</Label>
              {isSupported && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleListening}
                  className={cn(
                    "gap-1",
                    isListening && "text-red-500 animate-pulse"
                  )}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Dictate
                    </>
                  )}
                </Button>
              )}
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your note or click Dictate to use voice..."
              className="min-h-[150px]"
            />
            {isListening && (
              <p className="text-xs text-muted-foreground animate-pulse">
                🎤 Listening... speak now
              </p>
            )}
          </div>

          {/* Note Type */}
          <div className="space-y-2">
            <Label htmlFor="noteType">Type</Label>
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., channel letters, LED, installation"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !content.trim()}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteModal;
