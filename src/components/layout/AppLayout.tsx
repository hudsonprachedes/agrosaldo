import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import {
  LayoutDashboard,
  Beef,
  FileText,
  Wallet,
  Settings,
  ChevronDown,
  LogOut,
  RefreshCw,
  Menu,
  X,
  Plus,
    Wifi,
    WifiOff,
    Cloud,
    CloudOff,
    Loader2,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { path: '/rebanho', label: 'Meu Rebanho', icon: Beef },
  { path: '/lancamentos', label: 'Lançamentos', icon: Plus },
  { path: '/extrato', label: 'Extrato', icon: FileText },
  { path: '/financeiro', label: 'Financeiro', icon: Wallet },
  { path: '/analises', label: 'Análises', icon: BarChart3 },
  { path: '/configuracoes', label: 'Minha Fazenda', icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, selectedProperty, logout, clearSelectedProperty, selectProperty } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { status, pendingCount, isOnline, isSyncing, syncNow } = useSyncStatus();

  if (!user || !selectedProperty) {
    return null;
  }

  const handleChangeProperty = () => {
    clearSelectedProperty();
  };

  const handleSelectProperty = (propertyId: string) => {
    if (propertyId !== selectedProperty.id) {
      selectProperty(propertyId);
      // A página será re-renderizada automaticamente com os novos dados
    }
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Beef className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-sidebar-foreground">AgroSaldo</h1>
                <p className="text-xs text-sidebar-muted">Gestão Pecuária</p>
              </div>
            </div>
          </div>

          {/* Property Selector */}
          <div className="p-4 border-b border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-left h-auto py-3 px-3 bg-sidebar-accent hover:bg-sidebar-accent/80"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-sidebar-foreground truncate">
                      {selectedProperty.name}
                    </p>
                    <p className="text-xs text-sidebar-muted">
                      {selectedProperty.city}, {selectedProperty.state}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-sidebar-muted shrink-0 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {user.properties.map((prop) => (
                  <DropdownMenuItem
                    key={prop.id}
                    onClick={() => handleSelectProperty(prop.id)}
                    className={cn(
                      prop.id === selectedProperty.id && 'bg-muted'
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{prop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {prop.cattleCount.toLocaleString()} cabeças
                      </p>
                    </div>
                    {prop.id === selectedProperty.id && (
                      <span className="text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleChangeProperty}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerenciar propriedades
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

            {/* Status de Sincronização */}
            <div className="px-4 py-3 border-t border-sidebar-border">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50">
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-warning" />
                    <span className="text-xs text-sidebar-foreground">Sincronizando...</span>
                  </>
                ) : !isOnline ? (
                  <>
                    <WifiOff className="w-4 h-4 text-error" />
                    <span className="text-xs text-sidebar-foreground">Offline</span>
                  </>
                ) : status === 'synced' ? (
                  <>
                    <Cloud className="w-4 h-4 text-success" />
                    <span className="text-xs text-sidebar-foreground">Sincronizado</span>
                  </>
                ) : status === 'error' ? (
                  <>
                    <CloudOff className="w-4 h-4 text-error" />
                    <span className="text-xs text-sidebar-foreground">Erro na sincronização</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-warning" />
                    <span className="text-xs text-sidebar-foreground">
                      {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              
                {isOnline && !isSyncing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-auto"
                    onClick={syncNow}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

          {/* User Menu & Sync Status */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            {/* Sync Status */}
            <div className="flex items-center justify-between px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                ) : isOnline ? (
                  <Cloud className="w-4 h-4 text-green-500" />
                ) : (
                  <CloudOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sidebar-muted">
                  {isSyncing ? 'Sincronizando...' : isOnline ? 'Sincronizado' : 'Offline'}
                </span>
              </div>
              {pendingCount > 0 && (
                <span className="text-sidebar-muted bg-sidebar-accent px-2 py-1 rounded text-xs">
                  {pendingCount}
                </span>
              )}
            </div>

            {/* Notifications + User */}
            <div className="flex items-center justify-between">
              <NotificationsPanel propertyId={selectedProperty?.id} />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-2"
                >
                  <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center">
                    <span className="text-xs font-semibold text-sidebar-primary-foreground">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-sidebar-muted truncate">{user.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Header + Sidebar Overlay */}
      {isMobile && (
        <>
          <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-40 flex items-center justify-between px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Beef className="w-5 h-5 text-primary" />
              <span className="font-display font-bold">{selectedProperty.name}</span>
            </div>

              {/* Badge de sincronização */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={syncNow}
                disabled={isSyncing || !isOnline}
                title={
                  !isOnline 
                    ? 'Offline - aguardando conexão' 
                    : status === 'synced' 
                    ? 'Sincronizado' 
                    : `${pendingCount} itens pendentes`
                }
              >
                {isSyncing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-warning" />
                ) : !isOnline ? (
                  <WifiOff className="w-5 h-5 text-error" />
                ) : status === 'synced' ? (
                  <Cloud className="w-5 h-5 text-success" />
                ) : status === 'error' ? (
                  <CloudOff className="w-5 h-5 text-error" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-warning" />
                )}
              </Button>
          </header>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setSidebarOpen(false)}
              />
              <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar animate-slide-in-left">
                <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                      <Beef className="w-5 h-5 text-sidebar-primary-foreground" />
                    </div>
                    <span className="font-display font-bold text-sidebar-foreground">AgroSaldo</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="text-sidebar-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <nav className="p-4 space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-primary'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      logout();
                      setSidebarOpen(false);
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    Sair
                  </Button>
                </div>
              </aside>
            </div>
          )}
        </>
      )}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 overflow-y-auto',
          isMobile && 'pt-14 pb-20'
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-40">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">Início</span>
          </NavLink>

          <NavLink
            to="/rebanho"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Beef className="w-5 h-5" />
            <span className="text-xs">Rebanho</span>
          </NavLink>

          <NavLink
            to="/lancamento"
            className="flex flex-col items-center gap-1 px-4 py-2 -mt-4"
          >
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <span className="text-2xl text-primary-foreground">+</span>
            </div>
          </NavLink>

          <NavLink
            to="/extrato"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <FileText className="w-5 h-5" />
            <span className="text-xs">Extrato</span>
          </NavLink>

          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Menu</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}
