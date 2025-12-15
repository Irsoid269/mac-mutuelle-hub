import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import { useInitialDataSync } from "@/hooks/useInitialDataSync";
import Dashboard from "./pages/Dashboard";
import Subscriptions from "./pages/Subscriptions";
import Insured from "./pages/Insured";
import Contributions from "./pages/Contributions";
import Beneficiaries from "./pages/Beneficiaries";
import Reimbursements from "./pages/Reimbursements";
import Providers from "./pages/Providers";
import Documents from "./pages/Documents";
import AuditLog from "./pages/AuditLog";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component pour initialiser la synchronisation
function AppContent() {
  const { isInitializing, progress } = useInitialDataSync();

  if (isInitializing && navigator.onLine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg font-medium text-foreground">Synchronisation des données...</p>
          <p className="text-sm text-muted-foreground">
            {progress.current}/{progress.total} tables synchronisées
          </p>
        </div>
      </div>
    );
  }

  return (
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
          
          {/* Prestataires - admin, agent, medecin, dirigeant */}
          <Route path="/providers" element={
            <ProtectedRoute allowedRoles={['admin', 'agent', 'medecin', 'dirigeant']}>
              <Providers />
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
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
