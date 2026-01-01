import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap, Plus, UserPlus, Trash2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserRole {
  id: string;
  user_id: string;
  company_id: string | null;
  role: string;
  assigned_at: string;
  user_email?: string;
  user_name?: string;
  company_name?: string;
}

interface Company {
  id: string;
  name: string;
}

interface GlobalExpertManagementProps {
  adminToken: string;
}

const ROLES = ["platform_admin", "company_admin", "expert", "user"];

const GlobalExpertManagement = ({ adminToken }: GlobalExpertManagementProps) => {
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [filter, setFilter] = useState<"all" | "platform_admin" | "expert">("all");
  const [newAssignment, setNewAssignment] = useState({
    user_email: "",
    role: "expert",
    company_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesResponse, companiesResponse] = await Promise.all([
        supabase.functions.invoke("admin-data", {
          body: { action: "fetchUserRoles" },
          headers: { "x-admin-token": adminToken },
        }),
        supabase.functions.invoke("admin-data", {
          body: { action: "fetchCompanies" },
          headers: { "x-admin-token": adminToken },
        }),
      ]);

      if (rolesResponse.error) throw rolesResponse.error;
      if (companiesResponse.error) throw companiesResponse.error;

      setUserRoles(rolesResponse.data?.roles || []);
      setCompanies(companiesResponse.data?.companies || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load user roles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!newAssignment.user_email.trim()) {
      toast({ description: "User email is required", variant: "destructive" });
      return;
    }

    // Platform admin doesn't need a company
    if (newAssignment.role !== "platform_admin" && !newAssignment.company_id) {
      toast({ description: "Company is required for this role", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: {
          action: "assignUserRole",
          assignment: {
            ...newAssignment,
            company_id: newAssignment.role === "platform_admin" ? null : newAssignment.company_id,
          },
        },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;

      toast({ description: "Role assigned successfully" });
      setShowAssignDialog(false);
      setNewAssignment({ user_email: "", role: "expert", company_id: "" });
      fetchData();
    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to remove this role assignment?")) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("admin-data", {
        body: {
          action: "removeUserRole",
          roleId,
        },
        headers: { "x-admin-token": adminToken },
      });

      if (error) throw error;

      toast({ description: "Role removed successfully" });
      fetchData();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "platform_admin":
        return "destructive";
      case "company_admin":
        return "default";
      case "expert":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "platform_admin":
        return <Shield className="h-3.5 w-3.5 mr-1" />;
      case "expert":
        return <GraduationCap className="h-3.5 w-3.5 mr-1" />;
      default:
        return null;
    }
  };

  const filteredRoles = filter === "all"
    ? userRoles
    : userRoles.filter(r => r.role === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">User Roles</h2>
          <Badge variant="outline">{userRoles.length}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v: "all" | "platform_admin" | "expert") => setFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="platform_admin">Platform Admins</SelectItem>
              <SelectItem value="expert">Experts Only</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign User Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">User Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAssignment.user_email}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, user_email: e.target.value })
                    }
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newAssignment.role}
                    onValueChange={(value) =>
                      setNewAssignment({ ...newAssignment, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newAssignment.role !== "platform_admin" && (
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Select
                      value={newAssignment.company_id}
                      onValueChange={(value) =>
                        setNewAssignment({ ...newAssignment, company_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleAssignRole} className="w-full">
                  Assign Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.user_name || "Unknown"}</span>
                    <span className="text-sm text-muted-foreground">{item.user_email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(item.role)} className="flex items-center w-fit">
                    {getRoleIcon(item.role)}
                    {item.role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.company_name || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(item.assigned_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRole(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredRoles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No role assignments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default GlobalExpertManagement;
