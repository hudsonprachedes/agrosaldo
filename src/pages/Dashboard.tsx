import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { 
  mockCattleBalance, 
  ageGroups, 
  getTotalCattle, 
  getMonthlyBirths, 
  getMonthlyDeaths,
  getMovements
} from '@/mocks/mock-bovinos';
import { mockComplianceData } from '@/mocks/mock-analytics';
import { initializeAgeGroupMigration, generateMigrationReport } from '@/lib/age-group-migration';
import { shareViaWhatsApp, formatReportForWhatsApp } from '@/lib/whatsapp-share';
import { generatePDF, ReportData } from '@/lib/pdf-report';
import {
  Beef,
  Baby,
  Skull,
  CheckCircle,
  AlertTriangle,
  FileDown,
  Share2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function Dashboard() {
  const { selectedProperty, user } = useAuth();
  const isMobile = useIsMobile();

  // Executar migração automática de faixas etárias quando o dashboard abre
  useEffect(() => {
    if (selectedProperty?.id) {
      const movements = getMovements(selectedProperty.id);
      initializeAgeGroupMigration(movements, (result) => {
        if (result.migratedCount > 0) {
          console.log(generateMigrationReport(result));
        }
      });
    }
  }, [selectedProperty?.id]);

  if (!selectedProperty) return null;

  const totalCattle = getTotalCattle(selectedProperty.id);
  const monthlyBirths = getMonthlyBirths(selectedProperty.id);
  const monthlyDeaths = getMonthlyDeaths(selectedProperty.id);
  const cattleBalance = mockCattleBalance[selectedProperty.id] || [];
  const compliance = mockComplianceData[selectedProperty.id] || [];

  const overallCompliance = compliance.length > 0
    ? Math.round(compliance.reduce((sum, c) => sum + c.percentage, 0) / compliance.length)
    : 100;

  const handleGeneratePDF = async () => {
    try {
      toast.info('Gerando PDF...', { duration: 1000 });
      
      const reportData: ReportData = {
        propertyName: selectedProperty.name,
        ownerName: user?.name || 'Proprietário',
        city: selectedProperty.city,
        state: selectedProperty.state,
        generatedAt: new Date().toISOString(),
        totalCattle,
        balances: cattleBalance.map(balance => ({
          ageGroup: ageGroups.find(g => g.id === balance.ageGroupId)?.label || 'Desconhecido',
          male: balance.male.currentBalance,
          female: balance.female.currentBalance,
          total: balance.male.currentBalance + balance.female.currentBalance,
        })),
        monthlyBirths,
        monthlyDeaths,
      };

      await generatePDF(reportData, `espelho-rebanho-${selectedProperty.name.toLowerCase().replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('PDF gerado com sucesso!', {
        description: 'O arquivo foi baixado para seu dispositivo',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF', {
        description: 'Tente novamente em alguns instantes',
      });
    }
  };

  const handleShareWhatsApp = () => {
    const message = formatReportForWhatsApp({
      propertyName: selectedProperty.name,
      ownerName: 'Produtor', // Será obtido do contexto de usuário
      state: selectedProperty.state,
      totalCattle,
      monthlyBirths,
      monthlyDeaths,
      ageDistribution: cattleBalance.map(balance => ({
        label: ageGroups.find(g => g.id === balance.ageGroupId)?.label || 'Desconhecido',
        total: balance.male.currentBalance + balance.female.currentBalance,
      })),
    });
    
    try {
      shareViaWhatsApp(message);
      toast.success('WhatsApp aberto com sucesso!');
    } catch (error) {
      toast.error('Erro ao abrir WhatsApp', {
        description: 'Verifique sua conexão e tente novamente',
      });
    }
  };

  return (
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
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
            <Share2 className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className={`border-2 ${overallCompliance >= 95 ? 'border-success bg-success/5' : overallCompliance >= 80 ? 'border-warning bg-warning/5' : 'border-error bg-error/5'}`}>
        <CardContent className="p-4 flex items-center gap-4">
          {overallCompliance >= 95 ? (
            <CheckCircle className="w-8 h-8 text-success" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-warning" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              {overallCompliance >= 95 ? 'Tudo em ordem!' : 'Atenção necessária'}
            </p>
            <p className="text-sm text-muted-foreground">
              Compliance sanitária: {overallCompliance}%
            </p>
          </div>
          <Badge variant={overallCompliance >= 95 ? 'default' : 'secondary'}>
            {overallCompliance >= 95 ? 'OK' : 'Pendente'}
          </Badge>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Cattle */}
        <Card className="animate-fade-in">
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
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
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
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
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

      {/* Official Mirror Table */}
      <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
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
              {cattleBalance.map((balance) => {
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
                  {cattleBalance.reduce((s, b) => s + b.male.previousBalance, 0)}
                </TableCell>
                <TableCell className="text-center text-success">
                  +{cattleBalance.reduce((s, b) => s + b.male.entries, 0)}
                </TableCell>
                <TableCell className="text-center text-error">
                  -{cattleBalance.reduce((s, b) => s + b.male.exits, 0)}
                </TableCell>
                <TableCell className="text-center">
                  {cattleBalance.reduce((s, b) => s + b.male.currentBalance, 0)}
                </TableCell>
                <TableCell className="text-center">
                  {cattleBalance.reduce((s, b) => s + b.female.previousBalance, 0)}
                </TableCell>
                <TableCell className="text-center text-success">
                  +{cattleBalance.reduce((s, b) => s + b.female.entries, 0)}
                </TableCell>
                <TableCell className="text-center text-error">
                  -{cattleBalance.reduce((s, b) => s + b.female.exits, 0)}
                </TableCell>
                <TableCell className="text-center">
                  {cattleBalance.reduce((s, b) => s + b.female.currentBalance, 0)}
                </TableCell>
                <TableCell className="text-center text-primary text-lg">
                  {totalCattle}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Compliance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {compliance.map((item, index) => (
          <Card 
            key={item.category}
            className={`animate-fade-in ${
              item.status === 'ok' ? 'border-success/30' : 
              item.status === 'warning' ? 'border-warning/30' : 
              'border-error/30'
            }`}
            style={{ animationDelay: `${400 + index * 100}ms` }}
          >
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold mb-1 ${
                item.status === 'ok' ? 'text-success' : 
                item.status === 'warning' ? 'text-warning' : 
                'text-error'
              }`}>
                {item.percentage}%
              </div>
              <p className="text-sm text-muted-foreground">{item.category}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
