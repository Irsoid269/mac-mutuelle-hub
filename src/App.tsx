import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Subscriptions from "./pages/Subscriptions";
import Insured from "./pages/Insured";
import Beneficiaries from "./pages/Beneficiaries";
import Reimbursements from "./pages/Reimbursements";
import Documents from "./pages/Documents";
import AuditLog from "./pages/AuditLog";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/insured" element={<Insured />} />
            <Route path="/beneficiaries" element={<Beneficiaries />} />
            <Route path="/reimbursements" element={<Reimbursements />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
