import React, { useState, useEffect } from 'react';
import { adminService, User } from '@/services/api.service';
import { toast } from 'sonner';
import {
  Search,
  MoreHorizontal,
  User as UserIcon,
  Lock,
  Unlock,
  UserCheck,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  History,
  Save,
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

interface ActionLog {
  timestamp: Date;
  action: string;
  adminUser: string;
  details: string;
}

export default function AdminClientes() {
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

  // Form state
  const [newPlan, setNewPlan] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [editCpfCnpj, setEditCpfCnpj] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [actionLogs] = useState<ActionLog[]>([
    {
      timestamp: new Date('2026-01-10T14:30:00'),
      action: 'Alteração de Plano',
      adminUser: 'Admin Master',
      details: 'Plano alterado de Piquete para Retiro',
    },
    {
      timestamp: new Date('2026-01-08T09:15:00'),
      action: 'Reset de Senha',
      adminUser: 'Admin Master',
      details: 'Senha resetada via painel admin',
    },
  ]);

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
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
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
    
    const tempPassword = Math.random().toString(36).slice(-8);
    toast.success(`Senha resetada para ${selectedTenant.name}. Nova senha: ${tempPassword}`);
    setResetPasswordDialog(false);
    setSelectedTenant(null);
  };

  const handleToggleBlock = () => {
    if (!selectedTenant || !blockReason.trim()) {
      toast.error('Informe o motivo do bloqueio');
      return;
    }
    
    const isBlocking = selectedTenant.status !== 'blocked';
    
    setTenantsData(tenantsData.map(t => 
      t.id === selectedTenant.id 
        ? { ...t, status: isBlocking ? 'blocked' : 'active' }
        : t
    ));
    
    toast.success(isBlocking ? 'Cliente bloqueado' : 'Cliente desbloqueado');
    setBlockDialog(false);
    setBlockReason('');
    setSelectedTenant(null);
  };

  const handleImpersonate = () => {
    if (!selectedTenant) return;
    
    toast.info(`Acessando como ${selectedTenant.name}...`);
    setTimeout(() => {
      toast.success(`Agora você está operando como ${selectedTenant.name}`);
      setImpersonateDialog(false);
      setSelectedTenant(null);
    }, 1500);
  };

  const handleChangePlan = () => {
    if (!selectedTenant || !newPlan) {
      toast.error('Selecione um plano');
      return;
    }
    
    setTenantsData(tenantsData.map(t => 
      t.id === selectedTenant.id 
        ? { ...t, plan: newPlan }
        : t
    ));
    
    toast.success(`Plano de ${selectedTenant.name} alterado para ${newPlan}`);
    setChangePlanDialog(false);
    setNewPlan('');
    setSelectedTenant(null);
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
  };

  const openEditDialog = (tenant: User) => {
    setSelectedTenant(tenant);
    setEditCpfCnpj(tenant.cpfCnpj || '');
    setEditPhone(tenant.phone || '');
    setEditEmail(tenant.email || '');
    setEditDialog(true);
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

    setTenantsData(tenantsData.map((t) => (
      t.id === selectedTenant.id
        ? { ...t, cpfCnpj: editCpfCnpj, phone: editPhone, email: editEmail }
        : t
    )));

    toast.success('Dados do cliente atualizados');
    setEditDialog(false);
    setSelectedTenant(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/30">Ativo</Badge>;
      case 'blocked':
        return <Badge className="bg-error/10 text-error border-error/30">Bloqueado</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/30">Pendente</Badge>;
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
                <TableHead>Telefone</TableHead>
                <TableHead>Papel</TableHead>
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
                  <TableCell className="text-muted-foreground text-sm">
                    {tenant.phone || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tenant.role}</Badge>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => openBlockDialog(tenant)}
                          className={tenant.status === 'blocked' ? 'text-success' : 'text-error'}
                        >
                          {tenant.status === 'blocked' ? (
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
              {selectedTenant?.status === 'blocked' ? 'Desbloquear' : 'Bloquear'} Cliente
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.status === 'blocked' 
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
              variant={selectedTenant?.status === 'blocked' ? 'default' : 'destructive'}
            >
              {selectedTenant?.status === 'blocked' ? (
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
    </div>
  );
}
