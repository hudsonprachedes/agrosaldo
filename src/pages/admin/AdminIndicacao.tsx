import React, { useEffect, useState } from 'react';
import {
  Ticket,
  Users,
  DollarSign,
  Copy,
  Plus,
  Search,
  TrendingUp,
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
import { adminService, AdminCoupon, AdminCouponUsage, AdminReferrer } from '@/services/api.service';

export default function AdminIndicacao() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [referrers, setReferrers] = useState<AdminReferrer[]>([]);
  const [usages, setUsages] = useState<AdminCouponUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'discount' | 'referral'>('discount');
  const [newValue, setNewValue] = useState<number>(10);
  const [newMaxUsage, setNewMaxUsage] = useState<number | ''>('');
  const [newCommission, setNewCommission] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, r, u] = await Promise.all([
          adminService.listCoupons(),
          adminService.listReferrers(),
          adminService.listCouponUsages(),
        ]);
        setCoupons(c);
        setReferrers(r);
        setUsages(u);
      } catch (error) {
        console.error('Erro ao carregar indicação:', error);
        toast.error('Erro ao carregar indicação');
        setCoupons([]);
        setReferrers([]);
        setUsages([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Cupom copiado!');
  };

  const handleCreateCoupon = async () => {
    if (!newCode.trim()) {
      toast.error('Informe o código do cupom');
      return;
    }

    try {
      const created = await adminService.createCoupon({
        code: newCode.trim().toUpperCase(),
        type: newType,
        value: Number(newValue),
        maxUsage: newMaxUsage === '' ? null : Number(newMaxUsage),
        commission: newType === 'referral' ? Number(newCommission) : 0,
        status: 'active',
      });
      setCoupons([created, ...coupons]);
      toast.success('Cupom criado com sucesso!');
      setDialogOpen(false);
      setNewCode('');
      setNewType('discount');
      setNewValue(10);
      setNewMaxUsage('');
      setNewCommission(0);
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      toast.error('Erro ao criar cupom');
    }
  };

  const kpis = [
    {
      title: 'Cupons Ativos',
      value: coupons.filter(c => (c.status ?? '').toLowerCase() === 'active').length,
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
      value: `R$ ${referrers.reduce((s, r) => s + (r.pendingCommission ?? r.comissaoPendente ?? 0), 0).toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'text-warning',
    },
    {
      title: 'Total Indicações',
      value: usages.length,
      icon: TrendingUp,
      color: 'text-chart-3',
    },
  ];

  if (isLoading) {
    return <PageSkeleton cards={4} lines={12} />;
  }

  const usageCountByCoupon = usages.reduce<Record<string, number>>((acc, u) => {
    const code = String(u.coupon ?? '').trim().toUpperCase();
    if (!code) return acc;
    acc[code] = (acc[code] ?? 0) + 1;
    return acc;
  }, {});

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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Cupom</DialogTitle>
              <DialogDescription>
                Crie um cupom de desconto ou de indicação para compartilhar com seus clientes.
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
                <div className="space-y-2">
                  <Label>Comissão (%)</Label>
                  <Input type="number" placeholder="15" value={String(newCommission)} onChange={(e) => setNewCommission(Number(e.target.value))} />
                </div>
              )}
              <Button className="w-full" onClick={() => {
                void handleCreateCoupon();
              }}>
                Criar Cupom
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
                .map((coupon) => (
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
                    <Badge className="bg-success/10 text-success">Ativo</Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(String(coupon.code ?? coupon.codigo ?? ''))}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
