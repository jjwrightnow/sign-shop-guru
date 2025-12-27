import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

const ADMIN_SESSION_KEY = "signmaker_admin_session";

const Admin = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedSession = localStorage.getItem(ADMIN_SESSION_KEY);
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (session.token && session.expiresAt) {
          const expiryDate = new Date(session.expiresAt);
          if (expiryDate > new Date()) {
            setSessionToken(session.token);
            setIsAuthenticated(true);
          } else {
            // Session expired
            localStorage.removeItem(ADMIN_SESSION_KEY);
          }
        }
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-auth", {
        body: { password, action: "login" },
      });

      if (error) throw error;

      if (data?.success) {
        // Store session securely
        localStorage.setItem(
          ADMIN_SESSION_KEY,
          JSON.stringify({
            token: data.sessionToken,
            expiresAt: data.expiresAt,
          })
        );
        setSessionToken(data.sessionToken);
        setIsAuthenticated(true);
        toast({ description: "Welcome to admin dashboard" });
      } else {
        toast({
          title: "Error",
          description: data?.error || "Invalid password",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "Failed to authenticate",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setSessionToken(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !sessionToken) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} adminToken={sessionToken} />;
};

export default Admin;
