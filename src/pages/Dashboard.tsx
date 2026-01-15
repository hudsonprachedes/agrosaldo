import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { apiClient } from '@/lib/api-client';
import { MovementDTO } from '@/types';
import ReactApexChart from 'react-apexcharts';
import {
  Beef,
  Baby,
  Skull,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApexOptions } from 'apexcharts';

export default function Dashboard() {
  const { selectedProperty } = useAuth();
  const isMobile = useIsMobile();
  const [movements, setMovements] = useState<MovementDTO[]>([]);
  const [livestockTotal, setLivestockTotal] = useState(0);

  if (!selectedProperty) return null;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [movementData, livestockData] = await Promise.all([
          apiClient.get<MovementDTO[]>('/lancamentos'),
          apiClient.get<Array<{ headcount: number }>>('/rebanho'),
        ]);
        setMovements(movementData);
        setLivestockTotal(livestockData.reduce((sum, item) => sum + item.headcount, 0));
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      }
    };

    void loadDashboard();
  }, [selectedProperty.id]);

  const { monthlyBirths, monthlyDeaths, overallCompliance } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const births = movements.filter(m => {
      const date = new Date(m.date);
      return m.type === 'birth' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    const deaths = movements.filter(m => {
      const date = new Date(m.date);
      return m.type === 'death' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    return {
      monthlyBirths: births.reduce((sum, m) => sum + m.quantity, 0),
      monthlyDeaths: deaths.reduce((sum, m) => sum + m.quantity, 0),
      overallCompliance: 100,
    };
  }, [movements]);

  // Gráfico de Evolução do Rebanho (últimos 6 meses)
  const evolutionChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#16a34a', '#dc2626'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
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

  const evolutionChartSeries = [
    {
      name: 'Total',
      data: [2140, 2198, 2245, 2301, 2350, livestockTotal]
    },
  ];

  // Gráfico de Nascimentos vs Mortes
  const birthDeathChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#16a34a', '#dc2626'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 0 },
    xaxis: {
      categories: ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'],
      labels: {
        style: { colors: '#64748b', fontSize: '12px' }
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
        formatter: (val) => `${val} animais`
      }
    }
  };

  const birthDeathChartSeries = [
    {
      name: 'Nascimentos',
      data: [78, 92, 85, 77, 87, monthlyBirths || 87]
    },
    {
      name: 'Mortes',
      data: [12, 8, 15, 11, 14, monthlyDeaths || 10]
    }
  ];

  // Gráfico de Distribuição por Faixa Etária
  const ageDistributionOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
    labels: ['0 a 4 meses', '5 a 12 meses', '12 a 24 meses', '24 a 36 meses', 'Acima de 36 meses'],
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
          size: '65%',
          labels: {
            show: true,
            name: { show: true, fontSize: '14px', color: '#475569' },
            value: { show: true, fontSize: '24px', fontWeight: 700, color: '#0f172a' },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              color: '#64748b',
              formatter: () => totalCattle.toLocaleString('pt-BR')
            }
          }
        }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} cabeças`
      }
    }
  };

  const ageDistributionSeries = [309, 500, 580, 600, 370];

  // Gráfico de Compliance Sanitária
  const complianceChartOptions: ApexOptions = {
    chart: {
      type: 'radialBar',
      height: 300,
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
    colors: ['#16a34a', '#3b82f6', '#f59e0b', '#ec4899'],
    labels: compliance.map(c => c.category),
    legend: {
      show: true,
      floating: true,
      fontSize: '12px',
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

  const complianceSeries = compliance.map(c => c.percentage);

  const content = (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Visão Geral
          </h1>
          <p className="text-muted-foreground">
            {selectedProperty.name} • {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <Badge 
          variant={overallCompliance >= 95 ? 'default' : 'secondary'}
          className="text-sm py-1.5 px-3"
        >
          <Activity className="w-4 h-4 mr-2" />
          Compliance: {overallCompliance}%
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Cattle */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Cabeças</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {totalCattle.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Beef className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success font-medium">+2.4%</span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Births */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nascimentos (mês)</p>
                <p className="text-3xl font-bold text-success mt-1">
                  +{monthlyBirths || 87}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Baby className="w-6 h-6 text-success" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success font-medium">+12%</span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Deaths */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mortes (mês)</p>
                <p className="text-3xl font-bold text-death mt-1">
                  -{monthlyDeaths || 10}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-death/10 flex items-center justify-center">
                <Skull className="w-6 h-6 text-death" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <TrendingDown className="w-4 h-4 text-success" />
              <span className="text-success font-medium">-15%</span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução do Rebanho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Evolução do Rebanho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={evolutionChartOptions}
              series={evolutionChartSeries}
              type="area"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Nascimentos vs Mortes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Nascimentos vs Mortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={birthDeathChartOptions}
              series={birthDeathChartSeries}
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Distribuição por Faixa Etária */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beef className="w-5 h-5 text-primary" />
              Distribuição por Faixa Etária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={ageDistributionOptions}
              series={ageDistributionSeries}
              type="donut"
              height={350}
            />
          </CardContent>
        </Card>

        {/* Compliance Sanitária */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Compliance Sanitária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={complianceChartOptions}
              series={complianceSeries}
              type="radialBar"
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return content;
}
