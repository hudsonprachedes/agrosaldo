import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import ReactApexChart from 'react-apexcharts';
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

export default function Analytics() {
  const { selectedProperty } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('year');

  if (!selectedProperty) {
    navigate('/login');
    return null;
  }

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
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      labels: {
        style: { colors: '#64748b', fontSize: '11px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' }
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
        formatter: (val) => `${val}%`
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
      data: [85, 87, 88, 90, 89, 91, 92, 90, 91, 93, 92, 94]
    },
    {
      name: 'Taxa de Sobrevivência',
      data: [96, 97, 96, 97, 98, 97, 98, 97, 98, 99, 98, 99]
    },
    {
      name: 'Taxa de Ganho de Peso',
      data: [82, 84, 85, 86, 87, 88, 87, 89, 88, 90, 89, 91]
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
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      labels: {
        style: { colors: '#64748b', fontSize: '11px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' }
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
        formatter: (val) => `${val} cabeças`
      }
    }
  };

  const yearComparisonSeries = [
    {
      name: '2025',
      data: [85, 92, 98, 105, 112, 118, 125, 132, 138, 145, 152, 160]
    },
    {
      name: '2026',
      data: [90, 98, 105, 110, 120, 128, 135, 142, 150, 158, 165, 175]
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

  const healthRadialSeries = [95, 88, 92, 85, 90];

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
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      labels: {
        style: { colors: '#64748b', fontSize: '11px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
        formatter: (val) => `${val.toFixed(1)}%`
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val.toFixed(2)}%`
      }
    }
  };

  const mortalityRateSeries = [{
    name: 'Taxa de Mortalidade',
    data: [2.5, 2.3, 1.8, 1.5, 1.2, 1.0, 0.9, 1.1, 1.3, 1.0, 0.8, 0.7]
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
      formatter: (val) => `R$ ${(Number(val) / 1000).toFixed(1)}k`,
      style: {
        fontSize: '11px',
        colors: ['#fff']
      }
    },
    xaxis: {
      categories: ['0-4m', '5-12m', '13-24m', '25-36m', '36m+'],
      labels: {
        style: { colors: '#64748b', fontSize: '11px' },
        formatter: (val) => `R$ ${(Number(val) / 1000).toFixed(0)}k`
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' }
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
    }
  };

  const avgPriceSeries = [{
    name: 'Preço Médio',
    data: [800, 1500, 2800, 3500, 4200]
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
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
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
        formatter: (val) => `${val} nascimentos`
      }
    }
  };

  const birthHeatmapSeries = [
    {
      name: '2024',
      data: [45, 52, 48, 55, 60, 58, 62, 65, 63, 68, 70, 72]
    },
    {
      name: '2025',
      data: [50, 58, 54, 60, 65, 63, 68, 72, 70, 75, 78, 82]
    },
    {
      name: '2026',
      data: [55, 62, 59, 65, 70, 68, 73, 78, 75, 80, 85, 90]
    }
  ];

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
            <div className="text-3xl font-bold text-blue-600">94%</div>
            <p className="text-sm text-blue-700 mt-1">Taxa de Natalidade</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">99%</div>
            <p className="text-sm text-green-700 mt-1">Taxa de Sobrevivência</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">+12%</div>
            <p className="text-sm text-amber-700 mt-1">Crescimento do Rebanho</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">R$ 3,2k</div>
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
