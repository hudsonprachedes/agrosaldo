import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { 
  ArrowLeft,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockAnalyticsData, mockComplianceData, getAgeDistribution } from '@/mocks/mock-analytics';
import { getTotalCattle } from '@/mocks/mock-bovinos';
import MobileLayout from '@/components/layout/MobileLayout';
import AppLayout from '@/components/layout/AppLayout';

export default function Analytics() {
  const { selectedProperty } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState<'30' | '180' | '365'>('365');

  if (!selectedProperty) {
    navigate('/login');
    return null;
  }

  const analyticsData = mockAnalyticsData[selectedProperty.id] || [];
  const complianceData = mockComplianceData[selectedProperty.id] || [];
  const ageDistribution = getAgeDistribution(selectedProperty.id);
  const totalCattle = getTotalCattle(selectedProperty.id);

  // Filter data based on period
  const filteredData = period === '30' 
    ? analyticsData.slice(-1) 
    : period === '180' 
    ? analyticsData.slice(-6) 
    : analyticsData;

  // Chart 1: Evolução do Rebanho (Area Chart)
  const evolutionOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    colors: ['hsl(142, 76%, 36%)'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 100]
      }
    },
    stroke: { curve: 'smooth', width: 3 },
    dataLabels: { enabled: false },
    xaxis: { 
      categories: filteredData.map(d => d.month),
      labels: { style: { colors: 'hsl(var(--muted-foreground))' } }
    },
    yaxis: { 
      labels: { 
        style: { colors: 'hsl(var(--muted-foreground))' },
        formatter: (val) => val.toLocaleString('pt-BR')
      }
    },
    grid: { 
      borderColor: 'hsl(var(--border))',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `${val.toLocaleString('pt-BR')} cabeças` }
    }
  };

  const evolutionSeries = [{
    name: 'Total de Cabeças',
    data: filteredData.map(d => d.totalCattle)
  }];

  // Chart 2: Nascimentos x Mortes (Bar Chart)
  const birthDeathOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    colors: ['hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
      }
    },
    dataLabels: { enabled: false },
    xaxis: { 
      categories: filteredData.map(d => d.month),
      labels: { style: { colors: 'hsl(var(--muted-foreground))' } }
    },
    yaxis: { 
      labels: { 
        style: { colors: 'hsl(var(--muted-foreground))' } 
      }
    },
    grid: { 
      borderColor: 'hsl(var(--border))',
      strokeDashArray: 4,
    },
    legend: {
      position: 'top',
      labels: { colors: 'hsl(var(--foreground))' }
    },
    tooltip: { theme: 'dark' }
  };

  const birthDeathSeries = [
    { name: 'Nascimentos', data: filteredData.map(d => d.births) },
    { name: 'Mortes', data: filteredData.map(d => d.deaths) }
  ];

  // Chart 3: Estratificação por Idade (Donut)
  const ageOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    colors: [
      'hsl(142, 76%, 36%)',
      'hsl(200, 80%, 50%)',
      'hsl(43, 96%, 56%)',
      'hsl(280, 60%, 50%)',
      'hsl(0, 84%, 60%)',
    ],
    labels: ageDistribution.map(d => d.label),
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`
    },
    legend: {
      position: 'bottom',
      labels: { colors: 'hsl(var(--foreground))' }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: { show: true },
            value: { 
              show: true,
              formatter: (val) => `${parseInt(String(val)).toLocaleString('pt-BR')}`
            },
            total: {
              show: true,
              label: 'Total',
              formatter: () => totalCattle.toLocaleString('pt-BR')
            }
          }
        }
      }
    },
    tooltip: { theme: 'dark' }
  };

  const ageSeries = ageDistribution.map(d => d.male + d.female);

  // Chart 4: Compliance (Radial Gauge)
  const overallCompliance = complianceData.length > 0
    ? Math.round(complianceData.reduce((sum, c) => sum + c.percentage, 0) / complianceData.length)
    : 100;

  const complianceOptions: ApexOptions = {
    chart: {
      type: 'radialBar',
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    colors: [
      overallCompliance >= 95 ? 'hsl(142, 76%, 36%)' : 
      overallCompliance >= 80 ? 'hsl(43, 96%, 56%)' : 
      'hsl(0, 84%, 60%)'
    ],
    plotOptions: {
      radialBar: {
        hollow: { size: '70%' },
        track: { background: 'hsl(var(--muted))' },
        dataLabels: {
          name: {
            show: true,
            fontSize: '14px',
            color: 'hsl(var(--muted-foreground))'
          },
          value: {
            show: true,
            fontSize: '32px',
            fontWeight: 700,
            color: 'hsl(var(--foreground))',
            formatter: (val) => `${val}%`
          }
        }
      }
    },
    labels: ['Compliance'],
  };

  const complianceSeries = [overallCompliance];

  const content = (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 ${isMobile ? 'pb-24' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            Análises
          </h1>
          <p className="text-muted-foreground">
            Visualize a evolução do seu rebanho
          </p>
        </div>
        
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="30">30 dias</TabsTrigger>
            <TabsTrigger value="180">6 meses</TabsTrigger>
            <TabsTrigger value="365">1 ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-success" />
              Evolução do Rebanho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApexChart
              options={evolutionOptions}
              series={evolutionSeries}
              type="area"
              height={isMobile ? 250 : 300}
            />
          </CardContent>
        </Card>

        {/* Birth vs Death Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-chart-3" />
              Nascimentos x Mortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApexChart
              options={birthDeathOptions}
              series={birthDeathSeries}
              type="bar"
              height={isMobile ? 250 : 300}
            />
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="w-5 h-5 text-chart-5" />
              Estratificação por Idade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApexChart
              options={ageOptions}
              series={ageSeries}
              type="donut"
              height={isMobile ? 280 : 320}
            />
          </CardContent>
        </Card>

        {/* Compliance Gauge */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Compliance Sanitária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6 items-center`}>
              <div className="flex justify-center">
                <ApexChart
                  options={complianceOptions}
                  series={complianceSeries}
                  type="radialBar"
                  height={250}
                  width={250}
                />
              </div>
              <div className="space-y-3">
                {complianceData.map((item) => (
                  <div 
                    key={item.category}
                    className={`p-4 rounded-xl ${
                      item.status === 'ok' ? 'bg-success/10' : 
                      item.status === 'warning' ? 'bg-warning/10' : 
                      'bg-error/10'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.category}</span>
                      <span className={`text-xl font-bold ${
                        item.status === 'ok' ? 'text-success' : 
                        item.status === 'warning' ? 'text-warning' : 
                        'text-error'
                      }`}>
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileLayout>
        <div className="p-4 space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-bold text-lg">Análises</h1>
          </div>
          {content}
        </div>
      </MobileLayout>
    );
  }

  return <AppLayout>{content}</AppLayout>;
}
