import React, { useState, useEffect } from 'react';
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
import { UserPlus, CheckCircle, XCircle, Eye, Calendar, Trash2 } from 'lucide-react';
import { adminService } from '@/services/api.service';
import { toast } from 'sonner';

interface PendingSignup {
  id: string;
  nome: string;
  cpfCnpj: string;
  email: string;
  celular: string;
  numeroCabecas: number;
  municipio: string;
  uf: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  cupomIndicacao?: string;
  solicitacaoId?: string;
}

type SignupRequestUi = {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  plan: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  propertyName?: string;
  notes?: string;
};

export default function AdminCadastros() {
  const [signups, setSignups] = useState<PendingSignup[]>([]);
  const [selectedSignup, setSelectedSignup] = useState<PendingSignup | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trialDays, setTrialDays] = useState(30);
  const [trialPlan, setTrialPlan] = useState<'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao'>('porteira');

  useEffect(() => {
    const loadSignups = async () => {
      try {
        const rows = (await adminService.getRequests()) as unknown as SignupRequestUi[];
        const signupsOnly = rows.filter((r) => String(r.type ?? '').toLowerCase() === 'signup');

        const mapped: PendingSignup[] = signupsOnly.map((r) => {
          const city = '';
          let state = '';
          let cattleCount = 0;
          let referralCoupon: string | undefined;

          if (r.notes) {
            try {
              const parsed = JSON.parse(r.notes) as any;
              state = typeof parsed?.state === 'string' ? parsed.state : '';
              cattleCount = typeof parsed?.cattleCount === 'number' ? parsed.cattleCount : 0;
              referralCoupon = typeof parsed?.referralCoupon === 'string' ? parsed.referralCoupon : undefined;
            } catch {
              // ignore
            }
          }

          return {
            id: r.cpfCnpj,
            solicitacaoId: r.id,
            nome: r.name,
            cpfCnpj: r.cpfCnpj,
            email: r.email,
            celular: r.phone ?? '',
            numeroCabecas: cattleCount,
            municipio: city,
            uf: state,
            requestDate: r.submittedAt ?? new Date().toISOString(),
            status: r.status,
            cupomIndicacao: referralCoupon,
          };
        });

        setSignups(mapped);
      } catch (error) {
        console.error('Erro ao carregar cadastros:', error);
        toast.error('Erro ao carregar cadastros');
      } finally {
        setIsLoading(false);
      }
    };

    void loadSignups();
  }, []);

  const handleApprove = async () => {
    if (!selectedSignup) return;

    try {
      if (!selectedSignup.solicitacaoId) {
        toast.error('Solicitação inválida');
        return;
      }
      await adminService.approveRequest(selectedSignup.solicitacaoId, {
        trialDays,
        trialPlan,
      });
      const updated = signups.map(s =>
        s.id === selectedSignup.id
          ? { ...s, status: 'approved' as const }
          : s
      );
      setSignups(updated);
      setShowApprovalDialog(false);
      setSelectedSignup(null);
      toast.success(`${selectedSignup.nome} foi aprovado`);
    } catch (error) {
      console.error('Erro ao aprovar cadastro:', error);
      toast.error('Erro ao aprovar cadastro');
    }
  };

  const handleReject = async (signup: PendingSignup) => {
    try {
      if (!signup.solicitacaoId) {
        toast.error('Solicitação inválida');
        return;
      }
      await adminService.rejectRequest(signup.solicitacaoId, 'Rejeitado pelo Super Admin');
      const updated = signups.map(s =>
        s.id === signup.id
          ? { ...s, status: 'rejected' as const }
          : s
      );
      setSignups(updated);
      toast.success(`Cadastro de ${signup.nome} foi rejeitado`);
    } catch (error) {
      console.error('Erro ao rejeitar cadastro:', error);
      toast.error('Erro ao rejeitar cadastro');
    }
  };

  const handleDelete = async () => {
    if (!selectedSignup) return;

    try {
      if (!selectedSignup.solicitacaoId) {
        toast.error('Solicitação inválida');
        return;
      }

      // Verificar se o CPF/CNPJ está associado a algum cliente
      const tenants = await adminService.getTenants();
      const isClient = tenants.some(tenant => tenant.cpfCnpj === selectedSignup.cpfCnpj);
      
      if (isClient) {
        toast.error('Não é possível excluir este cadastro pois está associado a um cliente ativo');
        setShowDeleteDialog(false);
        setSelectedSignup(null);
        return;
      }

      await adminService.deleteRequest(selectedSignup.solicitacaoId);
      const updated = signups.filter(s => s.id !== selectedSignup.id);
      setSignups(updated);
      setShowDeleteDialog(false);
      setSelectedSignup(null);
      toast.success(`Cadastro de ${selectedSignup.nome} foi excluído`);
    } catch (error) {
      console.error('Erro ao excluir cadastro:', error);
      toast.error('Erro ao excluir cadastro');
    }
  };

  const openApprovalDialog = (signup: PendingSignup) => {
    setSelectedSignup(signup);
    // Sugere plano baseado no número de cabeças
    if (signup.numeroCabecas <= 500) setTrialPlan('porteira');
    else if (signup.numeroCabecas <= 1000) setTrialPlan('piquete');
    else if (signup.numeroCabecas <= 2000) setTrialPlan('retiro');
    else if (signup.numeroCabecas <= 3000) setTrialPlan('estancia');
    else setTrialPlan('barao');
    
    setShowApprovalDialog(true);
  };

  const pendingCount = signups.filter(s => s.status === 'pending').length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando cadastros...</div>;
  }

  return (
    <div className="space-y-6 p-6">
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
                    <TableHead>Celular</TableHead>
                    <TableHead>Cabeças</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead>Cupom</TableHead>
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
                      <TableCell>{signup.celular}</TableCell>
                      <TableCell>{signup.numeroCabecas}</TableCell>
                      <TableCell>{signup.uf || '-'}</TableCell>
                      <TableCell>{signup.cupomIndicacao ? 'Sim' : 'Não'}</TableCell>
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
                              setShowDetailsDialog(true);
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
                          {signup.status === 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedSignup(signup);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
                <Select value={trialPlan} onValueChange={(value: 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao') => setTrialPlan(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porteira">Porteira (até 500 cabeças)</SelectItem>
                    <SelectItem value="piquete">Piquete (até 1000 cabeças)</SelectItem>
                    <SelectItem value="retiro">Retiro (até 2000 cabeças)</SelectItem>
                    <SelectItem value="estancia">Estância (até 3000 cabeças)</SelectItem>
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
                    <p><strong>Localização:</strong> {selectedSignup.uf || '-'}</p>
                    <p><strong>Cabeças:</strong> {selectedSignup.numeroCabecas}</p>
                    <p><strong>Cupom de indicação:</strong> {selectedSignup.cupomIndicacao || 'Não'}</p>
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

        {/* Dialog de Detalhes */}
        <Dialog
          open={showDetailsDialog}
          onOpenChange={(open) => {
            setShowDetailsDialog(open);
            if (!open) {
              setSelectedSignup(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do cadastro</DialogTitle>
              <DialogDescription>
                Visualize todos os dados informados pelo produtor.
              </DialogDescription>
            </DialogHeader>

            {selectedSignup ? (
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedSignup.nome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                    <p className="font-medium">{selectedSignup.cpfCnpj}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedSignup.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Celular</p>
                    <p className="font-medium">{selectedSignup.celular || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">UF</p>
                    <p className="font-medium">{selectedSignup.uf || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cabeças declaradas</p>
                    <p className="font-medium">{selectedSignup.numeroCabecas}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data da solicitação</p>
                    <p className="font-medium">{new Date(selectedSignup.requestDate).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                {selectedSignup.cupomIndicacao && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cupom de indicação</p>
                    <p className="font-medium">{selectedSignup.cupomIndicacao}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-sm text-muted-foreground">Nenhum cadastro selecionado.</div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Fechar
              </Button>
              {selectedSignup?.status === 'pending' && (
                <Button
                  onClick={() => {
                    if (!selectedSignup) return;
                    setShowDetailsDialog(false);
                    openApprovalDialog(selectedSignup);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Cadastro Rejeitado</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir permanentemente o cadastro de {selectedSignup?.nome}?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            {selectedSignup && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Dados do Cadastro</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Nome:</strong> {selectedSignup.nome}</p>
                  <p><strong>CPF/CNPJ:</strong> {selectedSignup.cpfCnpj}</p>
                  <p><strong>Email:</strong> {selectedSignup.email}</p>
                  <p><strong>Celular:</strong> {selectedSignup.celular}</p>
                  <p><strong>Localização:</strong> {selectedSignup.uf || '-'}</p>
                  <p><strong>Cabeças:</strong> {selectedSignup.numeroCabecas}</p>
                  <p><strong>Cupom de indicação:</strong> {selectedSignup.cupomIndicacao || 'Não'}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Cadastro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
