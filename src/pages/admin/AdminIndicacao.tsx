import React, { useState } from 'react';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const mockCoupons = [
  {
    id: '1',
    code: 'AGRO2024',
    type: 'discount',
    value: 20,
    usageCount: 45,
    maxUsage: 100,
    commission: 0,
    createdBy: 'Admin',
    status: 'active',
  },
  {
    id: '2',
    code: 'PARCEIRO10',
    type: 'referral',
    value: 10,
    usageCount: 23,
    maxUsage: null,
    commission: 15,
    createdBy: 'João Silva',
    status: 'active',
  },
  {
    id: '3',
    code: 'PRIMEIROMES',
    type: 'discount',
    value: 100,
    usageCount: 12,
    maxUsage: 50,
    commission: 0,
    createdBy: 'Admin',
    status: 'active',
  },
];

const mockReferrers = [
  {
    id: '1',
    name: 'João Silva',
    code: 'JOAO2024',
    referrals: 15,
    totalCommission: 1250.00,
    pendingCommission: 350.00,
    status: 'active',
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    code: 'MARIA2024',
    referrals: 8,
    totalCommission: 680.00,
    pendingCommission: 120.00,
    status: 'active',
  },
];

export default function AdminIndicacao() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Cupom copiado!');
  };

  const kpis = [
    {
      title: 'Cupons Ativos',
      value: mockCoupons.filter(c => c.status === 'active').length,
      icon: Ticket,
      color: 'text-primary',
    },
    {
      title: 'Indicadores Ativos',
      value: mockReferrers.length,
      icon: Users,
      color: 'text-success',
    },
    {
      title: 'Comissões Pendentes',
      value: `R$ ${mockReferrers.reduce((s, r) => s + r.pendingCommission, 0).toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'text-warning',
    },
    {
      title: 'Total Indicações',
      value: mockReferrers.reduce((s, r) => s + r.referrals, 0),
      icon: TrendingUp,
      color: 'text-chart-3',
    },
  ];

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
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Código do Cupom</Label>
                <Input placeholder="Ex: AGRO2024" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2">
                  <option value="discount">Desconto (%)</option>
                  <option value="referral">Indicação (com comissão)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Valor do Desconto (%)</Label>
                <Input type="number" placeholder="10" />
              </div>
              <div className="space-y-2">
                <Label>Limite de Uso (vazio = ilimitado)</Label>
                <Input type="number" placeholder="100" />
              </div>
              <Button className="w-full" onClick={() => {
                toast.success('Cupom criado com sucesso!');
                setDialogOpen(false);
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
              {mockCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {coupon.type === 'discount' ? 'Desconto' : 'Indicação'}
                    </Badge>
                  </TableCell>
                  <TableCell>{coupon.value}%</TableCell>
                  <TableCell>
                    {coupon.usageCount}/{coupon.maxUsage || '∞'}
                  </TableCell>
                  <TableCell>
                    {coupon.commission > 0 ? `${coupon.commission}%` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-success/10 text-success">Ativo</Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(coupon.code)}
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
              {mockReferrers.map((referrer) => (
                <TableRow key={referrer.id}>
                  <TableCell className="font-medium">{referrer.name}</TableCell>
                  <TableCell className="font-mono">{referrer.code}</TableCell>
                  <TableCell>{referrer.referrals}</TableCell>
                  <TableCell className="text-success font-medium">
                    R$ {referrer.totalCommission.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-warning font-medium">
                    R$ {referrer.pendingCommission.toLocaleString('pt-BR')}
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
    </div>
  );
}
