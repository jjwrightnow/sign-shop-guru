import { useState, useCallback, useRef } from "react";
import { useGlossary, GlossaryTerm } from "./GlossaryContext";

interface GlossaryHighlighterProps {
  text: string;
  userId?: string;
  conversationId?: string;
}

export function GlossaryHighlighter({ text, userId, conversationId }: GlossaryHighlighterProps) {
  const { glossaryTerms, setSelectedTerm, trackTermInteraction } = useGlossary();
  const [activeTerm, setActiveTerm] = useState<GlossaryTerm | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTrackedHover = useRef<Set<string>>(new Set());

  // Sort terms by length (longest first) to match "channel letters" before "letters"
  const sortedTerms = [...glossaryTerms].sort((a, b) => b.term.length - a.term.length);

  // Create regex pattern for all terms
  const pattern = sortedTerms.length > 0
    ? new RegExp(
        `\\b(${sortedTerms.map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
        "gi"
      )
    : null;

  const handleMouseEnter = useCallback((term: GlossaryTerm, e: React.MouseEvent) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.bottom + 8 
    });
    setActiveTerm(term);

    // Track hover after 500ms (to avoid accidental hovers)
    hoverTimeoutRef.current = setTimeout(() => {
      if (!hasTrackedHover.current.has(term.id)) {
        trackTermInteraction(term.id, "hover", userId, conversationId);
        hasTrackedHover.current.add(term.id);
      }
    }, 500);
  }, [trackTermInteraction, userId, conversationId]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveTerm(null);
  }, []);

  const handleClick = useCallback((term: GlossaryTerm) => {
    trackTermInteraction(term.id, "click", userId, conversationId);
    setSelectedTerm(term);
  }, [trackTermInteraction, setSelectedTerm, userId, conversationId]);

  // If no pattern or no terms, just return plain text
  if (!pattern || glossaryTerms.length === 0) {
    return <span>{text}</span>;
  }

  // Split text and highlight matches
  const parts = text.split(pattern);

  return (
    <span className="glossary-text">
      {parts.map((part, i) => {
        const matchedTerm = glossaryTerms.find(
          (t) => t.term.toLowerCase() === part.toLowerCase()
        );

        if (matchedTerm) {
          return (
            <span
              key={i}
              className="glossary-term"
              onMouseEnter={(e) => handleMouseEnter(matchedTerm, e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(matchedTerm)}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}

      {/* Tooltip */}
      {activeTerm && (
        <div
          className="glossary-tooltip"
          style={{
            position: "fixed",
            left: Math.min(tooltipPosition.x, window.innerWidth - 300),
            top: tooltipPosition.y,
            transform: "translateX(-50%)",
          }}
        >
          <div className="tooltip-term">{activeTerm.term}</div>
          <div className="tooltip-definition">{activeTerm.short_definition}</div>
          {activeTerm.image_url && (
            <img
              src={activeTerm.image_url}
              alt={activeTerm.term}
              className="tooltip-image"
            />
          )}
          <div className="tooltip-hint">Click for more details</div>
        </div>
      )}
    </span>
  );
}
