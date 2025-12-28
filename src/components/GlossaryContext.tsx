import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GlossaryTerm {
  id: string;
  term: string;
  short_definition: string;
  full_definition?: string;
  image_url?: string;
  category?: string;
  related_terms?: string[];
}

interface GlossaryContextType {
  glossaryTerms: GlossaryTerm[];
  isLoading: boolean;
  selectedTerm: GlossaryTerm | null;
  setSelectedTerm: (term: GlossaryTerm | null) => void;
  trackTermInteraction: (termId: string, action: "hover" | "click", userId?: string, conversationId?: string) => void;
}

const GlossaryContext = createContext<GlossaryContextType | undefined>(undefined);

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  useEffect(() => {
    const fetchGlossary = async () => {
      try {
        const { data, error } = await supabase
          .from("glossary")
          .select("id, term, short_definition, full_definition, image_url, category, related_terms")
          .eq("is_active", true);

        if (error) throw error;
        setGlossaryTerms(data || []);
      } catch (error) {
        console.error("Error fetching glossary:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlossary();
  }, []);

  const trackTermInteraction = async (
    termId: string,
    action: "hover" | "click",
    userId?: string,
    conversationId?: string
  ) => {
    try {
      await supabase.from("glossary_analytics").insert({
        term_id: termId,
        action,
        user_id: userId || null,
        conversation_id: conversationId || null,
      });
    } catch (error) {
      console.error("Error tracking term interaction:", error);
    }
  };

  return (
    <GlossaryContext.Provider
      value={{
        glossaryTerms,
        isLoading,
        selectedTerm,
        setSelectedTerm,
        trackTermInteraction,
      }}
    >
      {children}
    </GlossaryContext.Provider>
  );
}

export function useGlossary() {
  const context = useContext(GlossaryContext);
  if (context === undefined) {
    throw new Error("useGlossary must be used within a GlossaryProvider");
  }
  return context;
}
