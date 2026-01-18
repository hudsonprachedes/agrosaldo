import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { apiClient } from '@/lib/api-client';
import { EpidemiologySurveyDTO, LivestockMirrorDTO, OtherSpeciesMirrorDTO } from '@/types';
import ReactApexChart from 'react-apexcharts';
import {
  Beef,
  TrendingUp,
  TrendingDown,
  FileText,
  Share2,
  Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApexOptions } from 'apexcharts';
import { generatePDF, printReport, ReportData } from '@/lib/pdf-report-final';
import { formatReportForWhatsApp, shareViaWhatsApp } from '@/lib/whatsapp-share';
import { useToast } from '@/hooks/use-toast';
import { AGE_GROUP_BRACKETS, compareAgeGroupIds } from '@/lib/age-groups';

export default function Rebanho() {
  const { selectedProperty, user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [mirror, setMirror] = useState<LivestockMirrorDTO | null>(null);
  const [otherMirror, setOtherMirror] = useState<OtherSpeciesMirrorDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedProperty?.id) {
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        const [bovinos, outras] = await Promise.all([
          apiClient.get<LivestockMirrorDTO>(`/rebanho/${selectedProperty.id}/espelho?months=1`),
          apiClient.get<OtherSpeciesMirrorDTO>(`/rebanho/${selectedProperty.id}/outras-especies?months=1`),
        ]);
        setMirror(bovinos);
        setOtherMirror(outras);
      } catch (error) {
        console.error('Erro ao carregar rebanho:', error);
        setMirror(null);
        setOtherMirror(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [selectedProperty?.id]);

  const ageGroups = useMemo(
    () =>
      AGE_GROUP_BRACKETS.map((g) => ({
        id: g.id,
        label: g.label,
      })),
    [],
  );

  const balances = useMemo(() => mirror?.balances ?? [], [mirror?.balances]);
  const sortedBalances = useMemo(
    () => balances.slice().sort((a, b) => compareAgeGroupIds(a.ageGroupId, b.ageGroupId)),
    [balances],
  );
  const totalCattle = mirror?.totals.total ?? 0;

  const otherSpeciesBalances = otherMirror?.balances ?? [];
  const totalOtherSpecies = otherMirror?.total ?? 0;
  const otherSpecies = useMemo(
    () => [
      { id: 'suinos', name: 'Suínos', unit: 'cabeças' as const, icon: '🐷' },
      { id: 'aves', name: 'Aves (Frangos/Galinhas)', unit: 'unidades' as const, icon: '🐔' },
      { id: 'equinos', name: 'Equinos (Cavalos)', unit: 'cabeças' as const, icon: '🐴' },
      { id: 'caprinos', name: 'Caprinos (Cabras)', unit: 'cabeças' as const, icon: '🐐' },
      { id: 'ovinos', name: 'Ovinos (Ovelhas)', unit: 'cabeças' as const, icon: '🐑' },
    ],
    [],
  );

  const activeOtherSpeciesBalances = useMemo(
    () =>
      otherSpeciesBalances.filter((b) => {
        const previous = (b.currentBalance ?? 0) - (b.entries ?? 0) + (b.exits ?? 0);
        return (
          (b.currentBalance ?? 0) > 0 ||
          (b.entries ?? 0) > 0 ||
          (b.exits ?? 0) > 0 ||
          previous > 0
        );
      }),
    [otherSpeciesBalances],
  );

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

  // Handlers para PDF e WhatsApp
  const getReportData = (): ReportData => ({
    propertyName: selectedProperty.name,
    ownerName: user?.name || 'Proprietário',
    ownerDocument: user?.cpfCnpj,
    ownerEmail: user?.email,
    ownerPhone: user?.phone,
    stateRegistration: selectedProperty.stateRegistration,
    propertyCode: selectedProperty.propertyCode || selectedProperty.id,
    propertyAddress: [
      selectedProperty.street,
      selectedProperty.number,
      selectedProperty.complement,
      selectedProperty.district,
    ].filter(Boolean).join(', '),
    propertyCep: selectedProperty.cep,
    city: selectedProperty.city || 'N/A',
    state: selectedProperty.state || 'N/A',
    generatedAt: new Date().toLocaleString('pt-BR'),
    totalCattle: totalCattle,
    balances: sortedBalances.map(b => ({
      ageGroup: getAgeGroupLabel(b.ageGroupId),
      male: b.male.currentBalance,
      female: b.female.currentBalance,
      total: b.male.currentBalance + b.female.currentBalance,
      ageGroupId: b.ageGroupId, // Mantendo caso necessário para keys
    })),
    otherSpecies: activeOtherSpeciesBalances
      .map(b => ({
        name: b.speciesName,
        balance: b.currentBalance,
        entries: b.entries,
        exits: b.exits,
        unit: b.unit,
      })),
  });

  const handlePrintReport = (includeSurvey: boolean) => {
    void (async () => {
      try {
        const reportData = getReportData();

        let latestSurvey: EpidemiologySurveyDTO | null = null;
        try {
          const surveys = await apiClient.get<EpidemiologySurveyDTO[]>('/questionario-epidemiologico');
          latestSurvey = surveys
            .slice()
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0] ?? null;
        } catch (error) {
          latestSurvey = null;
        }

        printReport({
          ...reportData,
          includeSurvey,
          latestSurvey: latestSurvey
            ? {
                submittedAt: latestSurvey.submittedAt,
                nextDueAt: latestSurvey.nextDueAt,
                answers: latestSurvey.answers,
              }
            : undefined,
        });
      } catch (error) {
        console.error('Erro ao imprimir:', error);
        toast({
          title: '❌ Erro ao Imprimir',
          description: 'Tente novamente',
          variant: 'destructive',
        });
      }
    })();
  };

  const handleShareWhatsApp = () => {
    try {
      const ageDistribution = sortedBalances.map(b => ({
        label: getAgeGroupLabel(b.ageGroupId),
        total: b.male.currentBalance + b.female.currentBalance,
      }));

      const message = formatReportForWhatsApp({
        propertyName: selectedProperty.name,
        ownerName: user?.name || 'Proprietário',
        state: selectedProperty.state || 'N/A',
        totalCattle: totalCattle,
        ageDistribution,
        otherSpecies: activeOtherSpeciesBalances
          .map(b => ({
            name: b.speciesName,
            balance: b.currentBalance,
            unit: b.unit,
          })),
      });

      shareViaWhatsApp(message);
      
      toast({ title: '✅ WhatsApp Aberto', description: 'Compartilhe o relatório' });
    } catch (error) {
      console.error('Erro ao compartilhar via WhatsApp:', error);
      toast({ 
        title: '❌ Erro ao Compartilhar', 
        description: 'Tente novamente', 
        variant: 'destructive' 
      });
    }
  };

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
      categories: sortedBalances.map(b => getAgeGroupLabel(b.ageGroupId)),
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
      data: sortedBalances.map(b => b.male.currentBalance)
    },
    {
      name: 'Fêmeas',
      data: sortedBalances.map(b => b.female.currentBalance)
    }
  ];

  // Gráfico de Outras Espécies
  const otherSpeciesOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'],
    labels: activeOtherSpeciesBalances
      .map(balance => balance.speciesName),
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
        formatter: (val) => `${val} unidades`
      }
    }
  };

  const otherSpeciesSeries = activeOtherSpeciesBalances
    .map(balance => balance.currentBalance);

  // Gráfico de Movimentação de Outras Espécies
  const otherSpeciesMovementOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    colors: ['#10b981', '#ef4444'],
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
      categories: activeOtherSpeciesBalances
        .map(balance => balance.speciesName),
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
        formatter: (val) => `${val} unidades`
      }
    }
  };

  const otherSpeciesMovementSeries = [
    {
      name: 'Entradas',
      data: activeOtherSpeciesBalances
        .map(balance => balance.entries)
    },
    {
      name: 'Saídas',
      data: activeOtherSpeciesBalances
        .map(balance => balance.exits)
    }
  ];

  if (!selectedProperty) {
    return <Navigate to="/selecionar-propriedade" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!mirror) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Não foi possível carregar o rebanho.
      </div>
    );
  }

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
        
        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={isMobile ? 'default' : 'default'}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Oficial / Salvar PDF
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePrintReport(true)}>
                PDF com Questionário Epidemiológico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrintReport(false)}>
                PDF sem Questionário Epidemiológico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleShareWhatsApp} variant="default" size={isMobile ? 'default' : 'default'}>
            <Share2 className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
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

      {/* Cards de Outras Espécies */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          Outras Espécies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherSpeciesBalances
            .filter(balance => balance.currentBalance > 0)
            .map((balance) => {
              const species = otherSpecies.find(s => s.id === balance.speciesId);
              return (
                <Card key={balance.speciesId} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{species?.icon}</span>
                      <span className="text-sm text-muted-foreground">{balance.speciesName}</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{balance.currentBalance.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">{balance.unit}</p>
                    <div className="mt-2 flex gap-4 text-xs">
                      <span className="text-success">+{balance.entries}</span>
                      <span className="text-error">-{balance.exits}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
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

      {/* Gráficos de Outras Espécies */}
      {otherSpeciesBalances.some(balance => balance.currentBalance > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição das Outras Espécies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🐾</span>
                Distribuição das Outras Espécies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactApexChart
                options={otherSpeciesOptions}
                series={otherSpeciesSeries}
                type="donut"
                height={350}
              />
            </CardContent>
          </Card>

          {/* Movimentação das Outras Espécies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Movimentação das Outras Espécies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactApexChart
                options={otherSpeciesMovementOptions}
                series={otherSpeciesMovementSeries}
                type="bar"
                height={350}
              />
            </CardContent>
          </Card>
        </div>
      )}

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
              {sortedBalances.map((balance) => {
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

      {/* Tabela de Outras Espécies */}
      {activeOtherSpeciesBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              Espelho Oficial do Rebanho (Outras Espécies)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Espécie</TableHead>
                  <TableHead className="text-center">Saldo Anterior</TableHead>
                  <TableHead className="text-center text-success">Entradas</TableHead>
                  <TableHead className="text-center text-error">Saídas</TableHead>
                  <TableHead className="text-center font-bold">Saldo Atual</TableHead>
                  <TableHead className="text-center">Unidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOtherSpeciesBalances.map((balance) => {
                    const species = otherSpecies.find(s => s.id === balance.speciesId);
                    return (
                      <TableRow key={balance.speciesId}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <span className="text-xl">{species?.icon}</span>
                          {balance.speciesName}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {balance.previousBalance}
                        </TableCell>
                        <TableCell className="text-center text-success">
                          +{balance.entries}
                        </TableCell>
                        <TableCell className="text-center text-error">
                          -{balance.exits}
                        </TableCell>
                        <TableCell className="text-center font-bold text-primary">
                          {balance.currentBalance}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {balance.unit}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center">
                    {activeOtherSpeciesBalances
                      .reduce((s, b) => s + b.previousBalance, 0)}
                  </TableCell>
                  <TableCell className="text-center text-success">
                    +{activeOtherSpeciesBalances
                      .reduce((s, b) => s + b.entries, 0)}
                  </TableCell>
                  <TableCell className="text-center text-error">
                    -{activeOtherSpeciesBalances
                      .reduce((s, b) => s + b.exits, 0)}
                  </TableCell>
                  <TableCell className="text-center text-primary text-lg">
                    {activeOtherSpeciesBalances
                      .reduce((s, b) => s + b.currentBalance, 0)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return content;
}
