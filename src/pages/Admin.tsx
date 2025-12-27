import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

const Admin = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    const adminAuth = localStorage.getItem("signmaker_admin_auth");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (password: string) => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("setting_value")
        .eq("setting_name", "admin_password")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value === password) {
        localStorage.setItem("signmaker_admin_auth", "true");
        setIsAuthenticated(true);
        toast({ description: "Welcome to admin dashboard" });
      } else {
        toast({
          title: "Error",
          description: "Invalid password",
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
    localStorage.removeItem("signmaker_admin_auth");
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

export default Admin;
