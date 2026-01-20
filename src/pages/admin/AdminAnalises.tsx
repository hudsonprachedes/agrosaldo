import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactApexChart from 'react-apexcharts';
import { TrendingUp, Users, DollarSign, Activity, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAnalytics } from '@/hooks/queries/admin/useAdminAnalytics';

export default function AdminAnalises() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const analyticsQuery = useAdminAnalytics(period);

  useEffect(() => {
    if (analyticsQuery.isError) {
      toast.error('Erro ao carregar dados de análise');
    }
  }, [analyticsQuery.isError]);

  const analytics = analyticsQuery.data ?? null;

  if (analyticsQuery.isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        Carregando análises...
      </div>
    );
  }

  // Dados agregados
  const totalTenants = analytics?.kpis.totalTenants || 0;
  const activeTenants = analytics?.kpis.activeTenants || 0;
  const totalRevenue = analytics?.kpis.mrr || 0;
  const totalCattle = analytics?.kpis.totalCattle || 0;

  const pctChange = (prev: number, current: number) => {
    if (!Number.isFinite(prev) || prev === 0) return null;
    return ((current - prev) / prev) * 100;
  };

  const lastTwo = <T,>(arr: T[] | undefined) => {
    if (!arr || arr.length < 2) return null;
    return { prev: arr[arr.length - 2], current: arr[arr.length - 1] };
  };

  const tenantsSeriesLastTwo = lastTwo(analytics?.clientGrowth.activeTenants);
  const tenantGrowthPct = tenantsSeriesLastTwo
    ? pctChange(Number(tenantsSeriesLastTwo.prev), Number(tenantsSeriesLastTwo.current))
    : null;

  const mrrSeriesLastTwo = lastTwo(analytics?.revenue.mrr);
  const mrrGrowthPct = mrrSeriesLastTwo
    ? pctChange(Number(mrrSeriesLastTwo.prev), Number(mrrSeriesLastTwo.current))
    : null;

  const categories = analytics?.categories ?? [];

  // Gráfico de crescimento de clientes
  const clientGrowthOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#10b981', '#f59e0b'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    xaxis: {
      categories,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} clientes`,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
    },
  };

  const clientGrowthSeries = [
    {
      name: 'Clientes Ativos',
      data: analytics?.clientGrowth.activeTenants ?? [],
    },
    {
      name: 'Novos Cadastros',
      data: analytics?.clientGrowth.newSignups ?? [],
    },
  ];

  // Gráfico de receita
  const revenueOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#10b981'],
    plotOptions: {
      bar: {
        borderRadius: 8,
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `R$ ${val.toFixed(0)}`,
      offsetY: -20,
      style: {
        fontSize: '10px',
        colors: ['#304758'],
      },
    },
    xaxis: {
      categories,
    },
    yaxis: {
      title: { text: 'Receita (R$)' },
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

  const revenueSeries = [
    {
      name: 'MRR',
      data: analytics?.revenue.mrr ?? [],
    },
  ];

  // Gráfico de distribuição por plano
  const planDistributionOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
    labels: analytics?.planDistribution.labels ?? ['porteira', 'piquete', 'retiro', 'estancia', 'barao'],
    legend: {
      position: 'bottom',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total de Clientes',
              formatter: () => totalTenants.toString(),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} clientes`,
      },
    },
  };

  const planDistributionSeries = analytics?.planDistribution.series ?? [];

  // Gráfico de rebanho total
  const cattleOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#10b981'],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 5 },
    xaxis: {
      categories,
    },
    yaxis: {
      title: { text: 'Cabeças de Gado' },
      labels: {
        formatter: (val: number) => val.toLocaleString('pt-BR'),
      },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val.toLocaleString('pt-BR')} cabeças`,
      },
    },
  };

  const cattleSeries = [
    {
      name: 'Total de Cabeças',
      data: analytics?.cattle.total ?? [],
    },
  ];

  // Gráfico de taxa de conversão
  const conversionOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      height: 300,
      stacked: true,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#10b981', '#f59e0b', '#ef4444'],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 5,
      },
    },
    xaxis: {
      categories,
    },
    legend: {
      position: 'top',
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} cadastros`,
      },
    },
  };

  const conversionSeries = [
    {
      name: 'Aprovados',
      data: analytics?.conversion.approved ?? [],
    },
    {
      name: 'Pendentes',
      data: analytics?.conversion.pending ?? [],
    },
    {
      name: 'Rejeitados',
      data: analytics?.conversion.rejected ?? [],
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Análises e Indicadores</h1>
          <p className="text-gray-600">Acompanhe métricas e crescimento da plataforma</p>
        </div>

        <Select
          value={period}
          onValueChange={(value: '7d' | '30d' | '90d' | '1y') => setPeriod(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total de Clientes</CardTitle>
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalTenants}</div>
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {tenantGrowthPct === null ? '—' : `${tenantGrowthPct >= 0 ? '+' : ''}${tenantGrowthPct.toFixed(1)}% vs mês anterior`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Clientes Ativos</CardTitle>
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{activeTenants}</div>
              <p className="text-sm text-gray-500 mt-1">
                {((activeTenants / totalTenants) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">MRR</CardTitle>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {mrrGrowthPct === null ? '—' : `${mrrGrowthPct >= 0 ? '+' : ''}${mrrGrowthPct.toFixed(1)}% vs mês anterior`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total de Gado</CardTitle>
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {totalCattle.toLocaleString('pt-BR')}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                cabeças gerenciadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Clientes</CardTitle>
              <CardDescription>Evolução mensal de cadastros e clientes ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <ReactApexChart
                options={clientGrowthOptions}
                series={clientGrowthSeries}
                type="area"
                height={350}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receita Recorrente (MRR)</CardTitle>
              <CardDescription>Monthly Recurring Revenue ao longo do ano</CardDescription>
            </CardHeader>
            <CardContent>
              <ReactApexChart
                options={revenueOptions}
                series={revenueSeries}
                type="bar"
                height={350}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Plano</CardTitle>
              <CardDescription>Porcentagem de clientes em cada plano</CardDescription>
            </CardHeader>
            <CardContent>
              <ReactApexChart
                options={planDistributionOptions}
                series={planDistributionSeries}
                type="donut"
                height={350}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total de Rebanho Gerenciado</CardTitle>
              <CardDescription>Crescimento do número de cabeças na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <ReactApexChart
                options={cattleOptions}
                series={cattleSeries}
                type="line"
                height={350}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conversão de Cadastros</CardTitle>
            <CardDescription>Status das solicitações de cadastro por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={conversionOptions}
              series={conversionSeries}
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>
    </div>
  );
}
