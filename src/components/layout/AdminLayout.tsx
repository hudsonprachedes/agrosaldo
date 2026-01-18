import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Bell,
  Users,
  Ticket,
  CreditCard,
  DollarSign,
  Megaphone,
  Shield,
  LogOut,
  UserPlus,
  BarChart3,
  FileText,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import { getAppVersionLabel } from '@/version';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/admin/cadastros', label: 'Cadastros', icon: UserPlus },
  { path: '/admin/analises', label: 'Análises', icon: BarChart3 },
  { path: '/admin/solicitacoes', label: 'Solicitações', icon: Bell },
  { path: '/admin/clientes', label: 'Clientes', icon: Users },
  { path: '/admin/indicacao', label: 'Indicação', icon: Ticket },
  { path: '/admin/planos', label: 'Planos', icon: CreditCard },
  { path: '/admin/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/admin/regulamentacoes', label: 'Regulamentações', icon: FileText },
  { path: '/admin/comunicacao', label: 'Comunicação', icon: Megaphone },
  { path: '/admin/auditoria', label: 'Auditoria', icon: Shield },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { logout, stopImpersonation } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isImpersonating = localStorage.getItem('agrosaldo_is_impersonating') === 'true';

  const handleNavigate = React.useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const SidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-error flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground">AgroSaldo</p>
            <p className="text-xs text-muted-foreground">Painel Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={handleNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-error text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        {isImpersonating && (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => {
              setMobileMenuOpen(false);
              void stopImpersonation();
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Voltar ao Admin
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => {
            setMobileMenuOpen(false);
            logout();
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>

        <p className="pt-1 text-[10px] text-muted-foreground text-center">{getAppVersionLabel()}</p>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar (desktop) */}
      {!isMobile && (
        <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">{SidebarContent}</aside>
      )}

      {/* Menu mobile */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[18rem] p-0">
            <SheetTitle className="sr-only">Menu do Painel Admin</SheetTitle>
            <SheetDescription className="sr-only">Navegação entre módulos administrativos</SheetDescription>
            <div className="h-full bg-card flex flex-col">{SidebarContent}</div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {isMobile && (
          <div className="sticky top-0 z-10 bg-background border-b border-border">
            <div className="h-14 px-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu"
                onClick={() => setMobileMenuOpen(true)}
              >
                <PanelLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <p className="font-display font-semibold text-foreground truncate">Painel Admin</p>
              </div>
            </div>
          </div>
        )}
        <div className={cn(isMobile ? 'p-4' : 'p-6 lg:p-8')}>
          {children}
        </div>
      </main>
    </div>
  );
}
