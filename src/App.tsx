import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Subscriptions from "./pages/Subscriptions";
import Insured from "./pages/Insured";
import Contributions from "./pages/Contributions";
import Beneficiaries from "./pages/Beneficiaries";
import Reimbursements from "./pages/Reimbursements";
import Documents from "./pages/Documents";
import AuditLog from "./pages/AuditLog";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard - accessible à tous les staff */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Souscriptions - admin, agent, dirigeant */}
              <Route path="/subscriptions" element={
                <ProtectedRoute allowedRoles={['admin', 'agent', 'dirigeant']}>
                  <Subscriptions />
                </ProtectedRoute>
              } />
              
              {/* Assurés - admin, agent, dirigeant */}
              <Route path="/insured" element={
                <ProtectedRoute allowedRoles={['admin', 'agent', 'dirigeant']}>
                  <Insured />
                </ProtectedRoute>
              } />
              
              {/* Cotisations - admin, comptabilite, dirigeant */}
              <Route path="/contributions" element={
                <ProtectedRoute allowedRoles={['admin', 'comptabilite', 'dirigeant']}>
                  <Contributions />
                </ProtectedRoute>
              } />
              
              {/* Ayants droit - admin, agent, dirigeant */}
              <Route path="/beneficiaries" element={
                <ProtectedRoute allowedRoles={['admin', 'agent', 'dirigeant']}>
                  <Beneficiaries />
                </ProtectedRoute>
              } />
              
              {/* Remboursements - admin, medecin, comptabilite, dirigeant */}
              <Route path="/reimbursements" element={
                <ProtectedRoute allowedRoles={['admin', 'medecin', 'comptabilite', 'dirigeant']}>
                  <Reimbursements />
                </ProtectedRoute>
              } />
              
              {/* Documents - accessible à tous les staff */}
              <Route path="/documents" element={<Documents />} />
              
              {/* Gestion utilisateurs - admin uniquement */}
              <Route path="/users" element={
                <ProtectedRoute requiredRole="admin">
                  <Users />
                </ProtectedRoute>
              } />
              
              {/* Audit - admin, dirigeant */}
              <Route path="/audit" element={
                <ProtectedRoute allowedRoles={['admin', 'dirigeant']}>
                  <AuditLog />
                </ProtectedRoute>
              } />
              
              {/* Paramètres - admin uniquement */}
              <Route path="/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <Settings />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
