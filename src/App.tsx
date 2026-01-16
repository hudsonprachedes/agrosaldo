import { useEffect, useState, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { isOnboardingCompleted } from "@/lib/indexeddb";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import PropertySelection from "./pages/PropertySelection";
import Onboarding from "./pages/Onboarding";
import QuestionarioEpidemiologico from "./pages/QuestionarioEpidemiologico";
import QuestionarioEpidemiologicoHistorico from "./pages/QuestionarioEpidemiologicoHistorico";
import Dashboard from "./pages/Dashboard";
import MobileHome from "./pages/MobileHome";
import Rebanho from "./pages/Rebanho";
import Extrato from "./pages/Extrato";
import Lancamentos from "./pages/Lancamentos";
import LaunchForm from "./pages/LaunchForm";
import Analytics from "./pages/Analytics";
import Financeiro from "./pages/Financeiro";
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
import AdminCadastros from "./pages/admin/AdminCadastros";
import AdminAnalises from "./pages/admin/AdminAnalises";
import AdminRegulamentacoes from "./pages/admin/AdminRegulamentacoes";

// Other Pages
import Cadastro from "./pages/Cadastro";
import Bloqueado from "./pages/Bloqueado";

// Layout
import AppLayout from "./components/layout/AppLayout";
import MobileLayout from "./components/layout/MobileLayout";
import AdminLayout from "./components/layout/AdminLayout";

const queryClient = new QueryClient();

function ProtectedRoute({ 
  children, 
  requireProperty = true, 
  requireAdmin = false,
  requireOnboarding = true 
}: { 
  children: ReactNode; 
  requireProperty?: boolean;
  requireAdmin?: boolean;
  requireOnboarding?: boolean;
}) {
  const { user, selectedProperty, isLoading } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Carregar status do onboarding
  useEffect(() => {
    if (!selectedProperty || !requireOnboarding) {
      return;
    }
    const checkOnboarding = async () => {
      try {
        const completed = await isOnboardingCompleted(selectedProperty.id);
        setOnboardingCompleted(completed);
      } catch (error) {
        console.error('Erro ao verificar onboarding:', error);
        setOnboardingCompleted(false);
      }
    };
    checkOnboarding();
  }, [selectedProperty, requireOnboarding]);
  
  const effectiveOnboardingCompleted = !requireOnboarding || !selectedProperty ? true : onboardingCompleted;

  if (isLoading || (requireOnboarding && effectiveOnboardingCompleted === null)) {
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

  // Verificar onboarding
  if (requireOnboarding && requireProperty && !effectiveOnboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

function DashboardRoute() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileHome /> : <AppLayout><Dashboard /></AppLayout>;
}

function LayoutRoute({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  return isMobile ? <MobileLayout>{children}</MobileLayout> : <AppLayout>{children}</AppLayout>;
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
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/bloqueado" element={<Bloqueado />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/selecionar-propriedade" element={<PropertySelection />} />
            
            {/* Onboarding Route */}
            <Route path="/onboarding" element={
              <ProtectedRoute requireProperty={true} requireOnboarding={false}><Onboarding /></ProtectedRoute>
            } />
            
            {/* Questionário Route */}
            <Route path="/questionario-epidemiologico" element={
              <ProtectedRoute><LayoutRoute><QuestionarioEpidemiologico /></LayoutRoute></ProtectedRoute>
            } />
            <Route path="/questionario-epidemiologico/historico" element={
              <ProtectedRoute><LayoutRoute><QuestionarioEpidemiologicoHistorico /></LayoutRoute></ProtectedRoute>
            } />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardRoute /></ProtectedRoute>
            } />
            <Route path="/rebanho" element={
              <ProtectedRoute><LayoutRoute><Rebanho /></LayoutRoute></ProtectedRoute>
            } />
            <Route path="/extrato" element={
              <ProtectedRoute><LayoutRoute><Extrato /></LayoutRoute></ProtectedRoute>
            } />
            <Route path="/lancamentos" element={
              <ProtectedRoute><LayoutRoute><Lancamentos /></LayoutRoute></ProtectedRoute>
            } />
            <Route path="/financeiro" element={
              <ProtectedRoute><LayoutRoute><Financeiro /></LayoutRoute></ProtectedRoute>
            } />
            <Route path="/analises" element={
              <ProtectedRoute><LayoutRoute><Analytics /></LayoutRoute></ProtectedRoute>
            } />
            <Route path="/minha-fazenda" element={
              <ProtectedRoute><LayoutRoute><MinhaFazenda /></LayoutRoute></ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute><LayoutRoute><MinhaFazenda /></LayoutRoute></ProtectedRoute>
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
            <Route path="/admin/cadastros" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminCadastros /></ProtectedRoute>
            } />
            <Route path="/admin/analises" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminAnalises /></ProtectedRoute>
            } />
            <Route path="/admin/regulamentacoes" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminRegulamentacoes /></ProtectedRoute>
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
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminFinanceiro /></ProtectedRoute>
            } />
            <Route path="/admin/comunicacao" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminComunicacao /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/auditoria" element={
              <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminAuditoria /></AdminLayout></ProtectedRoute>
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
