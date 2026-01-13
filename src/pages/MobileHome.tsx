import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Baby,
  Skull,
  Truck,
  Syringe,
  Dog,
  MessageCircle,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getTotalCattle, getMonthlyBirths, getMonthlyDeaths } from '@/mocks/mock-bovinos';
import { mockComplianceData } from '@/mocks/mock-analytics';
import MobileLayout from '@/components/layout/MobileLayout';

const actionItems = [
  { 
    id: 'birth', 
    label: 'Nascimento', 
    icon: Baby, 
    color: 'bg-gradient-to-br from-success to-success/80', 
    textColor: 'text-white',
    emoji: '🐮',
    path: '/lancamento/nascimento'
  },
  { 
    id: 'death', 
    label: 'Mortalidade', 
    icon: Skull, 
    color: 'bg-gradient-to-br from-death to-death/80', 
    textColor: 'text-white',
    emoji: '⚫',
    path: '/lancamento/mortalidade'
  },
  { 
    id: 'sale', 
    label: 'Venda', 
    icon: Truck, 
    color: 'bg-gradient-to-br from-warning to-warning/80', 
    textColor: 'text-warning-foreground',
    emoji: '🚚',
    path: '/lancamento/venda'
  },
  { 
    id: 'vaccine', 
    label: 'Vacina', 
    icon: Syringe, 
    color: 'bg-gradient-to-br from-chart-3 to-chart-3/80', 
    textColor: 'text-white',
    emoji: '💉',
    path: '/lancamento/vacina'
  },
  { 
    id: 'other', 
    label: 'Outras Espécies', 
    icon: Dog, 
    color: 'bg-gradient-to-br from-muted to-muted/80', 
    textColor: 'text-foreground',
    emoji: '🐴',
    path: '/lancamento/outras'
  },
  { 
    id: 'help', 
    label: 'Ajuda', 
    icon: MessageCircle, 
    color: 'bg-gradient-to-br from-success to-success/80', 
    textColor: 'text-white',
    emoji: '📞',
    path: 'https://wa.me/5565999999999'
  },
];

export default function MobileHome() {
  const { user, selectedProperty } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!user || !selectedProperty) {
    navigate('/login');
    return null;
  }

  // If not mobile, redirect to dashboard
  if (!isMobile) {
    navigate('/dashboard');
    return null;
  }

  const totalCattle = getTotalCattle(selectedProperty.id);
  const monthlyBirths = getMonthlyBirths(selectedProperty.id) || 87;
  const monthlyDeaths = getMonthlyDeaths(selectedProperty.id) || 10;
  const compliance = mockComplianceData[selectedProperty.id] || [];
  const overallCompliance = compliance.length > 0
    ? Math.round(compliance.reduce((sum, c) => sum + c.percentage, 0) / compliance.length)
    : 100;

  const handleActionClick = (item: typeof actionItems[0]) => {
    if (item.id === 'help') {
      window.open(item.path, '_blank');
    } else {
      navigate(item.path);
    }
  };

  const getStatusColor = () => {
    if (overallCompliance >= 95) return 'bg-success';
    if (overallCompliance >= 80) return 'bg-warning';
    return 'bg-error';
  };

  const getStatusText = () => {
    if (overallCompliance >= 95) return 'Tudo em ordem! ✓';
    if (overallCompliance >= 80) return 'Atenção necessária';
    return 'Pendências críticas!';
  };

  return (
    <MobileLayout>
      {/* Hero Stats Section */}
      <div className="bg-primary text-primary-foreground -mt-1 rounded-b-3xl px-4 pb-6 pt-2">
        {/* Status Bar */}
        <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-xl p-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
          <div className="flex-1">
            <p className="text-sm font-medium">{getStatusText()}</p>
            <p className="text-xs opacity-80">Compliance: {overallCompliance}%</p>
          </div>
          {overallCompliance >= 95 ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
        </div>

        {/* Total Cattle */}
        <div className="text-center py-4">
          <p className="text-5xl font-bold font-display tracking-tight">
            {totalCattle.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm opacity-80 mt-1">cabeças no rebanho</p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-2xl font-bold text-success">+{monthlyBirths}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">Nascimentos</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="w-4 h-4 text-error" />
              <span className="text-2xl font-bold text-error">-{monthlyDeaths}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">Mortes</p>
          </div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="p-4 -mt-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <h2 className="font-display font-semibold text-lg mb-4 text-foreground flex items-center gap-2">
              <span>⚡</span> Lançamentos Rápidos
            </h2>
            
            <div className="grid grid-cols-3 gap-3">
              {actionItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleActionClick(item)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl 
                    ${item.color} ${item.textColor} 
                    shadow-mobile-btn active:scale-95 transition-all duration-200
                    animate-scale-in min-h-[100px]`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <span className="text-xs font-semibold text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="px-4 space-y-3 pb-4">
        <Card 
          className="cursor-pointer active:scale-[0.98] transition-transform border-0 shadow-card" 
          onClick={() => navigate('/analises')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Análises</p>
                <p className="text-sm text-muted-foreground">Ver gráficos e relatórios</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer active:scale-[0.98] transition-transform border-0 shadow-card" 
          onClick={() => navigate('/minha-fazenda')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🏡</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Minha Fazenda</p>
                <p className="text-sm text-muted-foreground">Dados e configurações</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Compliance Cards */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {compliance.slice(0, 4).map((item, index) => (
            <Card 
              key={item.category}
              className={`border-0 shadow-sm animate-fade-in ${
                item.status === 'ok' ? 'bg-success/5' : 
                item.status === 'warning' ? 'bg-warning/5' : 
                'bg-error/5'
              }`}
              style={{ animationDelay: `${200 + index * 50}ms` }}
            >
              <CardContent className="p-3 text-center">
                <div className={`text-2xl font-bold ${
                  item.status === 'ok' ? 'text-success' : 
                  item.status === 'warning' ? 'text-warning' : 
                  'text-error'
                }`}>
                  {item.percentage}%
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{item.category}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
