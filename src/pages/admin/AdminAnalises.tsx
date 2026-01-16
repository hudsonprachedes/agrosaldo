import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactApexChart from 'react-apexcharts';
import { TrendingUp, Users, DollarSign, Activity, Calendar } from 'lucide-react';
import { adminService } from '@/services/api.service';
import { toast } from 'sonner';

export default function AdminAnalises() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar análises:', error);
        toast.error('Erro ao carregar dados de análise');
      } finally {
        setIsLoading(false);
      }
    };

    void loadStats();
  }, []);

  // Dados agregados
  const totalTenants = stats?.totalTenants || 0;
  const activeTenants = stats?.activeTenants || 0;
  const totalRevenue = stats?.mrr || 0;
  const totalCattle = stats?.totalCattle || 0;

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
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
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
      data: [8, 12, 18, 25, 32, 41, 48, 52, 58, 65, 72, 80],
    },
    {
      name: 'Novos Cadastros',
      data: [8, 5, 7, 9, 8, 11, 8, 6, 7, 8, 9, 10],
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
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
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
      data: [2850, 3420, 4180, 5230, 6340, 7580, 8640, 9120, 10200, 11450, 12880, 14200],
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
    labels: ['Porteira', 'Piquete', 'Retiro', 'Estância', 'Barão'],
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

  const planDistributionSeries = [15, 28, 22, 18, 12]; // Porteira, Piquete, Retiro, Estância, Barão

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
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
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
      data: [18200, 19800, 21500, 23400, 25800, 28200, 30500, 32800, 35200, 37800, 40500, 43200],
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
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
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
    { name: 'Aprovados', data: [8, 5, 7, 9, 8, 10] },
    { name: 'Pendentes', data: [2, 3, 1, 2, 4, 3] },
    { name: 'Rejeitados', data: [1, 1, 2, 1, 0, 1] },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando análises...</div>;
  }

  return (
    <div className="space-y-6 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Análises e Indicadores</h1>
            <p className="text-gray-600">
              Acompanhe métricas e crescimento da plataforma
            </p>
          </div>

          <Select value={period} onValueChange={(value: '7d' | '30d' | '90d' | '1y') => setPeriod(value)}>
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
                +12.5% vs mês anterior
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
                +8.3% vs mês anterior
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
