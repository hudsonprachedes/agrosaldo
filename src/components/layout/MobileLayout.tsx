import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  Settings,
  X,
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
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

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
  { path: '/minha-fazenda', label: 'Minha Fazenda', icon: Settings },
  { path: '/extrato', label: 'Extrato Completo', icon: FileText },
];

export default function MobileLayout({ children, showBottomNav = true }: MobileLayoutProps) {
  const { user, selectedProperty, logout, clearSelectedProperty } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  if (!user || !selectedProperty) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-primary-foreground hover:bg-primary-foreground/10 h-auto py-2 px-3 -ml-2"
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
              {user.properties.map((prop) => (
                <DropdownMenuItem
                  key={prop.id}
                  onClick={() => {
                    clearSelectedProperty();
                    navigate('/selecionar-propriedade');
                  }}
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
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => clearSelectedProperty()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Trocar propriedade
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-24">
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
