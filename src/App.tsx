import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BrandingProvider } from "@/context/BrandingContext";
import Index from "./pages/Index";
import Terms from "./pages/Terms";
import Admin from "./pages/Admin";
import CompanyAdmin from "./pages/CompanyAdmin";
import Notes from "./pages/Notes";
import QuotePage from "./pages/QuotePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrandingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/company/admin" element={<CompanyAdmin />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/quote" element={<QuotePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BrandingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
