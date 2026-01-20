import React, { useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useLaunchSummary } from '@/hooks/queries/useLaunchSummary';
import { 
  Beef,
  Skull,
  Truck,
  ShoppingCart,
  Syringe,
  PawPrint,
  ChevronRight,
  Plus,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const launchTypes = [
  {
    id: 'nascimento',
    title: 'Nascimento',
    description: 'Registrar novos bezerros',
    icon: Beef,
    color: 'bg-success',
    textColor: 'text-success',
    path: '/lancamento/nascimento',
  },
  {
    id: 'mortalidade',
    title: 'Mortalidade',
    description: 'Baixa por morte natural ou consumo',
    icon: Skull,
    color: 'bg-death',
    textColor: 'text-death',
    path: '/lancamento/mortalidade',
  },
  {
    id: 'venda',
    title: 'Venda',
    description: 'Saída para frigorífico ou produtor',
    icon: Truck,
    color: 'bg-warning',
    textColor: 'text-warning',
    path: '/lancamento/venda',
  },
  {
    id: 'compra',
    title: 'Compra',
    description: 'Entrada por compra (lote ou individual)',
    icon: ShoppingCart,
    color: 'bg-primary',
    textColor: 'text-primary',
    path: '/lancamento/compra',
  },
  {
    id: 'vacina',
    title: 'Vacinação',
    description: 'Registrar campanha de vacina',
    icon: Syringe,
    color: 'bg-chart-3',
    textColor: 'text-chart-3',
    path: '/lancamento/vacina',
  },
  {
    id: 'outras',
    title: 'Outras Espécies',
    description: 'Equinos, muares, ovinos, etc.',
    icon: PawPrint,
    color: 'bg-muted',
    textColor: 'text-muted-foreground',
    path: '/lancamento/outras',
  },
];

export default function Lancamentos() {
  const { selectedProperty } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const { data: summary, isPending: isLoading } = useLaunchSummary(selectedProperty?.id);

  const lastUpdatedAt = summary?.lastUpdatedAt ?? null;

  useEffect(() => {
    if (!selectedProperty) {
      navigate('/login');
    }
  }, [navigate, selectedProperty]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return '—';
    const d = new Date(lastUpdatedAt);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [lastUpdatedAt]);

  const content = (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Lançamentos
          </h1>
          <p className="text-muted-foreground">
            Registrar movimentações do rebanho
          </p>
        </div>
      </div>

      {/* Versão Web - Grid de Cards Grandes */}
      {!isMobile && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {launchTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card 
                  key={type.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-primary/20"
                  onClick={() => navigate(type.path)}
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className={`w-20 h-20 rounded-2xl ${type.color} flex items-center justify-center`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                          {type.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                      <Button className="w-full mt-2" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Lançamento
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lançamentos Hoje</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{summary?.today ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Última atualização: {lastUpdatedLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{summary?.week ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                </div>
                <p className="text-xs text-success mt-4">+18% vs semana anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Este Mês</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{summary?.month ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-chart-3" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Média de 6 lançamentos/dia</p>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-lg mb-2">
                    💡 Dica: Lançamentos são retroativos
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Você pode registrar movimentações de datas anteriores. Basta selecionar a data correta no formulário. 
                    Todos os lançamentos são automaticamente validados conforme as regras de negócio da sua propriedade.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Versão Mobile - Lista Compacta */}
      {isMobile && (
        <div className="grid gap-4">
          {launchTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card 
                key={type.id}
                className="cursor-pointer hover:shadow-card-hover transition-all duration-300"
                onClick={() => navigate(type.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl ${type.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                        {type.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  return content;
}
