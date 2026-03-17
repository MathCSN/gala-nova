import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EventProvider } from "@/context/EventContext";
import AppSidebar from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import Formulas from "@/pages/Formulas";
import BudgetPage from "@/pages/Budget";
import Simulation from "@/pages/Simulation";
import Logistics from "@/pages/Logistics";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <EventProvider>
        <BrowserRouter>
          <div className="flex min-h-screen">
            <AppSidebar />
            <main className="flex-1 ml-16 lg:ml-56 p-6 bg-secondary/30">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/formulas" element={<Formulas />} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="/simulation" element={<Simulation />} />
                <Route path="/logistics" element={<Logistics />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </EventProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
