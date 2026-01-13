import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/useIsMobile";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import PropertySelection from "./pages/PropertySelection";
import Dashboard from "./pages/Dashboard";
import MobileHome from "./pages/MobileHome";
import Rebanho from "./pages/Rebanho";
import Extrato from "./pages/Extrato";
import Lancamentos from "./pages/Lancamentos";
import LaunchForm from "./pages/LaunchForm";
import Analytics from "./pages/Analytics";
import MinhaFazenda from "./pages/MinhaFazenda";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSolicitacoes from "./pages/admin/AdminSolicitacoes";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminIndicacao from "./pages/admin/AdminIndicacao";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminFinanceiro from "./pages/admin/AdminFinanceiro";
import AdminComunicacao from "./pages/admin/AdminComunicacao";
import AdminAuditoria from "./pages/admin/AdminAuditoria";
import AdminRegras from "./pages/admin/AdminRegras";

// Layout
import AppLayout from "./components/layout/AppLayout";
import AdminLayout from "./components/layout/AdminLayout";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requireProperty = true, requireAdmin = false }: { 
  children: React.ReactNode; 
  requireProperty?: boolean;
  requireAdmin?: boolean;
}) {
  const { user, selectedProperty, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role for admin routes
  if (requireAdmin && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (requireProperty && !selectedProperty) {
    return <Navigate to="/selecionar-propriedade" replace />;
  }
  
  return <>{children}</>;
}

function DashboardRoute() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileHome /> : <AppLayout><Dashboard /></AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/selecionar-propriedade" element={<PropertySelection />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardRoute /></ProtectedRoute>
            } />
            <Route path="/rebanho" element={
              <ProtectedRoute><Rebanho /></ProtectedRoute>
            } />
            <Route path="/extrato" element={
              <ProtectedRoute><Extrato /></ProtectedRoute>
            } />
            <Route path="/lancamentos" element={
              <ProtectedRoute><Lancamentos /></ProtectedRoute>
            } />
            <Route path="/financeiro" element={
              <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
            } />
            <Route path="/analises" element={
              <ProtectedRoute><Analytics /></ProtectedRoute>
            } />
            <Route path="/minha-fazenda" element={
              <ProtectedRoute><MinhaFazenda /></ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute><MinhaFazenda /></ProtectedRoute>
            } />
            
            {/* Launch Forms */}
            <Route path="/lancamento" element={
              <ProtectedRoute><MobileHome /></ProtectedRoute>
            } />
            <Route path="/lancamento/nascimento" element={
              <ProtectedRoute><LaunchForm type="nascimento" /></ProtectedRoute>
            } />
            <Route path="/lancamento/mortalidade" element={
              <ProtectedRoute><LaunchForm type="mortalidade" /></ProtectedRoute>
            } />
            <Route path="/lancamento/venda" element={
              <ProtectedRoute><LaunchForm type="venda" /></ProtectedRoute>
            } />
            <Route path="/lancamento/vacina" element={
              <ProtectedRoute><LaunchForm type="vacina" /></ProtectedRoute>
            } />
            <Route path="/lancamento/outras" element={
              <ProtectedRoute><LaunchForm type="outras" /></ProtectedRoute>
            } />
            
            {/* Admin Routes - Require super_admin role */}
            <Route path="/admin" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/solicitacoes" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminSolicitacoes /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/clientes" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminClientes /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/indicacao" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminIndicacao /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/planos" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminPlanos /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/financeiro" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminFinanceiro /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/comunicacao" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminComunicacao /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/auditoria" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminAuditoria /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/regras" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminRegras /></AdminLayout></ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
