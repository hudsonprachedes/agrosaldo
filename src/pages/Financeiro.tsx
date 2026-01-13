import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import ReactApexChart from 'react-apexcharts';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Beef,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApexOptions } from 'apexcharts';

export default function Financeiro() {
  const { selectedProperty } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');

  if (!selectedProperty) {
    navigate('/login');
    return null;
  }

  // Dados mockados de financeiro - apenas receitas de venda de gado
  const financialData = {
    totalRevenue: 285000,
    monthlyGrowth: 12.5,
    cattleSold: 87,
    averagePrice: 3275,
  };

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
      categories: ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'],
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
      data: [38000, 42000, 45000, 48000, 52000, 60000]
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
      categories: ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'],
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
    data: [12, 15, 14, 16, 18, 22]
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
    data: [3100, 3150, 3200, 3180, 3250, 3275]
  }];

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  R$ {(financialData.totalRevenue / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-success" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success font-medium">+{financialData.monthlyGrowth}%</span>
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
                  {financialData.cattleSold}
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
                  R$ {(financialData.averagePrice / 1000).toFixed(1)}k
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
      </div>
    </div>
  );

  return content;
}
