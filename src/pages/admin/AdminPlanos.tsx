import React, { useMemo, useState } from 'react';
import type { AdminPlan } from '@/services/api.service';
import { toast } from 'sonner';
import {
  CreditCard,
  Edit2,
  Plus,
  Check,
  X,
  Trash2,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notifyFirstFormError } from '@/lib/form-errors';
import { useAdminPlans } from '@/hooks/queries/admin/useAdminPlans';
import { useAdminCreatePlan, useAdminDeletePlan, useAdminUpdatePlan } from '@/hooks/mutations/admin/useAdminPlansMutations';

type Plan = {
  id: string;
  name: string;
  price: number;
  maxCattle: number | typeof Infinity;
  additionalChargeEnabled?: boolean;
  additionalChargePerHead?: number;
  features?: string[];
  active?: boolean;
  description?: string;
};

const planSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  price: z.number().min(0, 'Preço deve ser positivo'),
  maxCattle: z.number().min(1, 'Limite mínimo: 1').or(z.literal(Infinity)),
  additionalChargeEnabled: z.boolean(),
  additionalChargePerHead: z.number().min(0, 'Valor deve ser positivo'),
  features: z.string(),
  active: z.boolean(),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function AdminPlanos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const plansQuery = useAdminPlans();
  const createPlan = useAdminCreatePlan();
  const updatePlan = useAdminUpdatePlan();
  const deletePlan = useAdminDeletePlan();

  const plansData: Plan[] = useMemo(() => {
    const rows = (plansQuery.data ?? []) as AdminPlan[];

    const mapped: Plan[] = rows.map((p: AdminPlan) => {
      const name = p.name ?? (p as any).nome ?? '';
      const price = p.price ?? (p as any).preco ?? 0;
      const maxCattleRaw = (p as any).maxCattle ?? (p as any).maxCabecas;
      const maxCattle = maxCattleRaw === null || maxCattleRaw === undefined ? Infinity : maxCattleRaw;
      const additionalChargeEnabled = (p as any).additionalChargeEnabled ?? (p as any).cobrancaAdicionalAtiva ?? false;
      const additionalChargePerHead = (p as any).additionalChargePerHead ?? (p as any).valorCobrancaAdicional ?? 0.1;
      const features = (p as any).features ?? (p as any).recursos ?? [];
      const active = (p as any).active ?? (p as any).ativo ?? true;
      return {
        id: p.id,
        name,
        price,
        maxCattle,
        additionalChargeEnabled,
        additionalChargePerHead,
        features,
        active,
      };
    });

    return mapped.sort((a, b) => a.price - b.price);
  }, [plansQuery.data]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setFocus,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      price: 0,
      maxCattle: 500,
      additionalChargeEnabled: false,
      additionalChargePerHead: 0.1,
      features: '',
      active: true,
    },
  });

  const onInvalid = () => {
    const { toastMessage } = notifyFirstFormError(errors as any, {
      setFocus,
      title: 'Ops! Tem um detalhe para ajustar:',
    });
    toast.error(toastMessage);
  };

  const openCreateDialog = () => {
    setEditingPlan(null);
    reset({
      name: '',
      price: 0,
      maxCattle: 500,
      additionalChargeEnabled: false,
      additionalChargePerHead: 0.1,
      features: '',
      active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    reset({
      name: plan.name,
      price: plan.price,
      maxCattle: plan.maxCattle === Infinity ? 999999 : plan.maxCattle,
      additionalChargeEnabled: plan.additionalChargeEnabled ?? false,
      additionalChargePerHead: plan.additionalChargePerHead ?? 0.1,
      features: plan.features?.join('\n') || '',
      active: plan.active !== false,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: PlanFormData) => {
    setLoading(true);
    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({
          id: editingPlan.id,
          data: {
            name: data.name,
            price: data.price,
            maxCattle: data.maxCattle >= 999999 ? null : data.maxCattle,
            additionalChargeEnabled: data.additionalChargeEnabled,
            additionalChargePerHead: data.additionalChargePerHead,
            features: data.features.split('\n').map((f) => f.trim()).filter((f) => f),
            active: data.active,
          },
        });
        toast.success('Plano atualizado com sucesso');
      } else {
        await createPlan.mutateAsync({
          name: data.name,
          price: data.price,
          maxCattle: data.maxCattle >= 999999 ? null : data.maxCattle,
          additionalChargeEnabled: data.additionalChargeEnabled,
          additionalChargePerHead: data.additionalChargePerHead,
          features: data.features.split('\n').map((f) => f.trim()).filter((f) => f),
          active: data.active,
        });
        toast.success('Plano criado com sucesso');
      }
      setDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast.error('Erro ao salvar plano');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;
    try {
      await deletePlan.mutateAsync(deletingPlan.id);
      toast.success('Plano deletado com sucesso');
      setDeletingPlan(null);
    } catch (error) {
      console.error('Erro ao deletar plano:', error);
      toast.error('Erro ao deletar plano');
    }
  };

  const togglePlanStatus = async (plan: Plan) => {
    try {
      const nextActive = !(plan.active ?? true);
      await updatePlan.mutateAsync({ id: plan.id, data: { active: nextActive } });
      toast.success(`Plano "${plan.name}" ${nextActive ? 'ativado' : 'desativado'}`);
    } catch (error) {
      console.error('Erro ao alterar status do plano:', error);
      toast.error('Erro ao alterar status do plano');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Planos
          </h1>
          <p className="text-muted-foreground">
            {plansData.length} {plansData.length === 1 ? 'plano configurado' : 'planos configurados'}
          </p>
        </div>

        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plansData.slice().sort((a, b) => a.price - b.price).map((plan) => (
          <Card 
            key={plan.id}
            className={`relative ${plan.active === false ? 'opacity-60' : ''}`}
          >
            {plan.active === false && (
              <Badge variant="secondary" className="absolute top-4 right-4">
                Inativo
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold text-xl">{plan.name}</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {plan.maxCattle === Infinity ? 'Ilimitado' : `Até ${plan.maxCattle.toLocaleString()} cabeças`}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-sm text-muted-foreground">por mês</div>
              </div>

              {plan.additionalChargeEnabled && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-sm font-medium text-foreground">Cobrança adicional</div>
                  <div className="text-sm text-muted-foreground">
                    R$ {(plan.additionalChargePerHead ?? 0.1).toFixed(2).replace('.', ',')} por cabeça/mês
                  </div>
                </div>
              )}

              {plan.features && plan.features.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="text-sm font-medium text-muted-foreground">Recursos:</div>
                  <ul className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-sm text-muted-foreground">
                        +{plan.features.length - 3} mais recursos
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openEditDialog(plan)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => togglePlanStatus(plan)}
                >
                  {plan.active === false ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDeletingPlan(plan)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? `Editar Plano: ${editingPlan.name}` : 'Criar Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              Configure nome, preço, limite de cabeças e recursos do plano
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço Mensal (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('price', { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxCattle">Limite de Cabeças *</Label>
              <Input
                id="maxCattle"
                type="number"
                placeholder="500"
                {...register('maxCattle', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Use 999999 ou maior para ilimitado
              </p>
              {errors.maxCattle && (
                <p className="text-sm text-destructive">{errors.maxCattle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Recursos (um por linha)</Label>
              <Textarea
                id="features"
                placeholder="Dashboard completo&#10;Relatórios PDF&#10;Suporte prioritário"
                rows={6}
                {...register('features')}
              />
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="additionalChargeEnabled"
                  checked={watch('additionalChargeEnabled')}
                  onCheckedChange={(checked) => setValue('additionalChargeEnabled', checked)}
                />
                <Label htmlFor="additionalChargeEnabled" className="cursor-pointer">
                  Cobrança adicional por cabeça/mês
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="additionalChargePerHead">Valor (R$)</Label>
                  <Input
                    id="additionalChargePerHead"
                    type="number"
                    step="0.01"
                    placeholder="0.10"
                    disabled={!watch('additionalChargeEnabled')}
                    {...register('additionalChargePerHead', { valueAsNumber: true })}
                  />
                  {errors.additionalChargePerHead && (
                    <p className="text-sm text-destructive">{errors.additionalChargePerHead.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Padrão sugerido</Label>
                  <div className="h-10 rounded-md border bg-muted/30 px-3 flex items-center text-sm text-muted-foreground">
                    R$ 0,10 por cabeça/mês
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={watch('active')}
                onCheckedChange={(checked) => setValue('active', checked)}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Plano ativo (visível para novos assinantes)
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{deletingPlan?.name}"? 
              Esta ação não pode ser desfeita. Clientes já assinantes não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir Plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
