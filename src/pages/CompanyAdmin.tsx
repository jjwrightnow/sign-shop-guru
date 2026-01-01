import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Users, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CompanyAdmin = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Company Admin</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto py-8 px-4">
        <div className="bg-muted/30 border border-border rounded-lg p-8 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Company Admin Dashboard</h2>
          <p className="text-muted-foreground mb-4">
            This page is for company administrators to manage their team members and knowledge base.
          </p>
          <p className="text-sm text-muted-foreground">
            Access requires company_admin or platform_admin role assignment.
          </p>
        </div>

        <Tabs defaultValue="team" className="mt-8">
          <TabsList>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Company Knowledge
            </TabsTrigger>
          </TabsList>
          <TabsContent value="team" className="mt-6">
            <div className="text-center text-muted-foreground py-12">
              Team management features coming soon.
              <br />
              <span className="text-sm">Assign expert roles and manage team members.</span>
            </div>
          </TabsContent>
          <TabsContent value="knowledge" className="mt-6">
            <div className="text-center text-muted-foreground py-12">
              Company knowledge base coming soon.
              <br />
              <span className="text-sm">Add and manage company-specific knowledge.</span>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CompanyAdmin;
