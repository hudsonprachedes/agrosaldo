import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Property } from '@/mocks/mock-auth';
import { plans } from '@/mocks/mock-auth';
import { MapPin, ChevronRight, Beef } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PropertySelection() {
  const { user, selectProperty, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSelectProperty = (property: Property) => {
    selectProperty(property);
    navigate('/dashboard');
  };

  const getPlanInfo = (planId: string) => {
    return plans.find(p => p.id === planId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Beef className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-foreground">AgroSaldo</h1>
              <p className="text-sm text-muted-foreground">Olá, {user.name.split(' ')[0]}!</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Selecione uma Propriedade
          </h2>
          <p className="text-muted-foreground">
            Escolha a fazenda que deseja gerenciar
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {user.properties.map((property, index) => {
            const plan = getPlanInfo(property.plan);
            return (
              <Card 
                key={property.id}
                className="cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02] animate-fade-in border-2 border-transparent hover:border-primary/20"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleSelectProperty(property)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Beef className="w-6 h-6 text-primary" />
                    </div>
                    <Badge 
                      variant="secondary"
                      className="text-xs font-medium"
                      style={{ backgroundColor: plan?.color + '20', color: plan?.color }}
                    >
                      {plan?.name}
                    </Badge>
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                    {property.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{property.city}, {property.state}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {property.cattleCount.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">cabeças</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
