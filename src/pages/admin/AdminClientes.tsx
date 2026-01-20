import React, { useState, useEffect } from 'react';
import { adminService, AuditLog, User } from '@/services/api.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  MoreHorizontal,
  User as UserIcon,
  Lock,
  Unlock,
  UserCheck,
  CreditCard,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  History,
  Save,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { validateCpfCnpj } from '@/lib/document-validation';
import PageSkeleton from '@/components/PageSkeleton';

interface ActionLog {
  timestamp: Date;
  action: string;
  adminUser: string;
  details: string;
}

export default function AdminClientes() {
  const navigate = useNavigate();
  const { startImpersonation } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantsData, setTenantsData] = useState<User[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs state
  const [changePlanDialog, setChangePlanDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [blockDialog, setBlockDialog] = useState(false);
  const [impersonateDialog, setImpersonateDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [resetOnboardingDialog, setResetOnboardingDialog] = useState(false);

  // Form state
  const [newPlan, setNewPlan] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [editCpfCnpj, setEditCpfCnpj] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [resetOnboardingPropertyId, setResetOnboardingPropertyId] = useState<string>('');

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const tenants = await adminService.getTenants();
        setTenantsData(tenants);
      } catch (error) {
        console.error('Erro ao carregar tenants:', error);
        toast.error('Erro ao carregar clientes');
      } finally {
        setIsLoading(false);
      }
    };

    void loadTenants();
  }, []);

  if (isLoading) {
    return <PageSkeleton cards={0} lines={16} />;
  }
  
  const filteredTenants = tenantsData.filter((tenant) => {
    const term = searchTerm.trim();
    if (!term) return true;

    const termLower = term.toLowerCase();
    const termDigits = term.replace(/\D/g, '');
    const tenantDigits = tenant.cpfCnpj.replace(/\D/g, '');

    return (
      tenant.name.toLowerCase().includes(termLower) ||
      tenant.cpfCnpj.toLowerCase().includes(termLower) ||
      (termDigits.length > 0 && tenantDigits.includes(termDigits))
    );
  });

  const handleResetPassword = () => {
    if (!selectedTenant) return;

    void (async () => {
      try {
        const result = await adminService.resetUserPassword(selectedTenant.id);
        toast.success(`Senha resetada para ${selectedTenant.name}. Nova senha: ${result.tempPassword}`);
        setResetPasswordDialog(false);
        setSelectedTenant(null);
      } catch (error) {
        console.error('Erro ao resetar senha:', error);
        toast.error('Erro ao resetar senha');
      }
    })();
  };

  const handleToggleBlock = () => {
    if (!selectedTenant || !blockReason.trim()) {
      toast.error('Informe o motivo do bloqueio');
      return;
    }

    const isBlocking = selectedTenant.status !== 'suspenso';
    const nextStatus = isBlocking ? 'suspenso' : 'ativo';

    void (async () => {
      try {
        const updated = await adminService.updateUserStatus(selectedTenant.id, nextStatus, blockReason.trim());
        setTenantsData(tenantsData.map(t => (t.id === selectedTenant.id ? { ...t, status: updated.status } : t)));
        toast.success(isBlocking ? 'Cliente bloqueado' : 'Cliente desbloqueado');
        setBlockDialog(false);
        setBlockReason('');
        setSelectedTenant(null);
      } catch (error) {
        console.error('Erro ao alterar status do cliente:', error);
        toast.error('Erro ao alterar status do cliente');
      }
    })();
  };

  const handleImpersonate = () => {
    if (!selectedTenant) return;

    void (async () => {
      try {
        toast.info(`Acessando como ${selectedTenant.name}...`);
        const result = await adminService.impersonateUser(selectedTenant.id);
        await startImpersonation(result.token);
        setImpersonateDialog(false);
        setSelectedTenant(null);
        navigate('/selecionar-propriedade');
        toast.success(`Agora você está operando como ${selectedTenant.name}`);
      } catch (error) {
        console.error('Erro ao impersonar cliente:', error);
        toast.error('Erro ao acessar como cliente');
      }
    })();
  };

  const handleChangePlan = () => {
    if (!selectedTenant || !newPlan) {
      toast.error('Selecione um plano');
      return;
    }

    void (async () => {
      try {
        await adminService.updateUserPlan(selectedTenant.id, newPlan);
        toast.success(`Plano de ${selectedTenant.name} alterado para ${newPlan}`);
        setChangePlanDialog(false);
        setNewPlan('');
        setSelectedTenant(null);
      } catch (error) {
        console.error('Erro ao alterar plano:', error);
        toast.error('Erro ao alterar plano');
      }
    })();
  };

  const openChangePlanDialog = (tenant: User) => {
    setSelectedTenant(tenant);
    setNewPlan('');
    setChangePlanDialog(true);
  };

  const openResetPasswordDialog = (tenant: User) => {
    setSelectedTenant(tenant);
    setResetPasswordDialog(true);
  };

  const openBlockDialog = (tenant: User) => {
    setSelectedTenant(tenant);
    setBlockReason('');
    setBlockDialog(true);
  };

  const openImpersonateDialog = (tenant: User) => {
    setSelectedTenant(tenant);
    setImpersonateDialog(true);
  };

  const openHistoryDialog = (tenant: User) => {
    setSelectedTenant(tenant);
    setHistoryDialog(true);
    void (async () => {
      try {
        const resp = await adminService.getAuditLogs({ userId: tenant.id, limit: 100, offset: 0 });
        const mapped: ActionLog[] = resp.items.map((l: AuditLog) => ({
          timestamp: new Date(l.timestamp),
          action: l.action,
          adminUser: l.userName,
          details: l.details,
        }));
        setActionLogs(mapped);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        toast.error('Erro ao carregar histórico');
        setActionLogs([]);
      }
    })();
  };

  const openEditDialog = (tenant: User) => {
    setSelectedTenant(tenant);
    setEditCpfCnpj(tenant.cpfCnpj || '');
    setEditPhone(tenant.phone || '');
    setEditEmail(tenant.email || '');
    setEditDialog(true);
  };

  const openDetailsDialog = (tenant: User) => {
    setSelectedTenant(tenant);
    setDetailsDialog(true);
  };

  const openResetOnboardingDialog = (tenant: User) => {
    setSelectedTenant(tenant);
    const firstPropertyId =
      typeof tenant.properties?.[0]?.id === 'string' ? tenant.properties[0].id : '';
    setResetOnboardingPropertyId(firstPropertyId);
    setResetOnboardingDialog(true);
  };

  const handleResetOnboarding = () => {
    if (!selectedTenant) return;

    const propertyId = resetOnboardingPropertyId;
    if (!propertyId) {
      toast.error('Selecione a propriedade');
      return;
    }

    void (async () => {
      try {
        await adminService.resetOnboarding(selectedTenant.id, propertyId);
        setTenantsData(
          tenantsData.map((t) =>
            t.id === selectedTenant.id
              ? { ...t, onboardingCompletedAt: null }
              : t,
          ),
        );
        toast.success('Onboarding liberado para refazer');
        setResetOnboardingDialog(false);
        setSelectedTenant(null);
      } catch (error) {
        console.error('Erro ao resetar onboarding:', error);
        toast.error('Erro ao resetar onboarding');
      }
    })();
  };

  const handleSaveEdit = () => {
    if (!selectedTenant) return;

    if (!validateCpfCnpj(editCpfCnpj)) {
      toast.error('CPF/CNPJ inválido');
      return;
    }

    const phoneDigits = editPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast.error('Telefone inválido');
      return;
    }

    void (async () => {
      try {
        const updated = await adminService.updateUser(selectedTenant.id, {
          cpfCnpj: editCpfCnpj,
          phone: editPhone,
          email: editEmail,
        });

        setTenantsData(tenantsData.map((t) => (
          t.id === selectedTenant.id
            ? { ...t, cpfCnpj: updated.cpfCnpj, phone: updated.phone, email: updated.email }
            : t
        )));

        toast.success('Dados do cliente atualizados');
        setEditDialog(false);
        setSelectedTenant(null);
      } catch (error) {
        console.error('Erro ao atualizar dados do cliente:', error);
        toast.error('Erro ao atualizar dados do cliente');
      }
    })();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-success/10 text-success border-success/30">Ativo</Badge>;
      case 'suspenso':
        return <Badge className="bg-error/10 text-error border-error/30">Bloqueado</Badge>;
      case 'pendente_aprovacao':
        return <Badge className="bg-warning/10 text-warning border-warning/30">Pendente</Badge>;
      case 'rejeitado':
        return <Badge className="bg-muted text-muted-foreground border-border">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFinancialBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-success/10 text-success">Em dia</Badge>;
      case 'overdue':
        return <Badge className="bg-error/10 text-error">Inadimplente</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatLastLogin = (value?: string | null) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOnboardingBadge = (onboardingCompletedAt?: string | null) => {
    if (onboardingCompletedAt) {
      return <Badge className="bg-success/10 text-success border-success/30">Concluído</Badge>;
    }

    return <Badge className="bg-muted text-muted-foreground border-border">Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Clientes
          </h1>
          <p className="text-muted-foreground">
            {tenantsData.length} {tenantsData.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </p>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Cabeças</TableHead>
                <TableHead>Propriedades</TableHead>
                <TableHead className="hidden xl:table-cell">Papel</TableHead>
                <TableHead className="hidden lg:table-cell">Versão app</TableHead>
                <TableHead className="hidden lg:table-cell">Último login</TableHead>
                <TableHead className="hidden lg:table-cell">Financeiro</TableHead>
                <TableHead className="hidden lg:table-cell">Onboarding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.cpfCnpj}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {tenant.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                    {tenant.phone || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tenant.currentPlan ?? '-'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {typeof tenant.cattleCount === 'number' ? tenant.cattleCount : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {typeof tenant.propertyCount === 'number' ? tenant.propertyCount : (tenant.properties?.length ?? '-')}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Badge variant="outline">{tenant.role}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline">{tenant.appVersion ?? '-'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                    {formatLastLogin(tenant.lastLoginAt)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {tenant.financialStatus ? getFinancialBadge(tenant.financialStatus) : '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {getOnboardingBadge(tenant.onboardingCompletedAt)}
                  </TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetailsDialog(tenant)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openImpersonateDialog(tenant)}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Acessar como cliente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(tenant)}>
                          <UserIcon className="w-4 h-4 mr-2" />
                          Editar dados
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openChangePlanDialog(tenant)}>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Alterar Plano
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openResetPasswordDialog(tenant)}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resetar Senha
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openHistoryDialog(tenant)}>
                          <History className="w-4 h-4 mr-2" />
                          Histórico de Ações
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openResetOnboardingDialog(tenant)}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Refazer onboarding
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => openBlockDialog(tenant)}
                          className={tenant.status === 'suspenso' ? 'text-success' : 'text-error'}
                        >
                          {tenant.status === 'suspenso' ? (
                            <>
                              <Unlock className="w-4 h-4 mr-2" />
                              Desbloquear
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Bloquear
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Anti-fraud Alert */}
      <Card className="border-warning bg-warning/5">
        <CardContent className="p-4 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-warning shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Sistema Anti-Fraude Ativo</p>
            <p className="text-sm text-muted-foreground">
              O sistema soma automaticamente o total de cabeças por CPF/CNPJ e sugere o plano adequado.
              Clientes com mais cabeças que o plano permite são sinalizados.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Plan Dialog */}
      <Dialog open={changePlanDialog} onOpenChange={setChangePlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>
              Alterar plano de {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPlan">Novo Plano</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger id="newPlan">
                  <SelectValue placeholder="Selecione o novo plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porteira">Porteira - R$ 29,90 (até 500 cabeças)</SelectItem>
                  <SelectItem value="piquete">Piquete - R$ 69,90 (até 1500 cabeças)</SelectItem>
                  <SelectItem value="retiro">Retiro - R$ 129,90 (até 3000 cabeças)</SelectItem>
                  <SelectItem value="estancia">Estância - R$ 249,90 (até 6000 cabeças)</SelectItem>
                  <SelectItem value="barao">Barão - R$ 399,90 (Ilimitado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePlan}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Onboarding Dialog */}
      <Dialog open={resetOnboardingDialog} onOpenChange={setResetOnboardingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refazer onboarding</DialogTitle>
            <DialogDescription>
              Isso vai desconsiderar o onboarding atual e zerar o saldo oficial da propriedade para que o cliente preencha novamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={selectedTenant?.name ?? ''} disabled />
            </div>

            <div className="space-y-2">
              <Label>Propriedade</Label>
              <Select value={resetOnboardingPropertyId} onValueChange={setResetOnboardingPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a propriedade" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedTenant?.properties ?? []).map((p: any) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>
                      {String(p.nome ?? p.name ?? 'Propriedade')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOnboardingDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleResetOnboarding}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja resetar a senha de {selectedTenant?.name}? 
              Uma senha temporária será gerada e exibida na tela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>
              Resetar Senha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block/Unblock Dialog */}
      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTenant?.status === 'suspenso' ? 'Desbloquear' : 'Bloquear'} Cliente
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.status === 'suspenso' 
                ? `Informe o motivo do desbloqueio de ${selectedTenant?.name}`
                : `Informe o motivo do bloqueio de ${selectedTenant?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blockReason">Motivo *</Label>
              <Textarea
                id="blockReason"
                placeholder="Descreva o motivo..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleToggleBlock}
              variant={selectedTenant?.status === 'suspenso' ? 'default' : 'destructive'}
            >
              {selectedTenant?.status === 'suspenso' ? (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Desbloquear
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Bloquear
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonate Dialog */}
      <AlertDialog open={impersonateDialog} onOpenChange={setImpersonateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acessar como Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a acessar o sistema como {selectedTenant?.name}. 
              Todas as ações realizadas serão registradas no log de auditoria.
              <br /><br />
              <strong>ATENÇÃO:</strong> Use esta funcionalidade apenas para suporte técnico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImpersonate}>
              <UserCheck className="w-4 h-4 mr-2" />
              Confirmar Impersonate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Ações</DialogTitle>
            <DialogDescription>
              Ações administrativas realizadas para {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {actionLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma ação registrada
              </p>
            ) : (
              actionLogs.map((log, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {log.timestamp.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Por: {log.adminUser}
                        </p>
                        <p className="text-sm">{log.details}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dados do Cliente</DialogTitle>
            <DialogDescription>
              Atualize CPF/CNPJ e telefone de {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={selectedTenant?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <MaskedInput
                mask={editCpfCnpj.replace(/\D/g, '').length > 11 ? '99.999.999/9999-99' : '999.999.999-99'}
                value={editCpfCnpj}
                onChange={(e) => setEditCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <MaskedInput
                mask="(99) 99999-9999"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog}
        onOpenChange={(open) => {
          setDetailsDialog(open);
          if (!open) {
            setSelectedTenant(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Dados do cliente</DialogTitle>
            <DialogDescription>
              Informações do cliente e propriedades cadastradas (dados disponíveis no sistema atual).
            </DialogDescription>
          </DialogHeader>

          {selectedTenant ? (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{selectedTenant.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                  <p className="font-medium">{selectedTenant.cpfCnpj}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedTenant.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedTenant.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plano atual</p>
                  <p className="font-medium">{selectedTenant.currentPlan ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de cabeças</p>
                  <p className="font-medium">{typeof selectedTenant.cattleCount === 'number' ? selectedTenant.cattleCount : '-'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Propriedades</p>
                {Array.isArray(selectedTenant.properties) && selectedTenant.properties.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTenant.properties.map((p) => (
                      <Card key={p.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">{p.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {p.cidade} / {p.estado}
                              </p>
                              {(p.cep || p.logradouro || p.numero || p.bairro || p.complemento || p.viaAcesso || p.comunidade) && (
                                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                  {(p.logradouro || p.numero || p.complemento) && (
                                    <p>
                                      {String(p.logradouro ?? '')}
                                      {p.numero ? `, ${p.numero}` : ''}
                                      {p.complemento ? ` - ${p.complemento}` : ''}
                                    </p>
                                  )}
                                  {p.bairro && <p>Bairro: {p.bairro}</p>}
                                  {p.cep && <p>CEP: {p.cep}</p>}
                                  {p.viaAcesso && <p>Via de acesso: {p.viaAcesso}</p>}
                                  {p.comunidade && <p>Comunidade: {p.comunidade}</p>}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Cabeças</p>
                              <p className="font-medium">{p.quantidadeGado}</p>
                              <p className="text-xs text-muted-foreground mt-1">Plano: {p.plano}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Nenhuma propriedade vinculada.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">Nenhum cliente selecionado.</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
