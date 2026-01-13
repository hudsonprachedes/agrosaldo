import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { 
  mockCattleBalance,
  ageGroups,
  getTotalCattle,
} from '@/mocks/mock-bovinos';
import ReactApexChart from 'react-apexcharts';
import {
  Beef,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AppLayout from '@/components/layout/AppLayout';
import { ApexOptions } from 'apexcharts';

export default function Rebanho() {
  const { selectedProperty } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!selectedProperty) {
    navigate('/login');
    return null;
  }

  const balances = mockCattleBalance[selectedProperty.id] || [];
  const totalCattle = getTotalCattle(selectedProperty.id);

  const getAgeGroupLabel = (ageGroupId: string) => {
    const group = ageGroups.find(g => g.id === ageGroupId);
    return group?.label || ageGroupId;
  };

  const totals = balances.reduce(
    (acc, balance) => ({
      maleBalance: acc.maleBalance + balance.male.currentBalance,
      femaleBalance: acc.femaleBalance + balance.female.currentBalance,
      maleEntries: acc.maleEntries + balance.male.entries,
      femaleEntries: acc.femaleEntries + balance.female.entries,
      maleExits: acc.maleExits + balance.male.exits,
      femaleExits: acc.femaleExits + balance.female.exits,
    }),
    { maleBalance: 0, femaleBalance: 0, maleEntries: 0, femaleEntries: 0, maleExits: 0, femaleExits: 0 }
  );

  // Gráfico de Distribuição por Sexo
  const sexDistributionOptions: ApexOptions = {
    chart: {
      type: 'pie',
      height: 300,
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#3b82f6', '#ec4899'],
    labels: ['Machos', 'Fêmeas'],
    legend: {
      position: 'bottom',
      labels: { colors: '#475569' }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} cabeças`
      }
    }
  };

  const sexDistributionSeries = [totals.maleBalance, totals.femaleBalance];

  // Gráfico de Distribuição por Faixa Etária
  const ageDistributionOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#3b82f6', '#ec4899'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 0 },
    xaxis: {
      categories: balances.map(b => getAgeGroupLabel(b.ageGroupId)),
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

  const ageDistributionSeries = [
    {
      name: 'Machos',
      data: balances.map(b => b.male.currentBalance)
    },
    {
      name: 'Fêmeas',
      data: balances.map(b => b.female.currentBalance)
    }
  ];

  const content = (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Meu Rebanho
          </h1>
          <p className="text-muted-foreground">
            Controle de estoque por faixa etária
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Beef className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalCattle.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">cabeças</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">♂️</span>
              <span className="text-sm text-muted-foreground">Machos</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totals.maleBalance.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">cabeças</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">♀️</span>
              <span className="text-sm text-muted-foreground">Fêmeas</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totals.femaleBalance.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">cabeças</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-sm text-muted-foreground">Entradas</span>
            </div>
            <p className="text-3xl font-bold text-success">+{(totals.maleEntries + totals.femaleEntries).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Sexo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beef className="w-5 h-5 text-primary" />
              Distribuição por Sexo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactApexChart
              options={sexDistributionOptions}
              series={sexDistributionSeries}
              type="pie"
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
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Espelho Oficial do Rebanho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beef className="w-5 h-5 text-primary" />
            Espelho Oficial do Rebanho
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Faixa Etária</TableHead>
                <TableHead className="text-center" colSpan={4}>Machos</TableHead>
                <TableHead className="text-center" colSpan={4}>Fêmeas</TableHead>
                <TableHead className="text-center">Total</TableHead>
              </TableRow>
              <TableRow>
                <TableHead></TableHead>
                <TableHead className="text-center text-xs">Anterior</TableHead>
                <TableHead className="text-center text-xs text-success">Entradas</TableHead>
                <TableHead className="text-center text-xs text-error">Saídas</TableHead>
                <TableHead className="text-center text-xs font-bold">Atual</TableHead>
                <TableHead className="text-center text-xs">Anterior</TableHead>
                <TableHead className="text-center text-xs text-success">Entradas</TableHead>
                <TableHead className="text-center text-xs text-error">Saídas</TableHead>
                <TableHead className="text-center text-xs font-bold">Atual</TableHead>
                <TableHead className="text-center text-xs font-bold">Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((balance) => {
                const ageGroup = ageGroups.find(g => g.id === balance.ageGroupId);
                const totalCurrent = balance.male.currentBalance + balance.female.currentBalance;
                
                return (
                  <TableRow key={balance.ageGroupId}>
                    <TableCell className="font-medium">{ageGroup?.label}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {balance.male.previousBalance}
                    </TableCell>
                    <TableCell className="text-center text-success">
                      +{balance.male.entries}
                    </TableCell>
                    <TableCell className="text-center text-error">
                      -{balance.male.exits}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {balance.male.currentBalance}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {balance.female.previousBalance}
                    </TableCell>
                    <TableCell className="text-center text-success">
                      +{balance.female.entries}
                    </TableCell>
                    <TableCell className="text-center text-error">
                      -{balance.female.exits}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {balance.female.currentBalance}
                    </TableCell>
                    <TableCell className="text-center font-bold text-primary">
                      {totalCurrent}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Totals Row */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-center">
                  {balances.reduce((s, b) => s + b.male.previousBalance, 0)}
                </TableCell>
                <TableCell className="text-center text-success">
                  +{balances.reduce((s, b) => s + b.male.entries, 0)}
                </TableCell>
                <TableCell className="text-center text-error">
                  -{balances.reduce((s, b) => s + b.male.exits, 0)}
                </TableCell>
                <TableCell className="text-center">
                  {balances.reduce((s, b) => s + b.male.currentBalance, 0)}
                </TableCell>
                <TableCell className="text-center">
                  {balances.reduce((s, b) => s + b.female.previousBalance, 0)}
                </TableCell>
                <TableCell className="text-center text-success">
                  +{balances.reduce((s, b) => s + b.female.entries, 0)}
                </TableCell>
                <TableCell className="text-center text-error">
                  -{balances.reduce((s, b) => s + b.female.exits, 0)}
                </TableCell>
                <TableCell className="text-center">
                  {balances.reduce((s, b) => s + b.female.currentBalance, 0)}
                </TableCell>
                <TableCell className="text-center text-primary text-lg">
                  {totalCattle}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-card border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-bold text-lg">Meu Rebanho</h1>
          </div>
        </header>
        {content}
      </div>
    );
  }

  return <AppLayout>{content}</AppLayout>;
}
