import { X, ExternalLink, ArrowLeft } from "lucide-react";
import { useGlossary, GlossaryTerm } from "./GlossaryContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface GlossaryPanelProps {
  onClose: () => void;
  showFullGlossary?: boolean;
}

export function GlossaryPanel({ onClose, showFullGlossary = false }: GlossaryPanelProps) {
  const { glossaryTerms, selectedTerm, setSelectedTerm } = useGlossary();

  // Group terms by category
  const termsByCategory = glossaryTerms.reduce((acc, term) => {
    const category = term.category || "general";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(term);
    return acc;
  }, {} as Record<string, GlossaryTerm[]>);

  const categoryLabels: Record<string, string> = {
    letter_types: "Letter Types",
    lighting_styles: "Lighting Styles",
    components: "Components",
    mounting: "Mounting",
    materials: "Materials",
    sign_types: "Sign Types",
    electrical: "Electrical",
    general: "General",
  };

  const handleRelatedTermClick = (termName: string) => {
    const term = glossaryTerms.find(
      (t) => t.term.toLowerCase() === termName.toLowerCase()
    );
    if (term) {
      setSelectedTerm(term);
    }
  };

  // If showing a specific term
  if (selectedTerm && !showFullGlossary) {
    return (
      <div className="glossary-panel">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTerm(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <h2 className="text-xl font-semibold text-primary capitalize mb-2">
            {selectedTerm.term}
          </h2>

          {selectedTerm.category && (
            <span className="inline-block text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full mb-4">
              {categoryLabels[selectedTerm.category] || selectedTerm.category}
            </span>
          )}

          {selectedTerm.image_url && (
            <div className="mb-4 rounded-lg overflow-hidden border border-border">
              <img
                src={selectedTerm.image_url}
                alt={selectedTerm.term}
                className="w-full h-auto max-h-48 object-cover"
              />
            </div>
          )}

          <p className="text-foreground leading-relaxed mb-4">
            {selectedTerm.full_definition || selectedTerm.short_definition}
          </p>

          {selectedTerm.related_terms && selectedTerm.related_terms.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Related Terms
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedTerm.related_terms.map((relatedTerm) => {
                  const existsInGlossary = glossaryTerms.some(
                    (t) => t.term.toLowerCase() === relatedTerm.toLowerCase()
                  );
                  return (
                    <button
                      key={relatedTerm}
                      onClick={() => handleRelatedTermClick(relatedTerm)}
                      disabled={!existsInGlossary}
                      className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                        existsInGlossary
                          ? "border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                          : "border-border text-muted-foreground cursor-default"
                      }`}
                    >
                      {relatedTerm}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Full glossary view
  return (
    <div className="glossary-panel">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">📖 Glossary</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {Object.entries(termsByCategory)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, terms]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">
                  {categoryLabels[category] || category}
                </h3>
                <div className="space-y-2">
                  {terms.map((term) => (
                    <button
                      key={term.id}
                      onClick={() => setSelectedTerm(term)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <div className="font-medium text-foreground capitalize">
                        {term.term}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {term.short_definition}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
