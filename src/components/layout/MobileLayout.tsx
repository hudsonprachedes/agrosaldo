import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import {
  Home,
  Beef,
  Plus,
  FileText,
  Menu,
  RefreshCw,
  ChevronDown,
  LogOut,
  BarChart3,
  Wallet,
  Settings,
  X,
  ClipboardList,
  Cloud,
  CloudOff,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useSyncStatus } from '@/hooks/useSyncStatus';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

const bottomNavItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/rebanho', label: 'Rebanho', icon: Beef },
  { path: '/lancamento', label: '', icon: Plus, isCenter: true },
  { path: '/extrato', label: 'Extrato', icon: FileText },
  { path: '/menu', label: 'Menu', icon: Menu, isSheet: true },
];

const menuItems = [
  { path: '/analises', label: 'Análises', icon: BarChart3 },
  { path: '/questionario-epidemiologico', label: 'Questionário', icon: ClipboardList },
  { path: '/minha-fazenda', label: 'Minha Fazenda', icon: Settings },
  { path: '/financeiro', label: 'Financeiro', icon: Wallet },
];

export default function MobileLayout({ children, showBottomNav = true }: MobileLayoutProps) {
  const { user, selectedProperty, logout, clearSelectedProperty, selectProperty } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { isOnline, isSyncing, pendingCount, syncNow } = useSyncStatus();

  if (!user || !selectedProperty) {
    return null;
  }

  const properties = user.properties ?? [];

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between p-3 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-primary-foreground hover:bg-primary-foreground/10 h-auto py-2 px-3 -ml-2"
                style={{ minWidth: 0 }}
              >
                <div className="text-left">
                  <p className="font-display font-bold text-base leading-tight">
                    {selectedProperty.name}
                  </p>
                  <p className="text-xs opacity-80">
                    {selectedProperty.city}, {selectedProperty.state}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 ml-2 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {properties.map((prop) => (
                <DropdownMenuItem
                  key={prop.id}
                  onClick={() => {
                    if (prop.id !== selectedProperty.id) {
                      selectProperty(prop.id);
                    }
                  }}
                  className={cn(
                    prop.id === selectedProperty.id && 'bg-muted'
                  )}
                >
                  <div className="flex-1">
                    <p className="font-medium">{prop.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(prop.cattleCount ?? 0).toLocaleString()} cabeças
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => clearSelectedProperty()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Trocar propriedade
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={syncNow}
              disabled={isSyncing}
            >
              <RefreshCw className={cn('w-5 h-5', isSyncing && 'animate-spin')} />
            </Button>

            <div className="flex items-center gap-1 rounded-full bg-primary-foreground/10 px-2 py-1 text-[11px] font-medium min-w-0">
              {isSyncing ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              ) : isOnline ? (
                <Cloud className="w-4 h-4 shrink-0 text-emerald-200" />
              ) : (
                <WifiOff className="w-4 h-4 shrink-0 text-red-200" />
              )}
              <span className="sr-only">
                {isSyncing ? 'Sincronizando' : isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {pendingCount > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-yellow-200/80 text-yellow-900 px-2 py-1 text-[10px] font-semibold shrink-0">
                <span className="leading-none">{pendingCount}</span>
                <span className="leading-none whitespace-nowrap">pendente{pendingCount !== 1 ? 's' : ''}</span>
              </div>
            )}

            <NotificationsPanel 
              propertyId={selectedProperty?.id}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {bottomNavItems.map((item) => {
              if (item.isSheet) {
                return (
                  <Sheet key={item.path} open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetTrigger asChild>
                      <button className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-muted-foreground active:scale-95 transition-transform">
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                      </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-3xl">
                      <SheetDescription className="sr-only">Menu principal</SheetDescription>
                      <SheetHeader className="pb-4">
                        <SheetTitle className="text-left font-display">Menu</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-2 pb-8">
                        {menuItems.map((menuItem) => (
                          <button
                            key={menuItem.path}
                            onClick={() => {
                              setMenuOpen(false);
                              navigate(menuItem.path);
                            }}
                            className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-muted transition-colors"
                          >
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <menuItem.icon className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-medium">{menuItem.label}</span>
                          </button>
                        ))}
                        <div className="border-t border-border my-4" />
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                            <LogOut className="w-5 h-5" />
                          </div>
                          <span className="font-medium">Sair da Conta</span>
                        </button>
                      </div>
                    </SheetContent>
                  </Sheet>
                );
              }

              if (item.isCenter) {
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="relative -mt-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                      <Plus className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center justify-center gap-1 px-3 py-2 active:scale-95 transition-all',
                      isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        "relative",
                        isActive && "after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
                      )}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
