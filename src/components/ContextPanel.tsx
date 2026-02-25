import { useState, useCallback } from "react";
import { Upload, FileText, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ContextMode = "dropzone" | "spec" | "illustration" | "artwork";

interface ContextPanelProps {
  mode: ContextMode;
  droppedFile: File | null;
  onFileDrop: (file: File | null) => void;
}

const DropzoneState = ({ onFileDrop }: { onFileDrop: (file: File | null) => void }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileDrop(file);
  }, [onFileDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
        isDragOver
          ? "border-primary/50 bg-primary/5"
          : "border-border/50 bg-muted/20"
      )}
    >
      <Upload className="w-8 h-8 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground/70 text-center px-4">
        Drop artwork here or start a conversation above
      </p>
    </div>
  );
};

const SpecState = () => {
  const fields = [
    { label: "Lighting Profile", value: "—" },
    { label: "Letter Height", value: "—" },
    { label: "Material", value: "—" },
    { label: "Finish", value: "—" },
    { label: "Environment", value: "—" },
    { label: "Mounting", value: "—" },
    { label: "Artwork Status", value: "—" },
    { label: "Timeline", value: "—" },
  ];

  return (
    <div className="h-full flex flex-col p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Spec Summary
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
        {fields.map((field) => (
          <div key={field.label}>
            <span className="text-[11px] text-muted-foreground">{field.label}</span>
            <p className="text-sm text-foreground">{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const IllustrationState = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="flex-1 w-full max-w-[320px] flex items-center justify-center rounded-lg bg-muted/40 border border-border/30">
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/60">Lighting profile illustration</span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Profile name</p>
    </div>
  );
};

const ArtworkState = ({
  file,
  onRemove,
}: {
  file: File | null;
  onRemove: () => void;
}) => {
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No artwork attached</p>
      </div>
    );
  }

  const isImage = file.type.startsWith("image/");
  const previewUrl = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="h-full flex flex-col p-4 relative">
      {isImage && previewUrl ? (
        <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-muted/20">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <FileText className="w-10 h-10 text-muted-foreground/50" />
          <p className="text-sm text-foreground font-medium">{file.name}</p>
          <span className="text-xs text-muted-foreground">Attached to project</span>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute bottom-4 right-4 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
      >
        <X className="w-3 h-3" />
        Remove
      </button>
    </div>
  );
};

const ContextPanel = ({ mode, droppedFile, onFileDrop }: ContextPanelProps) => {
  return (
    <div className="h-[220px] w-full">
      <div className="max-w-[760px] mx-auto px-4 h-full">
        {mode === "dropzone" && <DropzoneState onFileDrop={onFileDrop} />}
        {mode === "spec" && <SpecState />}
        {mode === "illustration" && <IllustrationState />}
        {mode === "artwork" && <ArtworkState file={droppedFile} onRemove={() => onFileDrop(null)} />}
      </div>
    </div>
  );
};

export default ContextPanel;
