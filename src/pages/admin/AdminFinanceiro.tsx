import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Calendar,
  Upload,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FinancialPayment, PixConfig } from '@/services/api.service';
import { useAdminPayments, useAdminPixConfig } from '@/hooks/queries/admin/useAdminFinance';
import { useAdminUpdatePayment, useAdminUpdatePixConfig } from '@/hooks/mutations/admin/useAdminFinanceMutations';

export default function AdminFinanceiro() {
  const [selectedPayment, setSelectedPayment] = useState<FinancialPayment | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPixConfigDialog, setShowPixConfigDialog] = useState(false);

  const paymentsQuery = useAdminPayments();
  const pixConfigQuery = useAdminPixConfig();
  const updatePayment = useAdminUpdatePayment();
  const updatePixConfig = useAdminUpdatePixConfig();

  useEffect(() => {
    if (paymentsQuery.isError || pixConfigQuery.isError) {
      toast.error('Erro ao carregar dados financeiros');
    }
  }, [paymentsQuery.isError, pixConfigQuery.isError]);

  const payments = (paymentsQuery.data ?? []) as FinancialPayment[];
  const pixConfig = (pixConfigQuery.data ?? null) as PixConfig | null;

  const [pixKeyDraft, setPixKeyDraft] = useState<string | null>(null);
  const [pixKeyTypeDraft, setPixKeyTypeDraft] = useState<string | null>(null);
  const [qrCodeImageDraft, setQrCodeImageDraft] = useState<string | undefined | null>(null);

  const pixKey = pixKeyDraft ?? pixConfig?.pixKey ?? '';
  const pixKeyType = pixKeyTypeDraft ?? pixConfig?.pixKeyType ?? 'cpf';
  const qrCodeImage = (qrCodeImageDraft ?? pixConfig?.qrCodeImage ?? undefined) as string | undefined;

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'bank_slip' | 'cash'>('pix');

  // KPIs
  const mrr = payments
    .filter(p => p.status === 'paid' && p.paymentFrequency === 'monthly')
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueCount = payments.filter(p => p.status === 'overdue').length;
  const overdueAmount = payments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const paidThisMonth = payments
    .filter(p => p.status === 'paid' && p.paidAt && new Date(p.paidAt).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaymentsCount = payments.length;
  const paidCount = payments.filter((p) => p.status === 'paid').length;
  const conversionRate = totalPaymentsCount > 0 ? (paidCount / totalPaymentsCount) * 100 : 0;

  const openPaymentDialog = (payment: FinancialPayment) => {
    setSelectedPayment(payment);
    setShowPaymentDialog(true);
  };

  const handleMarkAsPending = (paymentId: string) => {
    const current = payments.find((p) => p.id === paymentId);
    if (!current) return;

    void (async () => {
      try {
        await updatePayment.mutateAsync({
          id: paymentId,
          data: {
            ...current,
            status: 'pending',
            paidAt: null,
          },
        });
        toast.success('Pagamento revertido para pendente');
      } catch (error) {
        console.error('Erro ao reverter pagamento:', error);
        toast.error('Erro ao reverter pagamento');
      }
    })();
  };

  const handlePaymentConfirmation = async () => {
    if (!selectedPayment) return;

    try {
      const paidAt = new Date().toISOString();
      await updatePayment.mutateAsync({
        id: selectedPayment.id,
        data: {
          ...selectedPayment,
          status: 'paid',
          paidAt,
        },
      });

      setShowPaymentDialog(false);
      toast.success(`Recebimento de ${selectedPayment.tenantName} registrado com sucesso`);
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
    }
  };

  const handlePixConfigSave = async () => {
    try {
      await updatePixConfig.mutateAsync({
        pixKey,
        pixKeyType: pixKeyType as 'cpf' | 'cnpj' | 'email' | 'phone' | 'random',
        qrCodeImage,
        active: pixConfig?.active ?? true,
      } as Partial<PixConfig>);

      setShowPixConfigDialog(false);
      setPixKeyDraft(null);
      setPixKeyTypeDraft(null);
      setQrCodeImageDraft(null);
      toast.success('Configuração do PIX atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configuração PIX:', error);
      toast.error('Erro ao salvar configuração do PIX');
    }
  };

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodeImageDraft(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'pix': return <Smartphone className="w-4 h-4" />;
      case 'credit_card':
      case 'debit_card': return <CreditCard className="w-4 h-4" />;
      case 'bank_slip': return <Banknote className="w-4 h-4" />;
      case 'cash': return <DollarSign className="w-4 h-4" />;
      default: return null;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      bank_slip: 'Boleto',
      cash: 'Dinheiro',
    };
    return labels[method] || method;
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      semiannual: 'Semestral',
      annual: 'Anual',
    };
    return labels[freq] || freq;
  };

  if (paymentsQuery.isPending || pixConfigQuery.isPending) {
    return <div className="flex items-center justify-center h-screen">Carregando dados financeiros...</div>;
  }

  return (
    <div className="space-y-6 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Financeiro</h1>
            <p className="text-gray-600">
              Gestão de recebimentos e inadimplência
            </p>
          </div>

          <Button onClick={() => setShowPixConfigDialog(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar PIX
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">MRR</CardTitle>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Receita recorrente mensal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Recebido no Mês</CardTitle>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                R$ {paidThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Pagamentos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Em Atraso</CardTitle>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{overdueCount}</div>
              <p className="text-sm text-gray-500 mt-1">
                R$ {overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conversão</CardTitle>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</div>
              <p className="text-sm text-gray-500 mt-1">—</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Clientes Ativos</TabsTrigger>
            <TabsTrigger value="overdue">Em Atraso</TabsTrigger>
            <TabsTrigger value="all">Todos os Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Ativos</CardTitle>
                <CardDescription>
                  Gestão de recebimentos por cliente (CPF/CNPJ) com pagamentos em dia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Periodicidade</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments
                      .filter(p => p.status === 'paid' || p.status === 'pending')
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.tenantName}</TableCell>
                          <TableCell className="font-mono text-xs">{payment.tenantId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.plan?.toUpperCase?.() ?? '—'}</Badge>
                          </TableCell>
                          <TableCell>
                            R$ {Number(payment.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{getFrequencyLabel(payment.paymentFrequency)}</TableCell>
                          <TableCell>
                            {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {payment.status === 'paid' && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Pago
                              </Badge>
                            )}
                            {payment.status === 'pending' && (
                              <Badge className="bg-orange-100 text-orange-800">
                                <Calendar className="w-3 h-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => openPaymentDialog(payment)}
                              >
                                Registrar Pagamento
                              </Button>
                            )}
                            {payment.status === 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPending(payment.id)}
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                Marcar como pendente
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Pagamentos em Atraso
                </CardTitle>
                <CardDescription>
                  Clientes (CPF/CNPJ) com faturas vencidas que precisam de atenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Dias em Atraso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments
                      .filter(p => p.status === 'overdue')
                      .map((payment) => {
                        const daysOverdue = Math.floor(
                          (new Date().getTime() - new Date(payment.dueDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        return (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.tenantName}</TableCell>
                            <TableCell className="font-mono text-xs">{payment.tenantId}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{payment.plan?.toUpperCase?.() ?? '—'}</Badge>
                            </TableCell>
                            <TableCell className="text-red-600 font-semibold">
                              R$ {Number(payment.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">{daysOverdue} dias</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openPaymentDialog(payment)}
                              >
                                Regularizar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Histórico Completo</CardTitle>
                <CardDescription>
                  Todos os pagamentos registrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString('pt-BR')
                            : new Date(payment.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium">{payment.tenantName}</TableCell>
                        <TableCell className="font-mono text-xs">{payment.tenantId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.plan?.toUpperCase?.() ?? '—'}</Badge>
                        </TableCell>
                        <TableCell>
                          R$ {Number(payment.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(payment.paymentMethod)}
                            {getPaymentMethodLabel(payment.paymentMethod)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.status === 'paid' && (
                            <Badge className="bg-green-100 text-green-800">Pago</Badge>
                          )}
                          {payment.status === 'pending' && (
                            <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>
                          )}
                          {payment.status === 'overdue' && (
                            <Badge className="bg-red-100 text-red-800">Atrasado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.status === 'paid' ? (
                            <Button size="sm" variant="outline" onClick={() => handleMarkAsPending(payment.id)}>
                              <Calendar className="w-3 h-3 mr-1" />
                              Marcar como pendente
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => openPaymentDialog(payment)}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Confirmar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Registro de Pagamento */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogDescription>
                Confirme o recebimento de {selectedPayment?.tenantName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cliente:</span>
                  <span className="font-semibold">{selectedPayment?.tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plano:</span>
                  <Badge variant="outline">{selectedPayment?.plan?.toUpperCase?.() ?? '—'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className="text-lg font-bold text-green-600">
                    R$ {Number(selectedPayment?.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={(value: 'pix' | 'credit_card' | 'debit_card' | 'bank_slip' | 'cash') => setPaymentMethod(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        PIX
                      </div>
                    </SelectItem>
                    <SelectItem value="credit_card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cartão de Crédito
                      </div>
                    </SelectItem>
                    <SelectItem value="debit_card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cartão de Débito
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_slip">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        Boleto
                      </div>
                    </SelectItem>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Dinheiro
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePaymentConfirmation}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Recebimento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Configuração PIX */}
        <Dialog open={showPixConfigDialog} onOpenChange={setShowPixConfigDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Dados PIX</DialogTitle>
              <DialogDescription>
                Configure a chave PIX e QR Code para recebimentos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="pixKeyType">Tipo de Chave</Label>
                <Select
                  value={pixKeyType}
                  onValueChange={(value: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random') =>
                    setPixKeyTypeDraft(value)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="random">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pixKey">Chave PIX</Label>
                <Input
                  id="pixKey"
                  value={pixKey}
                  onChange={(e) => setPixKeyDraft(e.target.value)}
                  className="mt-2"
                  placeholder="Digite a chave PIX"
                />
              </div>

              <div>
                <Label htmlFor="qrCode">QR Code PIX</Label>
                <div className="mt-2 space-y-2">
                  <Input
                    id="qrCode"
                    type="file"
                    accept="image/*"
                    onChange={handleQrCodeUpload}
                  />
                  {qrCodeImage && (
                    <div className="border rounded-lg p-4 flex justify-center">
                      <img
                        src={qrCodeImage}
                        alt="QR Code PIX"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Faça upload da imagem do QR Code gerado pelo seu banco
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPixConfigDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePixConfigSave}>
                <Upload className="w-4 h-4 mr-2" />
                Salvar Configuração
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
