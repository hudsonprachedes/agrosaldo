import React, { useEffect, useState } from 'react';
import { adminService, AdminDashboardActivityItem, AdminDashboardStats, AdminMrrSeriesPoint } from '@/services/api.service';
import { toast } from 'sonner';
import {
  Users,
  Beef,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactApexChart from 'react-apexcharts';
import PageSkeleton from '@/components/PageSkeleton';

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<AdminDashboardStats | null>(null);
  const [mrrSeries, setMrrSeries] = useState<AdminMrrSeriesPoint[]>([]);
  const [activity, setActivity] = useState<AdminDashboardActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [stats, series, recent] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getMrrSeries(12),
          adminService.getDashboardActivity(8),
        ]);

        setKpis(stats);
        setMrrSeries(series);
        setActivity(recent);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    void loadStats();
  }, []);

  if (isLoading || !kpis) {
    return <PageSkeleton cards={4} lines={12} />;
  }

  const mrrChartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      height: 240,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#10b981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.08,
      },
    },
    xaxis: {
      categories: mrrSeries.map((p) => p.month),
      labels: {
        rotate: -45,
        style: { fontSize: '11px' },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `R$ ${val.toLocaleString('pt-BR')}`,
      },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
    },
  };

  const mrrChartSeries = [
    {
      name: 'MRR',
      data: mrrSeries.map((p) => p.value),
    },
  ];

  const kpiCards = [
    {
      title: 'Total de Clientes',
      value: kpis.totalTenants,
      icon: Users,
      color: 'bg-primary',
      change: '+8%',
      changeType: 'positive',
    },
    {
      title: 'Clientes Ativos',
      value: kpis.activeTenants,
      icon: CheckCircle,
      color: 'bg-success',
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Total de Cabeças',
      value: kpis.totalCattle.toLocaleString('pt-BR'),
      icon: Beef,
      color: 'bg-earth',
      change: '+5.2%',
      changeType: 'positive',
    },
    {
      title: 'MRR',
      value: `R$ ${kpis.mrr.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'bg-wheat',
      change: '+15%',
      changeType: 'positive',
    },
    {
      title: 'Solicitações Pendentes',
      value: kpis.pendingRequests,
      icon: Clock,
      color: 'bg-warning',
      change: '',
      changeType: 'neutral',
    },
    {
      title: 'Inadimplentes',
      value: kpis.overdueCount,
      icon: AlertCircle,
      color: 'bg-error',
      change: '-2',
      changeType: 'positive',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Dashboard Administrativo
        </h1>
        <p className="text-muted-foreground">
          Visão geral do sistema AgroSaldo
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card 
            key={kpi.title}
            className="animate-fade-in hover:shadow-card-hover transition-shadow"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{kpi.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${kpi.color}/10 flex items-center justify-center`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              {kpi.change && (
                <div className="flex items-center gap-1 mt-4 text-sm">
                  <TrendingUp className={`w-4 h-4 ${
                    kpi.changeType === 'positive' ? 'text-success' : 
                    kpi.changeType === 'negative' ? 'text-error' : 'text-muted-foreground'
                  }`} />
                  <span className={`font-medium ${
                    kpi.changeType === 'positive' ? 'text-success' : 
                    kpi.changeType === 'negative' ? 'text-error' : 'text-muted-foreground'
                  }`}>{kpi.change}</span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução MRR</CardTitle>
          </CardHeader>
          <CardContent>
            {mrrSeries.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                Sem dados de MRR para exibir
              </div>
            ) : (
              <ReactApexChart options={mrrChartOptions} series={mrrChartSeries} type="area" height={240} />
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                Sem atividades recentes
              </div>
            ) : (
              activity.map((item) => {
                const icon =
                  item.action === 'USER_APPROVED' ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : item.action === 'USER_REJECTED' ? (
                    <XCircle className="w-5 h-5 text-error" />
                  ) : item.action === 'approve' ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : item.action === 'reject' ? (
                    <XCircle className="w-5 h-5 text-error" />
                  ) : (
                    <Clock className="w-5 h-5 text-warning" />
                  );

                const iconBg =
                  item.action === 'USER_APPROVED' || item.action === 'approve'
                    ? 'bg-success/10'
                    : item.action === 'USER_REJECTED' || item.action === 'reject'
                      ? 'bg-error/10'
                      : 'bg-warning/10';

                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.userName} • {new Date(item.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
