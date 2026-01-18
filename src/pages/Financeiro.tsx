import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import ReactApexChart from 'react-apexcharts';
import { apiClient } from '@/lib/api-client';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  Beef,
  PieChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApexOptions } from 'apexcharts';
import PageSkeleton from '@/components/PageSkeleton';

interface FinanceSummaryDTO {
  period: 'month' | 'quarter' | 'year';
  kpis: {
    totalRevenue: number;
    monthlyGrowth: number;
    cattleSold: number;
    averagePrice: number;
    totalPurchases: number;
    cattleBought: number;
    averagePurchasePrice: number;
    netRevenue: number;
  };
  charts: {
    categories: string[];
    revenue: number[];
    cattleSold: number[];
    avgPrice: number[];
    purchases: number[];
    cattleBought: number[];
    avgPurchasePrice: number[];
  };
  generatedAt: string;
}

export default function Financeiro() {
  const { selectedProperty } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');

  const [summary, setSummary] = useState<FinanceSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedProperty) {
      navigate('/login');
    }
  }, [navigate, selectedProperty]);

  useEffect(() => {
    if (!selectedProperty?.id) {
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.get<FinanceSummaryDTO>('/financeiro/resumo', {
          params: { period },
        });
        setSummary(data);
      } catch (error) {
        console.error('Erro ao carregar financeiro:', error);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [period, selectedProperty?.id]);

  const financialData = useMemo(
    () =>
      summary?.kpis ?? {
        totalRevenue: 0,
        monthlyGrowth: 0,
        cattleSold: 0,
        averagePrice: 0,
        totalPurchases: 0,
        cattleBought: 0,
        averagePurchasePrice: 0,
        netRevenue: 0,
      },
    [summary]
  );

  const revenueDistributionSeries = useMemo(() => {
    const total = summary?.kpis.totalRevenue ?? 0;
    if (!total) {
      return [0, 0, 0, 0];
    }

    const base = [0.55, 0.25, 0.12, 0.08];
    return base.map((p) => Math.round(total * p));
  }, [summary?.kpis.totalRevenue]);

  if (isLoading) {
    return <PageSkeleton cards={4} lines={14} />;
  }

  const categories = summary?.charts.categories ?? ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'];

  // Gráfico de Evolução de Receitas (últimos 6 meses)
  const revenueEvolutionOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#16a34a'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
      }
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#64748b', fontSize: '12px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
        formatter: (val) => `R$ ${(val / 1000).toFixed(0)}k`
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      labels: { colors: '#475569' }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `R$ ${val.toLocaleString('pt-BR')}`
      }
    }
  };

  const revenueEvolutionSeries = [
    {
      name: 'Receita de Vendas',
      data: summary?.charts.revenue ?? [0, 0, 0, 0, 0, 0]
    }
  ];

  const purchaseEvolutionSeries = [
    {
      name: 'Compras (Despesa)',
      data: summary?.charts.purchases ?? [0, 0, 0, 0, 0, 0]
    }
  ];

  // Gráfico de Quantidade de Gado Vendido
  const cattleSoldOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#3b82f6'],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '60%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val} cabeças`,
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#475569']
      }
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#64748b', fontSize: '12px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
        formatter: (val) => `${val}`
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} cabeças`
      }
    }
  };

  const cattleSoldSeries = [{
    name: 'Gado Vendido',
    data: summary?.charts.cattleSold ?? [0, 0, 0, 0, 0, 0]
  }];

  const cattleBoughtSeries = [{
    name: 'Gado Comprado',
    data: summary?.charts.cattleBought ?? [0, 0, 0, 0, 0, 0]
  }];

  // Gráfico de Preço Médio por Cabeça
  const avgPriceOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#8b5cf6'],
    stroke: { curve: 'smooth', width: 3 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'],
      labels: {
        style: { colors: '#64748b', fontSize: '12px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
        formatter: (val) => `R$ ${(val / 1000).toFixed(1)}k`
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `R$ ${val.toLocaleString('pt-BR')}`
      }
    },
    markers: {
      size: 5,
      colors: ['#8b5cf6'],
      strokeColors: '#fff',
      strokeWidth: 2,
    }
  };

  const avgPriceSeries = [{
    name: 'Preço Médio',
    data: summary?.charts.avgPrice ?? [0, 0, 0, 0, 0, 0]
  }];

  const avgPurchasePriceSeries = [{
    name: 'Custo Médio',
    data: summary?.charts.avgPurchasePrice ?? [0, 0, 0, 0, 0, 0]
  }];

  const revenueDistributionLabels = ['Venda (Boi Gordo)', 'Venda (Bezerros)', 'Descarte', 'Outros'];

  const revenueDistributionOptions: ApexOptions = {
    chart: {
      type: 'donut',
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    labels: revenueDistributionLabels,
    colors: ['#16a34a', '#3b82f6', '#f59e0b', '#64748b'],
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Number(val).toFixed(0)}%`,
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
      },
    },
    legend: {
      position: 'bottom',
      labels: { colors: '#475569' },
    },
    stroke: {
      width: 2,
      colors: ['#ffffff'],
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `R$ ${Number(val).toLocaleString('pt-BR')}`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => `R$ ${(summary?.kpis.totalRevenue ?? 0).toLocaleString('pt-BR')}`,
            },
          },
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  };

  const content = (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Financeiro
          </h1>
          <p className="text-muted-foreground">
            Gestão financeira da propriedade
          </p>
        </div>

        <Tabs value={period} onValueChange={setPeriod} className="w-auto">
          <TabsList>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="quarter">Trimestre</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {isLoading ? '—' : `R$ ${(financialData.totalRevenue / 1000).toFixed(0)}k`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-success" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success font-medium">{financialData.monthlyGrowth >= 0 ? '+' : ''}{financialData.monthlyGrowth.toFixed(1)}%</span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gado Vendido</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {isLoading ? '—' : financialData.cattleSold}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Beef className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <span className="text-muted-foreground">cabeças nos últimos 6 meses</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preço Médio</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {isLoading ? '—' : `R$ ${(financialData.averagePrice / 1000).toFixed(1)}k`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <span className="text-muted-foreground">por cabeça vendida</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compras (período)</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {isLoading ? '—' : `R$ ${(financialData.totalPurchases / 1000).toFixed(0)}k`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <span className="text-muted-foreground">{financialData.cattleBought} cabeças compradas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução de Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Evolução de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={revenueEvolutionOptions}
              series={revenueEvolutionSeries}
              type="area"
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Evolução de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={revenueEvolutionOptions}
              series={purchaseEvolutionSeries}
              type="area"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Gado Vendido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beef className="w-5 h-5 text-primary" />
              Quantidade de Gado Vendido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={cattleSoldOptions}
              series={cattleSoldSeries}
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beef className="w-5 h-5 text-primary" />
              Quantidade de Gado Comprado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={cattleSoldOptions}
              series={cattleBoughtSeries}
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Preço Médio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Preço Médio por Cabeça
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={avgPriceOptions}
              series={avgPriceSeries}
              type="line"
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Custo Médio de Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={avgPriceOptions}
              series={avgPurchasePriceSeries}
              type="line"
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Distribuição de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={revenueDistributionOptions}
              series={revenueDistributionSeries}
              type="donut"
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return content;
}
