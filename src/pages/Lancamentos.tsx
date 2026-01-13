import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Baby,
  Skull,
  Truck,
  Syringe,
  Dog,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/AppLayout';

const launchTypes = [
  {
    id: 'nascimento',
    title: 'Nascimento',
    description: 'Registrar novos bezerros',
    icon: Baby,
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
    icon: Dog,
    color: 'bg-muted',
    textColor: 'text-muted-foreground',
    path: '/lancamento/outras',
  },
];

export default function Lancamentos() {
  const { selectedProperty } = useAuth();
  const navigate = useNavigate();

  if (!selectedProperty) {
    navigate('/login');
    return null;
  }

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

      {/* Launch Types Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {launchTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card 
              key={type.id}
              className="cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-primary/20"
              onClick={() => navigate(type.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {launchTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.id}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate(type.path)}
                >
                  <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium">{type.title}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Dica: Lançamentos são retroativos
              </h4>
              <p className="text-sm text-muted-foreground">
                Você pode registrar movimentações de datas anteriores. Basta selecionar a data correta no formulário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return <AppLayout>{content}</AppLayout>;
}
