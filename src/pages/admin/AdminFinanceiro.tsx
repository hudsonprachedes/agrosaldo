import React from 'react';
import { mockTenants } from '@/mocks/mock-admin';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CreditCard,
  Ban,
  RefreshCw,
  Calendar,
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

export default function AdminFinanceiro() {
  const mrr = mockTenants
    .filter(t => t.status === 'active')
    .reduce((sum, t) => {
      const planPrices: Record<string, number> = {
        'Porteira': 29.90,
        'Piquete': 69.90,
        'Retiro': 129.90,
        'Estância': 249.90,
        'Barão': 399.90,
      };
      return sum + (planPrices[t.plan] || 0);
    }, 0);

  const overdueAccounts = mockTenants.filter(t => t.financialStatus === 'overdue');
  const overdueAmount = overdueAccounts.reduce((sum, t) => {
    const planPrices: Record<string, number> = {
      'Porteira': 29.90,
      'Piquete': 69.90,
      'Retiro': 129.90,
      'Estância': 249.90,
      'Barão': 399.90,
    };
    return sum + (planPrices[t.plan] || 0);
  }, 0);

  const handleSuspend = (tenantId: string, tenantName: string) => {
    toast.error(`Acesso de ${tenantName} suspenso por inadimplência`);
  };

  const handleReminder = (tenantId: string, tenantName: string) => {
    toast.success(`Lembrete enviado para ${tenantName}`);
  };

  const kpis = [
    {
      title: 'MRR Atual',
      value: `R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
      change: '+15%',
      changeType: 'positive',
    },
    {
      title: 'Inadimplência',
      value: `R$ ${overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: AlertTriangle,
      color: 'text-error',
      bgColor: 'bg-error/10',
      change: overdueAccounts.length.toString(),
      changeType: 'count',
    },
    {
      title: 'Taxa de Churn',
      value: '2.3%',
      icon: TrendingDown,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      change: '-0.5%',
      changeType: 'positive',
    },
    {
      title: 'LTV Médio',
      value: 'R$ 1.450',
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: '+8%',
      changeType: 'positive',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Financeiro
        </h1>
        <p className="text-muted-foreground">
          Acompanhe receitas, inadimplência e métricas financeiras
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card 
            key={kpi.title}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${kpi.bgColor} flex items-center justify-center`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-sm">
                {kpi.changeType === 'count' ? (
                  <span className="text-error font-medium">{kpi.change} contas</span>
                ) : (
                  <>
                    <TrendingUp className={`w-4 h-4 ${kpi.changeType === 'positive' ? 'text-success' : 'text-error'}`} />
                    <span className={`font-medium ${kpi.changeType === 'positive' ? 'text-success' : 'text-error'}`}>
                      {kpi.change}
                    </span>
                    <span className="text-muted-foreground">vs mês anterior</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overdue Accounts */}
      <Card className="border-error/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-error">
            <AlertTriangle className="w-5 h-5" />
            Contas Inadimplentes ({overdueAccounts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma conta inadimplente no momento</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Dias Atrasado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueAccounts.map((tenant) => {
                  const planPrices: Record<string, number> = {
                    'Porteira': 29.90,
                    'Piquete': 69.90,
                    'Retiro': 129.90,
                    'Estância': 249.90,
                    'Barão': 399.90,
                  };
                  const amount = planPrices[tenant.plan] || 0;
                  const daysOverdue = Math.floor(Math.random() * 30) + 5;

                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.cpfCnpj}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tenant.plan}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {amount.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-error/10 text-error">
                          {daysOverdue} dias
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-error/10 text-error">
                          Inadimplente
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReminder(tenant.id, tenant.name)}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Lembrar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleSuspend(tenant.id, tenant.name)}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Suspender
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Evolução do MRR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            📊 Gráfico de MRR mensal (últimos 12 meses)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
