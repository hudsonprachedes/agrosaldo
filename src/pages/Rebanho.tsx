import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { 
  mockCattleBalance,
  ageGroups,
  getTotalCattle,
  CattleBalance,
} from '@/mocks/mock-bovinos';
import {
  Beef,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ChevronRight,
  Filter,
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
import AppLayout from '@/components/layout/AppLayout';

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

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Beef className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalCattle.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">cabeças</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">♂️</span>
              <span className="text-sm text-muted-foreground">Machos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totals.maleBalance.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">cabeças</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">♀️</span>
              <span className="text-sm text-muted-foreground">Fêmeas</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totals.femaleBalance.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">cabeças</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-sm text-muted-foreground">Entradas</span>
            </div>
            <p className="text-2xl font-bold text-success">+{(totals.maleEntries + totals.femaleEntries).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
      </div>

      {/* Balance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Saldo por Faixa Etária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faixa Etária</TableHead>
                  <TableHead className="text-center">♂️ Machos</TableHead>
                  <TableHead className="text-center">♀️ Fêmeas</TableHead>
                  <TableHead className="text-center text-success">Entradas</TableHead>
                  <TableHead className="text-center text-error">Saídas</TableHead>
                  <TableHead className="text-right">Saldo Atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((balance) => (
                  <TableRow key={balance.ageGroupId}>
                    <TableCell className="font-medium">
                      {getAgeGroupLabel(balance.ageGroupId)}
                    </TableCell>
                    <TableCell className="text-center">
                      {balance.male.currentBalance.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-center">
                      {balance.female.currentBalance.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-center text-success">
                      +{(balance.male.entries + balance.female.entries).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-center text-error">
                      -{(balance.male.exits + balance.female.exits).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {(balance.male.currentBalance + balance.female.currentBalance).toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-center">{totals.maleBalance.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-center">{totals.femaleBalance.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-center text-success">
                    +{(totals.maleEntries + totals.femaleEntries).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-center text-error">
                    -{(totals.maleExits + totals.femaleExits).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">{totalCattle.toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Age Group Cards (Mobile Friendly) */}
      {isMobile && (
        <div className="space-y-3">
          {balances.map((balance) => (
            <Card key={balance.ageGroupId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">{getAgeGroupLabel(balance.ageGroupId)}</Badge>
                  <span className="text-lg font-bold">
                    {(balance.male.currentBalance + balance.female.currentBalance).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">♂️ Machos:</span>
                    <span className="ml-2 font-medium">{balance.male.currentBalance}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">♀️ Fêmeas:</span>
                    <span className="ml-2 font-medium">{balance.female.currentBalance}</span>
                  </div>
                  <div>
                    <span className="text-success">+{balance.male.entries + balance.female.entries}</span>
                    <span className="text-muted-foreground ml-1">entradas</span>
                  </div>
                  <div>
                    <span className="text-error">-{balance.male.exits + balance.female.exits}</span>
                    <span className="text-muted-foreground ml-1">saídas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
