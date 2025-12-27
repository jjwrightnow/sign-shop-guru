import { useState } from "react";
import { Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminLoginProps {
  onLogin: (password: string) => void;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onLogin(password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            SignMaker<span className="text-primary">.ai</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-muted border-border focus:border-primary"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-primary text-primary-foreground hover:neon-glow-strong transition-all"
          >
            {isLoading ? "Authenticating..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
