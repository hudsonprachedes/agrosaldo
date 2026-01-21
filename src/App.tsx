import { ReactNode, Suspense, lazy } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProvider from "@/lib/react-query/QueryProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import GlobalLoading from "@/components/GlobalLoading";

// Pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const PropertySelection = lazy(() => import("./pages/PropertySelection"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const QuestionarioEpidemiologico = lazy(() => import("./pages/QuestionarioEpidemiologico"));
const QuestionarioEpidemiologicoHistorico = lazy(() => import("./pages/QuestionarioEpidemiologicoHistorico"));
const QuestionarioEpidemiologicoDetalhe = lazy(() => import("./pages/QuestionarioEpidemiologicoDetalhe"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MobileHome = lazy(() => import("./pages/MobileHome"));
const Rebanho = lazy(() => import("./pages/Rebanho"));
const Extrato = lazy(() => import("./pages/Extrato"));
const Lancamentos = lazy(() => import("./pages/Lancamentos"));
const LaunchForm = lazy(() => import("./pages/LaunchForm"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const MinhaFazenda = lazy(() => import("./pages/MinhaFazenda"));
const Calculadoras = lazy(() => import("./pages/Calculadoras"));
const Blog = lazy(() => import("./pages/Blog"));
const Contact = lazy(() => import("./pages/Contact"));
const PublicValidarDocumento = lazy(() => import("./pages/PublicValidarDocumento"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSolicitacoes = lazy(() => import("./pages/admin/AdminSolicitacoes"));
const AdminClientes = lazy(() => import("./pages/admin/AdminClientes"));
const AdminIndicacao = lazy(() => import("./pages/admin/AdminIndicacao"));
const AdminPlanos = lazy(() => import("./pages/admin/AdminPlanos"));
const AdminFinanceiro = lazy(() => import("./pages/admin/AdminFinanceiro"));
const AdminComunicacao = lazy(() => import("./pages/admin/AdminComunicacao"));
const AdminAuditoria = lazy(() => import("./pages/admin/AdminAuditoria"));
const AdminCadastros = lazy(() => import("./pages/admin/AdminCadastros"));
const AdminAnalises = lazy(() => import("./pages/admin/AdminAnalises"));
const AdminRegulamentacoes = lazy(() => import("./pages/admin/AdminRegulamentacoes"));
const AdminConfiguracoes = lazy(() => import("./pages/admin/AdminConfiguracoes"));

// Other Pages
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Bloqueado = lazy(() => import("./pages/Bloqueado"));

// Layout
import AppLayout from "./components/layout/AppLayout";
import MobileLayout from "./components/layout/MobileLayout";
import AdminLayout from "./components/layout/AdminLayout";

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
  if (isLoading) {
    return <GlobalLoading title="Carregando sua sessão" />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role for admin routes
  if (requireAdmin && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (user.role !== 'super_admin' && (user as any).financialStatus && (user as any).financialStatus !== 'ok') {
    return <Navigate to="/bloqueado" replace />;
  }
  
  if (requireProperty && !selectedProperty) {
    return <Navigate to="/selecionar-propriedade" replace />;
  }

  // Verificar onboarding
  const onboardingSkippedThisSession =
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem('agrosaldo_skip_onboarding_once') === 'true';

  if (
    requireOnboarding &&
    requireProperty &&
    !user.onboardingCompletedAt &&
    !onboardingSkippedThisSession
  ) {
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

function WebLayoutRoute({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  return isMobile ? <>{children}</> : <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <VercelAnalytics />
          <Suspense fallback={<GlobalLoading />}> 
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/bloqueado" element={<Bloqueado />} />
              <Route path="/public/validar" element={<PublicValidarDocumento />} />
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
              <Route path="/questionario-epidemiologico/historico/:id" element={
                <ProtectedRoute><LayoutRoute><QuestionarioEpidemiologicoDetalhe /></LayoutRoute></ProtectedRoute>
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
              <Route path="/calculadoras" element={
                <ProtectedRoute><LayoutRoute><Calculadoras /></LayoutRoute></ProtectedRoute>
              } />
              <Route path="/minha-fazenda" element={
                <ProtectedRoute><LayoutRoute><MinhaFazenda /></LayoutRoute></ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute><LayoutRoute><MinhaFazenda /></LayoutRoute></ProtectedRoute>
              } />
              
              {/* Launch Forms */}
              <Route path="/lancamento" element={
                <ProtectedRoute><Navigate to="/lancamentos" replace /></ProtectedRoute>
              } />
              <Route path="/lancamento/nascimento" element={
                <ProtectedRoute><WebLayoutRoute><LaunchForm type="nascimento" /></WebLayoutRoute></ProtectedRoute>
              } />
              <Route path="/lancamento/mortalidade" element={
                <ProtectedRoute><WebLayoutRoute><LaunchForm type="mortalidade" /></WebLayoutRoute></ProtectedRoute>
              } />
              <Route path="/lancamento/venda" element={
                <ProtectedRoute><WebLayoutRoute><LaunchForm type="venda" /></WebLayoutRoute></ProtectedRoute>
              } />
              <Route path="/lancamento/compra" element={
                <ProtectedRoute><WebLayoutRoute><LaunchForm type="compra" /></WebLayoutRoute></ProtectedRoute>
              } />
              <Route path="/lancamento/vacina" element={
                <ProtectedRoute><WebLayoutRoute><LaunchForm type="vacina" /></WebLayoutRoute></ProtectedRoute>
              } />
              <Route path="/lancamento/outras" element={
                <ProtectedRoute><WebLayoutRoute><LaunchForm type="outras" /></WebLayoutRoute></ProtectedRoute>
              } />
              
              {/* Admin Routes - Require super_admin role */}
              <Route path="/admin" element={
                <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
              } />
              <Route path="/admin/cadastros" element={
                <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminCadastros /></AdminLayout></ProtectedRoute>
              } />
              <Route path="/admin/analises" element={
                <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminAnalises /></AdminLayout></ProtectedRoute>
              } />
              <Route path="/admin/regulamentacoes" element={
                <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminRegulamentacoes /></AdminLayout></ProtectedRoute>
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

              <Route path="/admin/configuracoes" element={
                <ProtectedRoute requireProperty={false} requireAdmin={true}><AdminLayout><AdminConfiguracoes /></AdminLayout></ProtectedRoute>
              } />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryProvider>
);

export default App;
