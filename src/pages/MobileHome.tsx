import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { apiClient } from '@/lib/api-client';
import { DashboardAnalyticsDTO } from '@/types';
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import MobileLayout from '@/components/layout/MobileLayout';

export default function MobileHome() {
  const { user, selectedProperty } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [dashboard, setDashboard] = React.useState<DashboardAnalyticsDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedProperty) {
      navigate('/selecionar-propriedade');
      return;
    }

    if (!isMobile) {
      navigate('/dashboard');
    }
  }, [user, selectedProperty, isMobile, navigate]);

  useEffect(() => {
    if (!user || !selectedProperty || !isMobile) {
      setDashboard(null);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<DashboardAnalyticsDTO>(
          `/analytics/dashboard/${selectedProperty.id}`
        );
        setDashboard(response);
      } catch (error) {
        console.error('Erro ao carregar home mobile:', error);
        setDashboard(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [user, selectedProperty, isMobile]);

  if (!user || !selectedProperty || !isMobile) {
    return null;
  }

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-6 text-center text-muted-foreground">Carregando...</div>
      </MobileLayout>
    );
  }

  if (!dashboard) {
    return (
      <MobileLayout>
        <div className="p-6 text-center text-muted-foreground">
          Não foi possível carregar.
        </div>
      </MobileLayout>
    );
  }

  const totalCattle = dashboard.kpis.totalCattle;
  const monthlyBirths = dashboard.kpis.birthsThisMonth;
  const monthlyDeaths = dashboard.kpis.deathsThisMonth;
  const monthlyPurchases = dashboard.kpis.purchasesThisMonth ?? 0;
  const monthlyPurchaseCost = dashboard.kpis.purchaseCostThisMonth ?? 0;
  const compliance = dashboard.compliance.items;
  const overallCompliance = dashboard.compliance.overall;

  const latestRevenue = dashboard.charts.revenue[dashboard.charts.revenue.length - 1] ?? 0;
  const latestEvolution = dashboard.charts.evolution[dashboard.charts.evolution.length - 1] ?? 0;
  const previousEvolution = dashboard.charts.evolution[dashboard.charts.evolution.length - 2] ?? 0;
  const evolutionDelta = latestEvolution - previousEvolution;
  const netChangeThisMonth = monthlyBirths - monthlyDeaths;

  void monthlyPurchases;

  const getStatusColor = () => {
    if (overallCompliance >= 95) return 'bg-success';
    if (overallCompliance >= 80) return 'bg-warning';
    return 'bg-error';
  };

  const getStatusText = () => {
    if (overallCompliance >= 95) return 'Tudo em ordem! ✓';
    if (overallCompliance >= 80) return 'Atenção necessária';
    return 'Pendências críticas!';
  };

  return (
    <MobileLayout>
      {/* Hero Stats Section */}
      <div className="bg-primary text-primary-foreground dark:bg-card dark:text-card-foreground -mt-1 rounded-b-3xl px-4 pb-6 pt-2 border-b border-transparent dark:border-border">
        {/* Status Bar */}
        <div className="flex items-center gap-3 bg-primary-foreground/10 dark:bg-muted rounded-xl p-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
          <div className="flex-1">
            <p className="text-sm font-medium">{getStatusText()}</p>
            <p className="text-xs opacity-80">Compliance: {overallCompliance}%</p>
          </div>
          {overallCompliance >= 95 ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
        </div>

        {/* Total Cattle */}
        <div className="text-center py-4">
          <p className="text-5xl font-bold font-display tracking-tight">
            {totalCattle.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm opacity-80 mt-1">cabeças no rebanho</p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="bg-white/10 border border-white/10 dark:bg-muted dark:border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-white dark:text-primary" />
              <span className="text-2xl font-bold text-white dark:text-foreground drop-shadow">+{monthlyBirths}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">Nascimentos</p>
          </div>
          <div className="bg-primary-foreground/10 dark:bg-muted rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="w-4 h-4 text-error" />
              <span className="text-2xl font-bold text-error">-{monthlyDeaths}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">Mortes</p>
          </div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="p-4 -mt-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <h2 className="font-display font-semibold text-lg mb-4 text-foreground">
              Resumo do mês
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo (nasc. - mortes)</p>
                      <p className="text-2xl font-bold">
                        {netChangeThisMonth >= 0 ? '+' : ''}{netChangeThisMonth}
                      </p>
                    </div>
                    {netChangeThisMonth >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-error" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Receita (mês)</p>
                      <p className="text-2xl font-bold">
                        {latestRevenue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Variação do rebanho</p>
                      <p className="text-2xl font-bold">
                        {evolutionDelta >= 0 ? '+' : ''}{evolutionDelta}
                      </p>
                    </div>
                    {evolutionDelta >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-error" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Compras (mês)</p>
                      <p className="text-sm font-semibold leading-tight">
                        {monthlyPurchaseCost.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Cards */}
      <div className="px-4 space-y-3 pb-4">
        <div className="grid grid-cols-2 gap-3 pt-2">
          {compliance.slice(0, 4).map((item, index) => (
            (() => {
              const status = item.percentage >= 95 ? 'ok' : item.percentage >= 80 ? 'warning' : 'error';
              return (
            <Card 
              key={item.category}
              className={`border-0 shadow-sm animate-fade-in ${
                status === 'ok' ? 'bg-success/5' : 
                status === 'warning' ? 'bg-warning/5' : 
                'bg-error/5'
              }`}
              style={{ animationDelay: `${200 + index * 50}ms` }}
            >
              <CardContent className="p-3 text-center">
                <div className={`text-2xl font-bold ${
                  status === 'ok' ? 'text-success' : 
                  status === 'warning' ? 'text-warning' : 
                  'text-error'
                }`}>
                  {item.percentage}%
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{item.category}</p>
              </CardContent>
            </Card>
              );
            })()
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
