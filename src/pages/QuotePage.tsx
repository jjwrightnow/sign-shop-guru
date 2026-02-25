import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  X,
  Home,
  Sun,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Type,
  Shapes,
} from "lucide-react";

// ── TYPES ──
interface FormData {
  artwork_url: string | null;
  indoor_outdoor: string;
  lighting_profile_sku: string;
  lighting_profile_name: string;
  sign_type: string;
  sign_text: string;
  letter_height_inches: number | null;
  quantity_range: string;
  budget_range: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
}

const INITIAL: FormData = {
  artwork_url: null,
  indoor_outdoor: "",
  lighting_profile_sku: "",
  lighting_profile_name: "",
  sign_type: "letters",
  sign_text: "",
  letter_height_inches: null,
  quantity_range: "",
  budget_range: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  notes: "",
};

const PROFILES = [
  { name: "Non-Illuminated", sku: "0000", desc: "No lighting. Clean metal finish." },
  { name: "Halo Lit", sku: "0001", desc: "Soft glow behind the letter. Halo effect." },
  { name: "Side Back + Halo", sku: "0011", desc: "Halo plus lit side returns." },
  { name: "Face Lit", sku: "1000", desc: "Bright face illumination. Maximum impact." },
  { name: "Face + Side Front", sku: "1100", desc: "Face lit with illuminated front sides." },
  { name: "All Sides Lit", sku: "1111", desc: "Every surface illuminated." },
];

const HEIGHTS = [4, 6, 8, 10, 12, 18, 24];

const BUDGETS = [
  { range: "$150 – $300", badges: ["Flex LED Neon"], sub: "Entry-level illuminated signage on acrylic backer" },
  { range: "$300 – $600", badges: ["Non-Lit Metal", "Halo Lit"], sub: "Fabricated stainless steel or aluminum letters" },
  { range: "$600 – $1,200", badges: ["Face Lit", "Face + Halo", "SS316 Coastal Grade"], sub: "All standard profiles, premium steel options" },
  { range: "$1,200 – $2,500", badges: ["All Profiles", "Brass", "Copper", "PVD Finishes"], sub: "Full material selection, specialty metals" },
  { range: "$2,500+", badges: ["Large Format", "Full Custom", "All Materials"], sub: "Complex projects, oversized letters, full spec control" },
];

