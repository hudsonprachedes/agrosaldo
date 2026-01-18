import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import ReactApexChart from 'react-apexcharts';
import { apiClient } from '@/lib/api-client';
import {
  BarChart3,
  TrendingUp,
  Activity,
  PieChart,
  Calendar,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApexOptions } from 'apexcharts';
import PageSkeleton from '@/components/PageSkeleton';

interface AnalyticsSummaryDTO {
  propertyId: string;
  period: 'month' | 'quarter' | 'year';
  kpis: {
    birthRate: number;
    survivalRate: number;
    herdGrowthPct: number;
    avgSalePrice: number;
  };
  charts: {
    categories: string[];
    productivity: {
      birthRate: number[];
      survivalRate: number[];
      growthRate: number[];
    };
    yearComparison: {
      current: number[];
      previous: number[];
    };
    health: {
      vaccination: number;
      deworming: number;
      nutrition: number;
      welfare: number;
      reproduction: number;
    };
    mortalityRate: number[];
    avgPriceByAge: {
      categories: string[];
      values: number[];
    };
    birthHeatmap: {
      categories: string[];
      series: Array<{ name: string; data: number[] }>;
    };
  };
  generatedAt: string;
}

export default function Analytics() {
  const { selectedProperty } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('year');

  const formatNumber2 = useMemo(
    () =>
      (value: number) =>
        Number(value).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    []
  );

  const [summary, setSummary] = useState<AnalyticsSummaryDTO | null>(null);
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
        const data = await apiClient.get<AnalyticsSummaryDTO>('/analytics/resumo', {
          params: { period },
        });
        setSummary(data);
      } catch (error) {
        console.error('Erro ao carregar análises:', error);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [period, selectedProperty?.id]);

  const categories = summary?.charts.categories ?? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

  const kpis = useMemo(
    () =>
      summary?.kpis ?? {
        birthRate: 0,
        survivalRate: 0,
        herdGrowthPct: 0,
        avgSalePrice: 0,
      },
    [summary]
  );

  // Gráfico de Produtividade do Rebanho
  const productivityOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#64748b', fontSize: '11px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
        formatter: (val) => `${formatNumber2(Number(val))}%`
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
        formatter: (val) => `${formatNumber2(Number(val))}%`
      }
    },
    markers: {
      size: 4,
      strokeWidth: 0,
      hover: { size: 6 }
    }
  };

  const productivitySeries = [
    {
      name: 'Taxa de Natalidade',
      data: summary?.charts.productivity.birthRate ?? [0, 0, 0, 0, 0, 0]
    },
    {
      name: 'Taxa de Sobrevivência',
      data: summary?.charts.productivity.survivalRate ?? [0, 0, 0, 0, 0, 0]
    },
    {
      name: 'Taxa de Ganho de Peso',
      data: summary?.charts.productivity.growthRate ?? [0, 0, 0, 0, 0, 0]
    }
  ];

  // Gráfico de Comparação de Desempenho Anual
  const yearComparisonOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#3b82f6', '#8b5cf6'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#64748b', fontSize: '11px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
        formatter: (val) => formatNumber2(Number(val))
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
        formatter: (val) => `${formatNumber2(Number(val))} cabeças`
      }
    }
  };

  const yearComparisonSeries = [
    {
      name: 'Anterior',
      data: summary?.charts.yearComparison.previous ?? [0, 0, 0, 0, 0, 0]
    },
    {
      name: 'Atual',
      data: summary?.charts.yearComparison.current ?? [0, 0, 0, 0, 0, 0]
    }
  ];

  // Gráfico de Saúde do Rebanho (Radial)
  const healthRadialOptions: ApexOptions = {
    chart: {
      type: 'radialBar',
      height: 350,
      fontFamily: 'Inter, sans-serif',
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: '30%',
          background: 'transparent',
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: false,
          }
        },
        track: {
          background: '#e2e8f0',
        }
      }
    },
    colors: ['#16a34a', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
    labels: ['Vacinação', 'Vermifugação', 'Nutrição', 'Bem-estar', 'Reprodução'],
    legend: {
      show: true,
      floating: true,
      fontSize: '13px',
      position: 'left',
      offsetX: 0,
      offsetY: 15,
      labels: { colors: '#475569', useSeriesColors: false },
      formatter: function(seriesName, opts) {
        return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + "%"
      },
      itemMargin: { vertical: 3 }
    },
  };

  const healthRadialSeries = useMemo(() => {
    const h = summary?.charts.health;
    if (!h) return [0, 0, 0, 0, 0];
    return [h.vaccination, h.deworming, h.nutrition, h.welfare, h.reproduction];
  }, [summary]);

  // Gráfico de Taxa de Mortalidade
  const mortalityRateOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      sparkline: { enabled: false }
    },
    colors: ['#ef4444'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
      }
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#64748b', fontSize: '11px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
        formatter: (val) => `${formatNumber2(Number(val))}%`
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${formatNumber2(Number(val))}%`
      }
    }
  };

  const mortalityRateSeries = [{
    name: 'Taxa de Mortalidade',
    data: summary?.charts.mortalityRate ?? [0, 0, 0, 0, 0, 0]
  }];

  // Gráfico de Preço Médio de Venda por Categoria
  const avgPriceOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#10b981'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: '70%',
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `R$ ${(Number(val) / 1000).toFixed(2)}k`,
      style: {
        fontSize: '11px',
        colors: ['#fff']
      }
    },
    xaxis: {
      categories: summary?.charts.avgPriceByAge.categories ?? ['0-4m', '5-12m', '13-24m', '25-36m', '36m+'],
      labels: {
        style: { colors: '#64748b', fontSize: '11px' },
        formatter: (val) => `R$ ${(Number(val) / 1000).toFixed(0)}k`
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
        formatter: (val) => `R$ ${formatNumber2(Number(val))}`
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `R$ ${formatNumber2(Number(val))}`
      }
    }
  };

  const avgPriceSeries = [{
    name: 'Preço Médio',
    data: summary?.charts.avgPriceByAge.values ?? [0, 0, 0, 0, 0]
  }];

  // Gráfico de Heatmap de Nascimentos
  const birthHeatmapOptions: ApexOptions = {
    chart: {
      type: 'heatmap',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff']
      }
    },
    colors: ['#16a34a'],
    xaxis: {
      categories: summary?.charts.birthHeatmap.categories ?? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      labels: {
        style: { colors: '#64748b', fontSize: '11px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${formatNumber2(Number(val))} nascimentos`
      }
    }
  };

  const birthHeatmapSeries = summary?.charts.birthHeatmap.series ?? [];

  if (isLoading) {
    return <PageSkeleton cards={4} lines={14} />;
  }

  const content = (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            📊 Análises Avançadas
          </h1>
          <p className="text-muted-foreground">
            Insights e indicadores de desempenho
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

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{isLoading ? '—' : `${kpis.birthRate.toFixed(0)}%`}</div>
            <p className="text-sm text-blue-700 mt-1">Taxa de Natalidade</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{isLoading ? '—' : `${kpis.survivalRate.toFixed(0)}%`}</div>
            <p className="text-sm text-green-700 mt-1">Taxa de Sobrevivência</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{isLoading ? '—' : `${kpis.herdGrowthPct >= 0 ? '+' : ''}${kpis.herdGrowthPct.toFixed(0)}%`}</div>
            <p className="text-sm text-amber-700 mt-1">Crescimento do Rebanho</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{isLoading ? '—' : `R$ ${(kpis.avgSalePrice / 1000).toFixed(1)}k`}</div>
            <p className="text-sm text-purple-700 mt-1">Preço Médio de Venda</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtividade */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Indicadores de Produtividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={productivityOptions}
              series={productivitySeries}
              type="line"
              height={350}
            />
          </CardContent>
        </Card>

        {/* Comparação Anual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Comparação Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={yearComparisonOptions}
              series={yearComparisonSeries}
              type="bar"
              height={350}
            />
          </CardContent>
        </Card>

        {/* Saúde do Rebanho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Saúde do Rebanho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={healthRadialOptions}
              series={healthRadialSeries}
              type="radialBar"
              height={350}
            />
          </CardContent>
        </Card>

        {/* Taxa de Mortalidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Taxa de Mortalidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={mortalityRateOptions}
              series={mortalityRateSeries}
              type="area"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Preço Médio de Venda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Preço Médio por Faixa Etária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={avgPriceOptions}
              series={avgPriceSeries}
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Heatmap de Nascimentos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Sazonalidade de Nascimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={birthHeatmapOptions}
              series={birthHeatmapSeries}
              type="heatmap"
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return content;
}
