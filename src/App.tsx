import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EventProvider } from "@/context/EventContext";
import { useAuth } from "@/hooks/useAuth";
import AppSidebar from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import Formulas from "@/pages/Formulas";
import BudgetPage from "@/pages/Budget";
import Simulation from "@/pages/Simulation";
import Logistics from "@/pages/Logistics";
import CRM from "@/pages/CRM";
import Admin from "@/pages/Admin";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  return (
    <EventProvider>
      <div className="flex min-h-screen">
        <AppSidebar onSignOut={signOut} userEmail={user.email} />
        <main className="flex-1 ml-16 lg:ml-56 p-6 bg-secondary/30">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/formulas" element={<Formulas />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/logistics" element={<Logistics />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </EventProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
