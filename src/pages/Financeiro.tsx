import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import ReactApexChart from 'react-apexcharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';
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

  // Dados mockados de financeiro
  const financialData = {
    totalRevenue: 285000,
    totalExpenses: 142000,
    netProfit: 143000,
    profitMargin: 50.18,
    monthlyGrowth: 12.5,
  };

  // Gráfico de Receitas vs Despesas (últimos 6 meses)
  const revenueExpenseOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#16a34a', '#dc2626'],
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

  const revenueExpenseSeries = [
    {
      name: 'Receitas',
      data: [38000, 42000, 45000, 48000, 52000, 60000]
    },
    {
      name: 'Despesas',
      data: [22000, 24000, 23000, 25000, 26000, 22000]
    }
  ];

  // Gráfico de Lucro Líquido
  const netProfitOptions: ApexOptions = {
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
      formatter: (val) => `R$ ${(Number(val) / 1000).toFixed(0)}k`,
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
        formatter: (val) => `R$ ${(val / 1000).toFixed(0)}k`
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

  const netProfitSeries = [{
    name: 'Lucro Líquido',
    data: [16000, 18000, 22000, 23000, 26000, 38000]
  }];

  // Gráfico de Distribuição de Despesas
  const expensesDistributionOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
    labels: ['Ração', 'Medicamentos', 'Mão de Obra', 'Infraestrutura', 'Outros'],
    legend: {
      position: 'bottom',
      labels: { colors: '#475569' }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '14px', color: '#475569' },
            value: { 
              show: true, 
              fontSize: '24px', 
              fontWeight: 700, 
              color: '#0f172a',
              formatter: (val) => `R$ ${Number(val).toLocaleString('pt-BR')}`
            },
            total: {
              show: true,
              label: 'Total Despesas',
              fontSize: '14px',
              color: '#64748b',
              formatter: () => 'R$ 142k'
            }
          }
        }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `R$ ${val.toLocaleString('pt-BR')}`
      }
    }
  };

  const expensesDistributionSeries = [56000, 28000, 32000, 18000, 8000];

  // Gráfico de Receita por Categoria
  const revenueCategoryOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#16a34a', '#3b82f6', '#f59e0b'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: '70%',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `R$ ${(Number(val) / 1000).toFixed(0)}k`,
      style: {
        fontSize: '11px',
        colors: ['#fff']
      }
    },
    xaxis: {
      categories: ['Venda de Gado', 'Leite', 'Outros'],
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
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

  const revenueCategorySeries = [{
    name: 'Receita',
    data: [180000, 85000, 20000]
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm font-medium text-muted-foreground">Despesas Totais</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  R$ {(financialData.totalExpenses / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-error" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <TrendingDown className="w-4 h-4 text-success" />
              <span className="text-success font-medium">-5.2%</span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                <p className="text-3xl font-bold text-success mt-1">
                  R$ {(financialData.netProfit / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success font-medium">+18.3%</span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margem de Lucro</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {financialData.profitMargin.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-chart-3" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <span className="text-muted-foreground">Meta: 45%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas vs Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Receitas vs Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={revenueExpenseOptions}
              series={revenueExpenseSeries}
              type="area"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Evolução do Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={netProfitOptions}
              series={netProfitSeries}
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Distribuição de Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Distribuição de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={expensesDistributionOptions}
              series={expensesDistributionSeries}
              type="donut"
              height={350}
            />
          </CardContent>
        </Card>

        {/* Receita por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Receita por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={revenueCategoryOptions}
              series={revenueCategorySeries}
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return isMobile ? content : <AppLayout>{content}</AppLayout>;
}
