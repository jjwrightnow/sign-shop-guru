import { useState, useCallback } from "react";
import { Upload, FileText, X, Image as ImageIcon, ChevronLeft, ChevronRight, Grid3X3, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ContextMode = "dropzone" | "spec" | "illustration" | "artwork" | "pdf";

export interface PdfPage {
  pageNum: number;
  dataUrl: string;
  signName: string;
}

export type SignAssignments = Record<number, {
  signName: string;
  profileSku: string | null;
  mergedInto: number | null;
}>;

const PROFILE_NAME_TO_SKU: Record<string, string> = {
  "Non-Illuminated": "0000",
  "Halo Lit": "0001",
  "Side Back Lit": "0010",
  "Side Back + Halo": "0011",
  "Side Front Lit": "0100",
  "Side Front + Halo": "0101",
  "Full Side Lit": "0110",
  "Full Side + Halo": "0111",
  "Face Lit": "1000",
  "Face + Halo": "1001",
  "Face + Side Back": "1010",
  "Face + Side Back + Halo": "1011",
  "Face + Side Front": "1100",
  "Face + Side Front + Halo": "1101",
  "Face + Full Side": "1110",
  "Fully Illuminated": "1111",
};

const PROFILE_NAMES = Object.keys(PROFILE_NAME_TO_SKU);

interface ContextPanelProps {
  mode: ContextMode;
  droppedFile: File | null;
  onFileDrop: (file: File | null) => void;
  // PDF viewer props
  pdfPages?: PdfPage[];
  activePdfPage?: number;
  onPdfPageChange?: (n: number) => void;
  assignments?: SignAssignments;
  onAssign?: (pageNum: number, field: 'signName' | 'profileSku' | 'mergedInto', value: string | number | null) => void;
  onSubmitSigns?: () => void;
  submitting?: boolean;
  submitted?: boolean;
  uploadedFileName?: string;
  onResetPdf?: () => void;
}

// ── Dropzone ────────────────────────────────────────────────
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

// ── Spec ─────────────────────────────────────────────────────
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

// ── Illustration ─────────────────────────────────────────────
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

// ── Artwork ──────────────────────────────────────────────────
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

// ── Status helpers ───────────────────────────────────────────
function getPageStatus(assignments: SignAssignments, pageNum: number): 'unassigned' | 'named' | 'assigned' | 'merged' {
  const a = assignments[pageNum];
  if (!a) return 'unassigned';
  if (a.mergedInto !== null) return 'merged';
  if (a.profileSku) return 'assigned';
  if (a.signName && a.signName !== `Sign ${pageNum}`) return 'named';
  return 'unassigned';
}

function statusDotColor(status: string): string {
  switch (status) {
    case 'assigned': return '#22c55e';
    case 'named': return '#f59e0b';
    case 'merged': return '#60a5fa';
    default: return '#555';
  }
}

// ── PDF Viewer ───────────────────────────────────────────────
const PdfViewerState = ({
  pages,
  activePage,
  onPageChange,
  assignments,
  onAssign,
  onSubmit,
  submitting,
  submitted,
  uploadedFileName,
  onReset,
}: {
  pages: PdfPage[];
  activePage: number;
  onPageChange: (n: number) => void;
  assignments: SignAssignments;
  onAssign: (pageNum: number, field: 'signName' | 'profileSku' | 'mergedInto', value: string | number | null) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitted: boolean;
  uploadedFileName: string;
  onReset: () => void;
}) => {
  const [showThumbnails, setShowThumbnails] = useState(false);
  const currentPage = pages.find(p => p.pageNum === activePage);
  const currentAssignment = assignments[activePage];

  const assignedCount = Object.values(assignments).filter(a => a.mergedInto === null && a.profileSku).length;
  const unassignedCount = Object.values(assignments).filter(a => a.mergedInto === null && !a.profileSku).length;

  const currentProfileName = currentAssignment?.profileSku
    ? Object.entries(PROFILE_NAME_TO_SKU).find(([, sku]) => sku === currentAssignment.profileSku)?.[0] ?? undefined
    : undefined;

  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 gap-3">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-6 h-6 text-green-500" />
        </div>
        <p className="text-sm font-medium text-foreground">Submitted successfully</p>
        <p className="text-[11px] text-muted-foreground text-center">
          {assignedCount + unassignedCount} signs sent for factory review<br />
          {assignedCount} with profile · {unassignedCount} for factory recommendation
        </p>
        <button
          onClick={onReset}
          className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          + Configure Another Project
        </button>
      </div>
    );
  }

  // Other pages for merge dropdown (exclude current page)
  const otherPages = pages.filter(p => p.pageNum !== activePage && !assignments[p.pageNum]?.mergedInto);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Nav bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, activePage - 1))}
            disabled={activePage <= 1}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            Page {activePage} of {pages.length}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pages.length, activePage + 1))}
            disabled={activePage >= pages.length}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThumbnails(true)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <div className="flex gap-1">
            {pages.map(p => (
              <div
                key={p.pageNum}
                className="w-2 h-2 rounded-full cursor-pointer"
                style={{ backgroundColor: statusDotColor(getPageStatus(assignments, p.pageNum)) }}
                onClick={() => onPageChange(p.pageNum)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Page image */}
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden min-h-0" style={{ maxHeight: '40vh' }}>
        {currentPage && (
          <img
            src={currentPage.dataUrl}
            alt={`Page ${activePage}`}
            className="max-h-full max-w-full object-contain rounded"
          />
        )}
      </div>

      {/* Assignment panel */}
      <div className="px-4 py-3 border-t border-border/40 space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground w-16 shrink-0">Sign name</label>
          <Input
            value={currentAssignment?.signName ?? ''}
            onChange={(e) => onAssign(activePage, 'signName', e.target.value)}
            className="h-7 text-xs bg-muted border-border"
            placeholder="e.g. Main entrance"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground w-16 shrink-0">Profile</label>
          <Select
            value={currentProfileName ?? ""}
            onValueChange={(val) => {
              const sku = PROFILE_NAME_TO_SKU[val] ?? null;
              onAssign(activePage, 'profileSku', sku);
            }}
          >
            <SelectTrigger className="h-7 text-xs bg-muted border-border">
              <SelectValue placeholder="— Factory recommends —" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {PROFILE_NAMES.map(name => (
                <SelectItem key={name} value={name} className="text-xs">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {otherPages.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-muted-foreground w-16 shrink-0">Merge</label>
            <Select
              value={currentAssignment?.mergedInto?.toString() ?? ""}
              onValueChange={(val) => {
                onAssign(activePage, 'mergedInto', val ? parseInt(val) : null);
              }}
            >
              <SelectTrigger className="h-7 text-xs bg-muted border-border">
                <SelectValue placeholder="Same sign as page…" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {otherPages.map(p => (
                  <SelectItem key={p.pageNum} value={p.pageNum.toString()} className="text-xs">
                    Page {p.pageNum} — {assignments[p.pageNum]?.signName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="px-4 pb-3">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit All Signs →
        </button>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          {assignedCount} assigned · {unassignedCount} unassigned · factory fills gaps
        </p>
      </div>

      {/* Thumbnail dialog */}
      <Dialog open={showThumbnails} onOpenChange={setShowThumbnails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">All Pages — {uploadedFileName}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
            {pages.map(p => {
              const status = getPageStatus(assignments, p.pageNum);
              const profName = assignments[p.pageNum]?.profileSku
                ? Object.entries(PROFILE_NAME_TO_SKU).find(([, s]) => s === assignments[p.pageNum].profileSku)?.[0]
                : null;
              return (
                <button
                  key={p.pageNum}
                  onClick={() => { onPageChange(p.pageNum); setShowThumbnails(false); }}
                  className={cn(
                    "relative rounded-lg border p-1.5 transition-all hover:border-primary/50",
                    activePage === p.pageNum ? "border-primary" : "border-border"
                  )}
                >
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusDotColor(status) }} />
                  <img src={p.dataUrl} alt={`Page ${p.pageNum}`} className="w-full aspect-[3/4] object-contain rounded bg-muted/20" />
                  <p className="text-[10px] text-foreground mt-1 truncate">{assignments[p.pageNum]?.signName ?? `Sign ${p.pageNum}`}</p>
                  {profName && <p className="text-[9px] text-primary truncate">{profName}</p>}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Main ContextPanel ────────────────────────────────────────
const ContextPanel = ({
  mode,
  droppedFile,
  onFileDrop,
  pdfPages = [],
  activePdfPage = 1,
  onPdfPageChange,
  assignments = {},
  onAssign,
  onSubmitSigns,
  submitting = false,
  submitted = false,
  uploadedFileName = '',
  onResetPdf,
}: ContextPanelProps) => {
  const isPdf = mode === "pdf" && pdfPages.length > 0;

  return (
    <div className={cn(isPdf ? "h-auto min-h-[220px]" : "h-[220px]", "w-full")}>
      <div className="max-w-[760px] mx-auto px-4 h-full">
        {mode === "dropzone" && <DropzoneState onFileDrop={onFileDrop} />}
        {mode === "spec" && <SpecState />}
        {mode === "illustration" && <IllustrationState />}
        {mode === "artwork" && <ArtworkState file={droppedFile} onRemove={() => onFileDrop(null)} />}
        {isPdf && onPdfPageChange && onAssign && onSubmitSigns && onResetPdf && (
          <PdfViewerState
            pages={pdfPages}
            activePage={activePdfPage}
            onPageChange={onPdfPageChange}
            assignments={assignments}
            onAssign={onAssign}
            onSubmit={onSubmitSigns}
            submitting={submitting}
            submitted={submitted}
            uploadedFileName={uploadedFileName}
            onReset={onResetPdf}
          />
        )}
      </div>
    </div>
  );
};

export default ContextPanel;
export { PROFILE_NAME_TO_SKU };
