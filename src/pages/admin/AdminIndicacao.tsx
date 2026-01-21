import React, { useMemo, useState } from 'react';
import {
  Ticket,
  Users,
  DollarSign,
  Copy,
  Plus,
  Search,
  TrendingUp,
  Power,
  Pencil,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import PageSkeleton from '@/components/PageSkeleton';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { AdminCoupon, AdminCouponUsage, AdminReferrer } from '@/services/api.service';
import { useAdminCoupons, useAdminCouponUsages, useAdminReferrers } from '@/hooks/queries/admin/useAdminReferral';
import { useAdminCreateCoupon, useAdminUpdateCoupon } from '@/hooks/mutations/admin/useAdminReferralMutations';

export default function AdminIndicacao() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);

  const couponsQuery = useAdminCoupons();
  const referrersQuery = useAdminReferrers();
  const usagesQuery = useAdminCouponUsages();

  const createCoupon = useAdminCreateCoupon();
  const updateCoupon = useAdminUpdateCoupon();

  const coupons = useMemo(
    () => (couponsQuery.data ?? []) as AdminCoupon[],
    [couponsQuery.data],
  );
  const referrers = useMemo(
    () => (referrersQuery.data ?? []) as AdminReferrer[],
    [referrersQuery.data],
  );
  const usages = useMemo(
    () => (usagesQuery.data ?? []) as AdminCouponUsage[],
    [usagesQuery.data],
  );

  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'discount' | 'referral'>('discount');
  const [newValue, setNewValue] = useState<number>(10);
  const [newMaxUsage, setNewMaxUsage] = useState<number | ''>('');
  const [newCommission, setNewCommission] = useState<number>(0);
  const [newReferrerName, setNewReferrerName] = useState('');
  const [newReferrerCpfCnpj, setNewReferrerCpfCnpj] = useState('');
  const [newReferrerPhone, setNewReferrerPhone] = useState('');

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Cupom copiado!');
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setNewCode('');
    setNewType('discount');
    setNewValue(10);
    setNewMaxUsage('');
    setNewCommission(0);
    setNewReferrerName('');
    setNewReferrerCpfCnpj('');
    setNewReferrerPhone('');
  };

  const handleSaveCoupon = async () => {
    if (!newCode.trim()) {
      toast.error('Informe o código do cupom');
      return;
    }

    if (newType === 'referral' && !newReferrerName.trim()) {
      toast.error('Informe o nome do indicador');
      return;
    }

    if (newType === 'referral' && !newReferrerCpfCnpj.trim()) {
      toast.error('Informe o CPF/CNPJ do indicador');
      return;
    }

    if (newType === 'referral' && !newReferrerPhone.trim()) {
      toast.error('Informe o telefone do indicador');
      return;
    }

    try {
      const payload = {
        code: newCode.trim().toUpperCase(),
        type: newType,
        value: Number(newValue),
        maxUsage: newMaxUsage === '' ? null : Number(newMaxUsage),
        commission: newType === 'referral' ? Number(newCommission) : 0,
        ...(newType === 'referral'
          ? {
              referrerName: newReferrerName.trim(),
              referrerCpfCnpj: newReferrerCpfCnpj.trim() || undefined,
              referrerPhone: newReferrerPhone.trim() || undefined,
            }
          : {
              referrerName: undefined,
              referrerCpfCnpj: undefined,
              referrerPhone: undefined,
            }),
      } as const;

      if (editingCoupon) {
        await updateCoupon.mutateAsync({ id: editingCoupon.id, data: payload });
        toast.success('Cupom atualizado com sucesso!');
      } else {
        await createCoupon.mutateAsync({ ...payload, status: 'active' });
        toast.success('Cupom criado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      toast.error('Erro ao salvar cupom');
    }
  };

  const toggleCouponStatus = async (coupon: AdminCoupon) => {
    const current = String(coupon.status ?? 'active').toLowerCase();
    const nextStatus = current === 'active' ? 'inactive' : 'active';
    try {
      await updateCoupon.mutateAsync({ id: coupon.id, data: { status: nextStatus } });
      toast.success(nextStatus === 'active' ? 'Cupom ativado' : 'Cupom desativado');
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      toast.error('Erro ao atualizar cupom');
    }
  };

  const kpis = useMemo(
    () => [
      {
        title: 'Cupons Ativos',
        value: coupons.filter((c) => String(c.status ?? '').toLowerCase() === 'active').length,
        icon: Ticket,
        color: 'text-primary',
      },
      {
        title: 'Indicadores Ativos',
        value: referrers.length,
        icon: Users,
        color: 'text-success',
      },
      {
        title: 'Comissões Pendentes',
        value: `R$ ${referrers
          .reduce((s, r) => s + (r.pendingCommission ?? (r as any).comissaoPendente ?? 0), 0)
          .toLocaleString('pt-BR')}`,
        icon: DollarSign,
        color: 'text-warning',
      },
      {
        title: 'Total Indicações',
        value: usages.length,
        icon: TrendingUp,
        color: 'text-chart-3',
      },
    ],
    [coupons, referrers, usages.length],
  );

  const usageCountByCoupon = useMemo(() => {
    return usages.reduce<Record<string, number>>((acc, u) => {
      const code = String((u as any).coupon ?? '').trim().toUpperCase();
      if (!code) return acc;
      acc[code] = (acc[code] ?? 0) + 1;
      return acc;
    }, {});
  }, [usages]);

  const referrerByCode = useMemo(() => {
    return referrers.reduce<Record<string, AdminReferrer>>((acc, r) => {
      const code = String((r as any).code ?? (r as any).codigo ?? '').trim().toUpperCase();
      if (!code) return acc;
      acc[code] = r;
      return acc;
    }, {});
  }, [referrers]);

  if (couponsQuery.isPending || referrersQuery.isPending || usagesQuery.isPending) {
    return <PageSkeleton cards={4} lines={12} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Indicação & Cupons
          </h1>
          <p className="text-muted-foreground">
            Gerencie cupons de desconto e programa de indicação
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}</DialogTitle>
              <DialogDescription>
                {editingCoupon
                  ? 'Atualize os dados do cupom selecionado.'
                  : 'Crie um cupom de desconto ou de indicação para compartilhar com seus clientes.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Código do Cupom</Label>
                <Input placeholder="Ex: AGRO2024" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'discount' | 'referral')}
                >
                  <option value="discount">Desconto (%)</option>
                  <option value="referral">Indicação (com comissão)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Valor do Desconto (%)</Label>
                <Input type="number" placeholder="10" value={String(newValue)} onChange={(e) => setNewValue(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Limite de Uso (vazio = ilimitado)</Label>
                <Input type="number" placeholder="100" value={newMaxUsage === '' ? '' : String(newMaxUsage)} onChange={(e) => setNewMaxUsage(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              {newType === 'referral' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Indicador</Label>
                    <Input placeholder="Ex: João Silva" value={newReferrerName} onChange={(e) => setNewReferrerName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>CPF/CNPJ</Label>
                      <Input placeholder="Ex: 123.456.789-00" value={newReferrerCpfCnpj} onChange={(e) => setNewReferrerCpfCnpj(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input placeholder="Ex: (11) 99999-9999" value={newReferrerPhone} onChange={(e) => setNewReferrerPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Comissão (%)</Label>
                    <Input type="number" placeholder="15" value={String(newCommission)} onChange={(e) => setNewCommission(Number(e.target.value))} />
                  </div>
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => {
                  void handleSaveCoupon();
                }}
              >
                {editingCoupon ? 'Salvar Alterações' : 'Criar Cupom'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cupons de Desconto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons
                .filter((coupon) => {
                  const term = searchTerm.trim().toLowerCase();
                  if (!term) return true;
                  const code = (coupon.code ?? coupon.codigo ?? '').toLowerCase();
                  const type = (coupon.type ?? coupon.tipo ?? '').toLowerCase();
                  return code.includes(term) || type.includes(term);
                })
                .map((coupon) => {
                  const code = String(coupon.code ?? coupon.codigo ?? '').trim().toUpperCase();
                  const referrer = referrerByCode[code];
                  const status = String(coupon.status ?? 'active').toLowerCase();
                  const isActive = status === 'active';
                  return (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold">{coupon.code ?? coupon.codigo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(coupon.type ?? coupon.tipo) === 'discount' ? 'Desconto' : 'Indicação'}
                    </Badge>
                  </TableCell>
                  <TableCell>{coupon.value ?? coupon.valor}%</TableCell>
                  <TableCell>
                    {(coupon.usageCount ?? coupon.quantidadeUso ?? usageCountByCoupon[String(coupon.code ?? coupon.codigo ?? '').toUpperCase()] ?? 0)}/{coupon.maxUsage ?? coupon.maxUso ?? '∞'}
                  </TableCell>
                  <TableCell>
                    {(coupon.commission ?? coupon.comissao ?? 0) > 0 ? `${coupon.commission ?? coupon.comissao}%` : '-'}
                  </TableCell>
                  <TableCell>
                    {referrer ? (
                      <div className="text-sm">
                        <div className="font-medium">{referrer.name ?? referrer.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {[referrer.cpfCnpj, referrer.telefone].filter(Boolean).join(' • ') || '-'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isActive ? (
                      <Badge className="bg-success/10 text-success">Ativo</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCoupon(coupon);
                          setDialogOpen(true);
                          setNewCode(String(coupon.code ?? coupon.codigo ?? ''));
                          setNewType((coupon.type ?? coupon.tipo ?? 'discount') as 'discount' | 'referral');
                          setNewValue(Number(coupon.value ?? coupon.valor ?? 0));
                          setNewMaxUsage(
                            coupon.maxUsage !== undefined && coupon.maxUsage !== null
                              ? coupon.maxUsage
                              : coupon.maxUso !== undefined && coupon.maxUso !== null
                                ? coupon.maxUso
                                : ''
                          );
                          setNewCommission(Number(coupon.commission ?? coupon.comissao ?? 0));
                          setNewReferrerName(referrer?.name ?? referrer?.nome ?? '');
                          setNewReferrerCpfCnpj(referrer?.cpfCnpj ?? '');
                          setNewReferrerPhone(referrer?.telefone ?? '');
                        }}
                        title="Editar cupom"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void toggleCouponStatus(coupon)}
                        title={isActive ? 'Desativar cupom' : 'Ativar cupom'}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyToClipboard(String(coupon.code ?? coupon.codigo ?? ''))}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Referrers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Indicadores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Indicações</TableHead>
                <TableHead>Comissão Total</TableHead>
                <TableHead>Pendente</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrers.map((referrer) => (
                <TableRow key={referrer.id}>
                  <TableCell className="font-medium">{referrer.name ?? referrer.nome}</TableCell>
                  <TableCell className="font-mono">{referrer.code ?? referrer.codigo}</TableCell>
                  <TableCell className="font-mono">{referrer.cpfCnpj || '-'}</TableCell>
                  <TableCell className="font-mono">{referrer.telefone || '-'}</TableCell>
                  <TableCell>{referrer.referrals ?? referrer.indicacoes}</TableCell>
                  <TableCell className="text-success font-medium">
                    R$ {(referrer.totalCommission ?? referrer.comissaoTotal ?? 0).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-warning font-medium">
                    R$ {(referrer.pendingCommission ?? referrer.comissaoPendente ?? 0).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-success/10 text-success">Ativo</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Coupon Usages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usos de Cupons</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cupom</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Data do Pagamento</TableHead>
                <TableHead>Comissão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usages.map((u, idx) => (
                <TableRow key={`${u.coupon}-${u.cpfCnpj}-${idx}`}>
                  <TableCell className="font-mono font-bold">{u.coupon}</TableCell>
                  <TableCell className="font-mono">{u.cpfCnpj}</TableCell>
                  <TableCell>
                    {u.paidAt ? new Date(u.paidAt).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    {u.paidAt ? (
                      <Badge className="bg-success/10 text-success">Liberada</Badge>
                    ) : (
                      <Badge className="bg-warning/10 text-warning">Pendente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
