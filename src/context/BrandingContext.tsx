import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandingData {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  botAvatarUrl: string | null;
  supportEmail: string;
  isLoaded: boolean;
}

const defaultBranding: BrandingData = {
  companyName: "Sign Industry Consultant",
  logoUrl: null,
  primaryColor: null,
  secondaryColor: null,
  botAvatarUrl: null,
  supportEmail: "ask@signmaker.ai",
  isLoaded: false,
};

const BrandingContext = createContext<BrandingData>(defaultBranding);

export const useBranding = () => useContext(BrandingContext);

// Helper: convert hex to HSL string for CSS variables (e.g. "210 50% 40%")
const hexToHsl = (hex: string): string | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const applyColorToRoot = (varName: string, hexColor: string | null) => {
  if (!hexColor) return;
  const hsl = hexToHsl(hexColor);
  if (hsl) {
    document.documentElement.style.setProperty(varName, hsl);
  }
};

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  const [branding, setBranding] = useState<BrandingData>(defaultBranding);

  const applyBranding = (company: any) => {
    const data: BrandingData = {
      companyName: company.name || defaultBranding.companyName,
      logoUrl: company.logo_url || null,
      primaryColor: company.primary_color || null,
      secondaryColor: company.secondary_color || null,
      botAvatarUrl: company.bot_avatar_url || null,
      supportEmail: company.support_email || defaultBranding.supportEmail,
      isLoaded: true,
    };
    setBranding(data);
    document.title = data.companyName;
    applyColorToRoot("--primary", company.primary_color);
    applyColorToRoot("--secondary", company.secondary_color);
    applyColorToRoot("--accent", company.secondary_color);
  };

  // Step 1: Check URL param on mount
  useEffect(() => {
    const loadFromUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const companySlug = params.get("company");

      if (companySlug) {
        try {
          const { data, error } = await supabase
            .from("companies")
            .select("*")
            .eq("slug", companySlug)
            .eq("active", true)
            .limit(1)
            .single();

          if (!error && data) {
            applyBranding(data);
            return;
          }
        } catch (e) {
          console.error("Error loading company from URL:", e);
        }
      }

      // No company from URL — set loaded with defaults
      setBranding({ ...defaultBranding, isLoaded: true });
      document.title = defaultBranding.companyName;
    };

    loadFromUrl();
  }, []);

  // Step 2: After login, override with user's company
  useEffect(() => {
    const loadFromUser = async () => {
      const storedEmail = localStorage.getItem("signmaker_user_email");
      if (!storedEmail) return;

      try {
        // Get user via edge function
        const { data: userData, error: userError } = await supabase.functions.invoke("get-user-by-email", {
          body: { email: storedEmail },
        });

        if (userError || !userData?.user) return;

        const companyId = userData.user.company_id;
        if (!companyId) return;

        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .eq("active", true)
          .limit(1)
          .single();

        if (!companyError && company) {
          applyBranding(company);
        }
      } catch (e) {
        console.error("Error loading company from user:", e);
      }
    };

    loadFromUser();
  }, []);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
};
