import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { plans, determineUserPlan } from '@/lib/plans';
import { LivestockMirrorDTO, PropertyDTO } from '@/types';
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
import { MaskedInput } from '@/components/ui/masked-input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { fetchViaCepWithCache } from '@/lib/cep';
import { notifyFirstFormError } from '@/lib/form-errors';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// SCHEMA ZOD
// ============================================================================

const propertySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cep: z
    .string()
    .min(1, 'CEP é obrigatório')
    .refine((value) => value.replace(/\D/g, '').length === 8, 'CEP deve ter 8 dígitos'),
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
  const { user, selectProperty, logout, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cattleCountByProperty, setCattleCountByProperty] = useState<Record<string, number>>({});

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

  const properties = useMemo(() => user?.properties ?? [], [user]);

  useEffect(() => {
    if (properties.length === 0) {
      setCattleCountByProperty({});
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const results = await Promise.all(
          properties.map(async (p) => {
            try {
              const mirror = await apiClient.get<LivestockMirrorDTO>(`/rebanho/${p.id}/espelho?months=1`);
              return [p.id, mirror?.totals?.total ?? 0] as const;
            } catch {
              return [p.id, p.cattleCount ?? 0] as const;
            }
          }),
        );

        if (cancelled) return;

        const next: Record<string, number> = {};
        for (const [propertyId, count] of results) {
          next[propertyId] = count;
        }
        setCattleCountByProperty(next);
      } catch {
        if (cancelled) return;
        setCattleCountByProperty({});
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [properties]);

  const propertiesWithComputedCount = useMemo(
    () =>
      properties.map((p) => ({
        ...p,
        cattleCount: cattleCountByProperty[p.id] ?? p.cattleCount ?? 0,
      })),
    [properties, cattleCountByProperty],
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleSelectProperty = (propertyId: string) => {
    selectProperty(propertyId);
    navigate('/dashboard');
  };

  const onInvalid = () => {
    const { toastMessage } = notifyFirstFormError(form.formState.errors as any, {
      setFocus: form.setFocus,
      title: 'Ops! Tem um detalhe para ajustar:',
    });
    toast.error(toastMessage);
  };

  // Get unified user plan information
  const totalCattle = propertiesWithComputedCount.reduce((total, property) => total + (property.cattleCount ?? 0), 0);
  const userPlan = determineUserPlan(totalCattle);

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
      const payload = {
        name: data.name,
        city: data.city,
        state: data.uf,
        cep: data.cep,
        accessRoute: data.accessRoute,
        community: data.community,
        totalArea: Number(data.areaTotalHa ?? 0),
        cultivatedArea: Number(data.pastureCultivatedHa ?? 0),
        naturalArea: Number(data.pastureNaturalHa ?? 0),
        cattleCount: 0,
        plan: 'porteira',
      };

      const created = await apiClient.post<PropertyDTO>('/propriedades/minhas', payload);
      await refreshMe();

      toast.success('Propriedade cadastrada com sucesso!');
      setOpenDialog(false);
      form.reset();
      
      // Navegar para onboarding da nova propriedade
      selectProperty(created);
      navigate('/onboarding');
    } catch (error) {
      toast.error('Erro ao cadastrar propriedade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-3 md:px-4 py-3 md:py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <img
              src="/agrosaldo-logo.png"
              alt="AgroSaldo"
              className="h-6 md:h-8 w-auto object-contain shrink-0"
              loading="eager"
            />
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground truncate">Olá, {user.name.split(' ')[0]}!</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="shrink-0">
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">
              Selecione uma Propriedade
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Escolha a fazenda que deseja gerenciar
            </p>
          </div>
          <Button onClick={() => setOpenDialog(true)} className="gap-2 w-full md:w-auto">
            <Plus className="w-4 h-4" />
            Nova Propriedade
          </Button>
        </div>

        {/* User Plan Summary */}
        <Card className="mb-6 md:mb-8 border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                  Seu Plano Atual
                </h3>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <Badge 
                    variant="secondary"
                    className="text-xs md:text-sm font-medium px-2 md:px-3 py-1"
                    style={{ backgroundColor: userPlan.color + '20', color: userPlan.color }}
                  >
                    {userPlan.name}
                  </Badge>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl md:text-2xl font-bold text-foreground">
                      R$ {userPlan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs md:text-sm text-muted-foreground">/mês</span>
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  Total de cabeças em todas as propriedades
                </p>
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  {totalCattle.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Capacidade: {userPlan.maxCattle === -1 ? '∞ cabeças' : `${userPlan.maxCattle.toLocaleString()} cabeças`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {propertiesWithComputedCount.length > 0 ? (
          <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {propertiesWithComputedCount.map((property, index) => {
              return (
                <Card 
                  key={property.id}
                  className="cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02] animate-fade-in border-2 border-transparent hover:border-primary/20 active:scale-[0.98]"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleSelectProperty(property.id)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Beef className="w-6 h-6 text-primary" />
                      </div>
                      <Badge 
                        variant="secondary"
                        className="text-xs font-medium"
                        style={{ backgroundColor: userPlan.color + '20', color: userPlan.color }}
                      >
                        {userPlan.name}
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
                          {(property.cattleCount ?? 0).toLocaleString('pt-BR')}
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
        </div>
      </main>

      {/* Dialog de cadastro de propriedade */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex max-h-[85vh] flex-col">
              <DialogHeader className="px-6 pb-2 pt-6">
                <DialogTitle className="font-display text-xl">Cadastrar Nova Propriedade</DialogTitle>
                <DialogDescription>
                  Preencha os dados da sua fazenda para começar
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 pb-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
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
                      <MaskedInput
                        mask="99999-999"
                        value={field.value}
                        onChange={field.onChange}
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
              <div className="space-y-3 rounded-xl bg-muted/50 p-4 sm:col-span-2">
                <p className="font-medium text-sm">Espécies (selecione pelo menos uma):</p>
                
                <FormField
                  control={form.control}
                  name="bovinoEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={Boolean(field.value)}
                          onCheckedChange={(next) => field.onChange(next === true)}
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
                          checked={Boolean(field.value)}
                          onCheckedChange={(next) => field.onChange(next === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Bubalinos
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

                </div>
              </div>

              <div className="border-t bg-background px-6 py-4">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenDialog(false)}
                    className="sm:min-w-32"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="sm:min-w-56">
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
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