// ── COMPONENT ──
const QuotePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [customHeight, setCustomHeight] = useState(false);
  const [fileError, setFileError] = useState("");

  const set = useCallback(
    <K extends keyof FormData>(key: K, val: FormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: val })),
    []
  );

  // ── FILE UPLOAD ──
  const handleFile = async (f: File) => {
    setFileError("");
    if (f.size > 20 * 1024 * 1024) {
      setFileError("File too large. Max 20MB.");
      return;
    }
    setFile(f);
    setUploading(true);
    const ext = f.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("quote-artwork").upload(path, f);
    if (error) {
      setFileError("Upload failed. Please try again.");
      setFile(null);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("quote-artwork").getPublicUrl(path);
    set("artwork_url", urlData.publicUrl);
    setUploading(false);
  };

  const removeFile = () => {
    setFile(null);
    set("artwork_url", null);
    setFileError("");
  };

  // ── ENVIRONMENT SELECT ──
  const selectEnv = (env: string) => {
    set("indoor_outdoor", env);
    if (env === "indoor") {
      set("lighting_profile_sku", "1000");
      set("lighting_profile_name", "Face Lit");
    } else {
      set("lighting_profile_sku", "0001");
      set("lighting_profile_name", "Halo Lit");
    }
  };

  // ── VALIDATION ──
  const canNext = () => {
    if (step === 2) return !!form.indoor_outdoor && !!form.lighting_profile_sku;
    if (step === 3) return !!form.sign_text && form.letter_height_inches !== null && !!form.quantity_range;
    if (step === 4) return !!form.budget_range;
    if (step === 5) return !!form.first_name && !!form.last_name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    return true;
  };

  // ── SUBMIT ──
  const handleSubmit = async () => {
    if (!canNext()) return;
    setSubmitting(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        indoor_outdoor: form.indoor_outdoor,
        lighting_profile_sku: form.lighting_profile_sku,
        lighting_profile_name: form.lighting_profile_name,
        sign_type: form.sign_type,
        sign_text: form.sign_text.trim(),
        letter_height_inches: form.letter_height_inches,
        quantity_range: form.quantity_range,
        budget_range: form.budget_range,
        artwork_url: form.artwork_url,
        notes: form.notes.trim() || null,
        source: "sign-shop-guru",
      };

      const { data, error } = await (supabase as any)
        .from("quote_submissions")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      // Send to n8n
      try {
        const res = await fetch(
          "https://americanveteranowned.app.n8n.cloud/webhook/quote-submission",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, id: data.id }),
          }
        );
        if (res.ok) {
          await (supabase as any)
            .from("quote_submissions")
            .update({ n8n_sent: true, n8n_sent_at: new Date().toISOString() })
            .eq("id", data.id);
        }
      } catch {
        // n8n failure is non-critical
      }

      setSubmitted(true);
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── SUCCESS SCREEN ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <div>
              <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">You're all set!</h1>
              <p className="text-muted-foreground mt-2">
                We'll review your project and send a quote to{" "}
                <span className="text-foreground font-medium">{form.email}</span> within 1 business day.
              </p>
            </div>
            <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lighting</span>
                <span className="text-foreground">{form.lighting_profile_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget</span>
                <span className="text-foreground">{form.budget_range}</span>
              </div>
              {form.letter_height_inches && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Letter height</span>
                  <span className="text-foreground">{form.letter_height_inches}"</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={() => { setForm(INITIAL); setFile(null); setStep(1); setSubmitted(false); }}>
                Start Another Quote
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── STEPS ──
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-['Space_Grotesk'] text-foreground">Upload your artwork</h2>
              <p className="text-sm text-muted-foreground mt-1">PDF, AI, EPS, JPG, or PNG. Max 20MB. You can skip this and describe your sign instead.</p>
            </div>
            {!file ? (
              <label
                className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors min-h-[180px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Drag & drop or <span className="text-primary underline">browse</span></p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.ai,.eps,.jpg,.jpeg,.png"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 bg-muted rounded-lg p-4">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Check className="h-5 w-5 text-primary" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{uploading ? "Uploading..." : `${(file.size / 1024 / 1024).toFixed(1)} MB`}</p>
                </div>
                <button onClick={removeFile} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
            )}
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
            <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-primary underline">Skip for now</button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-['Space_Grotesk'] text-foreground">Where will this sign live?</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: "indoor", label: "INDOORS", Icon: Home },
                { val: "outdoor", label: "OUTDOORS", Icon: Sun },
              ].map(({ val, label, Icon }) => (
                <button
                  key={val}
                  onClick={() => selectEnv(val)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-6 min-h-[100px] transition-all ${
                    form.indoor_outdoor === val
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <Icon className={`h-8 w-8 ${form.indoor_outdoor === val ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-semibold ${form.indoor_outdoor === val ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                </button>
              ))}
            </div>
            {form.indoor_outdoor && (
              <>
                <div>
                  <h3 className="text-lg font-semibold font-['Space_Grotesk'] text-foreground">Choose a lighting style</h3>
                  <p className="text-sm text-muted-foreground mt-1">We've selected a recommended style. You can change it.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PROFILES.map((p) => (
                    <button
                      key={p.sku}
                      onClick={() => { set("lighting_profile_sku", p.sku); set("lighting_profile_name", p.name); }}
                      className={`text-left rounded-lg border-2 p-4 transition-all relative ${
                        form.lighting_profile_sku === p.sku
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      {form.lighting_profile_sku === p.sku && (
                        <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                      <p className="font-semibold text-sm text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">SKU {p.sku}</p>
                      <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-foreground">Tell us about your sign</h2>

            {/* Sign type */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {[
                { val: "letters", label: "Letters", Icon: Type },
                { val: "logo", label: "Logo / Shape", Icon: Shapes },
              ].map(({ val, label, Icon }) => (
                <button
                  key={val}
                  onClick={() => set("sign_type", val)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all min-h-[44px] ${
                    form.sign_type === val ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {/* Sign text */}
            <div className="space-y-1.5">
              <Label>{form.sign_type === "letters" ? "What does it say?" : "Describe your logo or brand mark"}</Label>
              <Input
                placeholder={form.sign_type === "letters" ? "e.g. OPEN, WELCOME, Smith & Co" : "e.g. circular badge with eagle, company wordmark"}
                value={form.sign_text}
                onChange={(e) => set("sign_text", e.target.value)}
                maxLength={200}
              />
              {form.sign_type === "letters" && (
                <p className="text-xs text-muted-foreground text-right">{form.sign_text.length}/200</p>
              )}
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label>Approximate letter height</Label>
              <div className="flex flex-wrap gap-2">
                {HEIGHTS.map((h) => (
                  <button
                    key={h}
                    onClick={() => { setCustomHeight(false); set("letter_height_inches", h); }}
                    className={`rounded-md border px-4 py-2 text-sm font-medium min-h-[44px] transition-all ${
                      !customHeight && form.letter_height_inches === h
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {h}"
                  </button>
                ))}
                <button
                  onClick={() => { setCustomHeight(true); set("letter_height_inches", null); }}
                  className={`rounded-md border px-4 py-2 text-sm font-medium min-h-[44px] transition-all ${
                    customHeight ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  Custom
                </button>
              </div>
              {customHeight && (
                <div className="flex items-center gap-2 max-w-[200px]">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Height"
                    onChange={(e) => set("letter_height_inches", e.target.value ? Number(e.target.value) : null)}
                  />
                  <span className="text-sm text-muted-foreground">inches</span>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label>How many sets?</Label>
              <Select value={form.quantity_range} onValueChange={(v) => set("quantity_range", v)}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select quantity" />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5", "6-10", "11-20", "20+"].map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-['Space_Grotesk'] text-foreground">What's your approximate budget?</h2>
              <p className="text-sm text-muted-foreground mt-1">This helps us show you what's achievable at your price point.</p>
            </div>
            <div className="space-y-3">
              {BUDGETS.map((b) => (
                <button
                  key={b.range}
                  onClick={() => set("budget_range", b.range)}
                  className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                    form.budget_range === b.range
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <p className="font-semibold text-foreground">{b.range}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {b.badges.map((badge) => (
                      <Badge key={badge} variant="secondary" className="text-xs">{badge}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{b.sub}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-['Space_Grotesk'] text-foreground">Almost done</h2>
              <p className="text-sm text-muted-foreground mt-1">Where should we send your quote?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} disabled={submitting} />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} disabled={submitting} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={submitting} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} disabled={submitting} />
            </div>
            <div className="space-y-1.5">
              <Label>Anything else we should know?</Label>
              <Textarea rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} disabled={submitting} />
            </div>
            <p className="text-xs text-muted-foreground">
              By submitting you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>.
              We'll send your quote details to this email within 1 business day.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6 pb-6 space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {step} of 5</span>
              <span>{step * 20}%</span>
            </div>
            <Progress value={step * 20} className="h-2" />
          </div>

          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between gap-3 pt-2">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={submitting}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/")}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Home
              </Button>
            )}
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canNext() || submitting} className="min-w-[160px]">
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <>Get My Quote <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotePage;
