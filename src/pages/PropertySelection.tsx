import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Property } from '@/mocks/mock-auth';
import { plans } from '@/mocks/mock-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin, ChevronRight, Beef, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { fetchViaCepWithCache } from '@/lib/cep';

// ============================================================================
// SCHEMA ZOD
// ============================================================================

const propertySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cep: z.string().length(8, 'CEP deve ter 8 dígitos'),
  accessRoute: z.string().optional(),
  community: z.string().optional(),
  city: z.string().min(2, 'Cidade inválida'),
  uf: z.string().length(2, 'UF inválido'),
  pastureNaturalHa: z.number().min(0, 'Valor não pode ser negativo'),
  pastureCultivatedHa: z.number().min(0, 'Valor não pode ser negativo'),
  areaTotalHa: z.number().min(0, 'Valor não pode ser negativo'),
  bovinoEnabled: z.boolean().default(true),
  bubalinoEnabled: z.boolean().default(false),
}).refine(
  data => data.bovinoEnabled || data.bubalinoEnabled,
  { message: 'Selecione pelo menos uma espécie', path: ['bovinoEnabled'] }
).refine(
  data => data.areaTotalHa >= (data.pastureNaturalHa + data.pastureCultivatedHa),
  { message: 'Área total deve ser maior que soma das pastagens', path: ['areaTotalHa'] }
);

type PropertyFormData = z.infer<typeof propertySchema>;

export default function PropertySelection() {
  const { user, selectProperty, logout } = useAuth();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      cep: '',
      accessRoute: '',
      community: '',
      city: '',
      uf: '',
      pastureNaturalHa: 0,
      pastureCultivatedHa: 0,
      areaTotalHa: 0,
      bovinoEnabled: true,
      bubalinoEnabled: false,
    },
  });

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

  // Handle CEP lookup
  const handleCepChange = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;

    setCepLoading(true);
    try {
      const result = await fetchViaCepWithCache(cep);
      if (result.found) {
        form.setValue('city', result.city);
        form.setValue('uf', result.uf);
      } else {
        toast.warning('CEP não encontrado. Preencha manualmente.');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  };

  // Handle property creation
  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      // Criar nova propriedade
      const newProperty: Property = {
        id: `property_${Date.now()}`,
        name: data.name,
        cep: data.cep,
        accessRoute: data.accessRoute,
        community: data.community,
        city: data.city,
        state: data.uf,
        totalArea: data.areaTotalHa,
        cultivatedArea: data.pastureCultivatedHa,
        naturalArea: data.pastureNaturalHa,
        pastureNaturalHa: data.pastureNaturalHa,
        pastureCultivatedHa: data.pastureCultivatedHa,
        areaTotalHa: data.areaTotalHa,
        cattleCount: 0,
        status: 'active',
        plan: 'porteira', // Padrão inicial
        speciesEnabled: {
          bovino: data.bovinoEnabled,
          bubalino: data.bubalinoEnabled,
        },
      };

      // Adicionar à propriedade do usuário (em mock)
      if (user) {
        user.properties.push(newProperty);
        localStorage.setItem('agrosaldo_user_id', user.id);
      }

      toast.success('Propriedade cadastrada com sucesso!');
      setOpenDialog(false);
      form.reset();
      
      // Navegar para onboarding da nova propriedade
      selectProperty(newProperty);
      navigate('/onboarding');
    } catch (error) {
      toast.error('Erro ao cadastrar propriedade');
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Selecione uma Propriedade
            </h2>
            <p className="text-muted-foreground">
              Escolha a fazenda que deseja gerenciar
            </p>
          </div>
          <Button onClick={() => setOpenDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Propriedade
          </Button>
        </div>

        {user.properties.length > 0 ? (
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
        ) : (
          <div className="text-center py-12">
            <Beef className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma propriedade cadastrada</p>
            <Button onClick={() => setOpenDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Cadastrar Primeira Propriedade
            </Button>
          </div>
        )}
      </main>

      {/* Dialog de cadastro de propriedade */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Cadastrar Nova Propriedade</DialogTitle>
            <DialogDescription>
              Preencha os dados da sua fazenda para começar
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Propriedade</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Fazenda Exemplo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CEP */}
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="12345-678"
                        disabled={cepLoading}
                        onBlur={() => {
                          field.onBlur();
                          handleCepChange(field.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Via de acesso */}
              <FormField
                control={form.control}
                name="accessRoute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Via de Acesso (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Rodovia, estrada, etc" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comunidade/Assentamento */}
              <FormField
                control={form.control}
                name="community"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comunidade/Assentamento (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da comunidade" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cidade */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* UF */}
              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pastos naturais */}
              <FormField
                control={form.control}
                name="pastureNaturalHa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pastos Naturais (hectares)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pastos cultivados */}
              <FormField
                control={form.control}
                name="pastureCultivatedHa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pastos Cultivados (hectares)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Área total */}
              <FormField
                control={form.control}
                name="areaTotalHa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Total (hectares)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Espécies habilitadas */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">Espécies (selecione pelo menos uma):</p>
                
                <FormField
                  control={form.control}
                  name="bovinoEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Bovinos
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bubalinoEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Bubalinos
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpenDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    'Cadastrar Propriedade'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
