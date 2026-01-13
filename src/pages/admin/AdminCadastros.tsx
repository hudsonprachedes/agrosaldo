import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { UserPlus, CheckCircle, XCircle, Eye, Calendar } from 'lucide-react';
import { PendingSignup } from '@/mocks/mock-admin';
import { toast } from '@/hooks/use-toast';

export default function AdminCadastros() {
  const [signups, setSignups] = useState<PendingSignup[]>([]);
  const [selectedSignup, setSelectedSignup] = useState<PendingSignup | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [trialDays, setTrialDays] = useState(30);
  const [trialPlan, setTrialPlan] = useState<'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao'>('porteira');

  useEffect(() => {
    loadSignups();
  }, []);

  const loadSignups = () => {
    const pending = JSON.parse(localStorage.getItem('agrosaldo_pending_signups') || '[]');
    setSignups(pending);
  };

  const handleApprove = () => {
    if (!selectedSignup) return;

    const updated = signups.map(s =>
      s.id === selectedSignup.id
        ? {
            ...s,
            status: 'approved' as const,
            approvedAt: new Date().toISOString(),
            approvedBy: 'Admin Master',
            trialDays,
            trialPlan,
          }
        : s
    );

    localStorage.setItem('agrosaldo_pending_signups', JSON.stringify(updated));
    setSignups(updated);
    setShowApprovalDialog(false);
    setSelectedSignup(null);

    toast({
      title: 'Cadastro Aprovado',
      description: `${selectedSignup.nome} foi aprovado com ${trialDays} dias de teste no plano ${trialPlan.toUpperCase()}.`,
    });
  };

  const handleReject = (signup: PendingSignup) => {
    const updated = signups.map(s =>
      s.id === signup.id
        ? { ...s, status: 'rejected' as const }
        : s
    );

    localStorage.setItem('agrosaldo_pending_signups', JSON.stringify(updated));
    setSignups(updated);

    toast({
      title: 'Cadastro Rejeitado',
      description: `O cadastro de ${signup.nome} foi rejeitado.`,
      variant: 'destructive',
    });
  };

  const openApprovalDialog = (signup: PendingSignup) => {
    setSelectedSignup(signup);
    // Sugere plano baseado no número de cabeças
    if (signup.numeroCabecas <= 500) setTrialPlan('porteira');
    else if (signup.numeroCabecas <= 1500) setTrialPlan('piquete');
    else if (signup.numeroCabecas <= 3000) setTrialPlan('retiro');
    else if (signup.numeroCabecas <= 6000) setTrialPlan('estancia');
    else setTrialPlan('barao');
    
    setShowApprovalDialog(true);
  };

  const pendingCount = signups.filter(s => s.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Cadastros</h1>
          <p className="text-gray-600">
            Aprovar ou rejeitar solicitações de novos cadastros
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {signups.filter(s => s.status === 'approved').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Rejeitados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {signups.filter(s => s.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Solicitações de Cadastro
            </CardTitle>
            <CardDescription>
              Lista de todas as solicitações recebidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {signups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nenhuma solicitação de cadastro encontrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cabeças</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signups.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell className="font-medium">{signup.nome}</TableCell>
                      <TableCell>{signup.cpfCnpj}</TableCell>
                      <TableCell>{signup.email}</TableCell>
                      <TableCell>{signup.numeroCabecas}</TableCell>
                      <TableCell>{signup.uf}</TableCell>
                      <TableCell>
                        {new Date(signup.requestDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {signup.status === 'pending' && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            Pendente
                          </Badge>
                        )}
                        {signup.status === 'approved' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Aprovado
                          </Badge>
                        )}
                        {signup.status === 'rejected' && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Rejeitado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSignup(signup);
                              // Mostrar detalhes (você pode criar outro dialog)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {signup.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => openApprovalDialog(signup)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleReject(signup)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Aprovação */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Cadastro</DialogTitle>
              <DialogDescription>
                Configure o período de teste e o plano para {selectedSignup?.nome}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="trialDays" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dias de Teste Gratuito
                </Label>
                <Input
                  id="trialDays"
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(parseInt(e.target.value))}
                  min="7"
                  max="90"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Recomendado: 30 dias
                </p>
              </div>

              <div>
                <Label htmlFor="trialPlan">Plano do Período de Teste</Label>
                <Select value={trialPlan} onValueChange={(value: any) => setTrialPlan(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porteira">Porteira (até 500 cabeças)</SelectItem>
                    <SelectItem value="piquete">Piquete (até 1500 cabeças)</SelectItem>
                    <SelectItem value="retiro">Retiro (até 3000 cabeças)</SelectItem>
                    <SelectItem value="estancia">Estância (até 6000 cabeças)</SelectItem>
                    <SelectItem value="barao">Barão (ilimitado)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Sugestão baseada em {selectedSignup?.numeroCabecas} cabeças declaradas
                </p>
              </div>

              {selectedSignup && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Resumo do Cadastro</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Nome:</strong> {selectedSignup.nome}</p>
                    <p><strong>Email:</strong> {selectedSignup.email}</p>
                    <p><strong>Celular:</strong> {selectedSignup.celular}</p>
                    <p><strong>Localização:</strong> {selectedSignup.municipio}/{selectedSignup.uf}</p>
                    <p><strong>Cabeças:</strong> {selectedSignup.numeroCabecas}</p>
                    {selectedSignup.cupomIndicacao && (
                      <p><strong>Cupom:</strong> {selectedSignup.cupomIndicacao}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleApprove}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar Cadastro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
