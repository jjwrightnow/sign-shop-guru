import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "platform_admin" | "company_admin" | "expert" | "user";

export interface UserRoleInfo {
  role: AppRole | null;
  companyId: string | null;
  companyName: string | null;
  isLoading: boolean;
  isExpert: boolean;
  isCompanyAdmin: boolean;
  isPlatformAdmin: boolean;
}

export function useUserRole(userId: string | null): UserRoleInfo {
  const [role, setRole] = useState<AppRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setCompanyId(null);
      setCompanyName(null);
      setIsLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      setIsLoading(true);
      try {
        // Fetch user role and company info
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select(`
            role,
            company_id,
            companies (
              name
            )
          `)
          .eq("user_id", userId)
          .maybeSingle();

        if (roleError) {
          console.error("Error fetching user role:", roleError);
          setRole(null);
          setCompanyId(null);
          setCompanyName(null);
        } else if (roleData) {
          setRole(roleData.role as AppRole);
          setCompanyId(roleData.company_id);
          setCompanyName((roleData.companies as any)?.name || null);
        } else {
          setRole(null);
          setCompanyId(null);
          setCompanyName(null);
        }
      } catch (error) {
        console.error("Error in useUserRole:", error);
        setRole(null);
        setCompanyId(null);
        setCompanyName(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [userId]);

  return {
    role,
    companyId,
    companyName,
    isLoading,
    isExpert: role === "expert" || role === "company_admin" || role === "platform_admin",
    isCompanyAdmin: role === "company_admin" || role === "platform_admin",
    isPlatformAdmin: role === "platform_admin",
  };
}
