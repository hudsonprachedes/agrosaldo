import React, { useState, useEffect } from 'react';
import { adminService } from '@/services/api.service';
import {
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  User,
  Building,
  Calendar,
  MoreHorizontal,
  CreditCard,
  Send,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
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

interface PendingRequest {
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
  source?: string;
  notes?: string;
}

export default function AdminSolicitacoes() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const downgradeRequests = requests.filter((r) => r.type === 'plan_downgrade');

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await adminService.getRequests();
        const next = (data as unknown as PendingRequest[]).filter((r) => r.type === 'plan_downgrade');
        setRequests(next);
      } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
        toast.error('Erro ao carregar solicitações');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRequests();
  }, []);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [approveDialog, setApproveDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await adminService.approveRequest(selectedRequest.id);
      setRequests(requests.filter(r => r.id !== selectedRequest.id));
      toast.success(`Solicitação de ${selectedRequest.name} aprovada com sucesso!`);
      setApproveDialog(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      toast.error('Erro ao aprovar solicitação');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    try {
      await adminService.rejectRequest(selectedRequest.id, rejectionReason.trim());
      setRequests(requests.filter(r => r.id !== selectedRequest.id));
      toast.success(`Solicitação de ${selectedRequest.name} rejeitada.`);
      setRejectDialog(false);
      setRejectionReason('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast.error('Erro ao rejeitar solicitação');
    }
  };

  const openApproveDialog = (request: PendingRequest) => {
    setSelectedRequest(request);
    setApproveDialog(true);
  };

  const openRejectDialog = (request: PendingRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialog(true);
  };

  const openViewDialog = (request: PendingRequest) => {
    setSelectedRequest(request);
    setViewDialog(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'plan_downgrade': return CreditCard;
      default: return Clock;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'plan_downgrade': return 'Downgrade de Plano';
      default: return type;
    }
  };

  const getPendingCount = () => {
    return downgradeRequests.filter(r => r.status === 'pending').length;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando solicitações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Solicitações
          </h1>
          <p className="text-muted-foreground">
            Gerencie aprovações e rejeições de pedidos
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {getPendingCount()} {getPendingCount() === 1 ? 'pendente' : 'pendentes'}
        </Badge>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {downgradeRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-success mb-4" />
              <p className="text-lg font-medium text-foreground">
                Nenhuma solicitação pendente
              </p>
              <p className="text-muted-foreground">
                Nenhum downgrade foi solicitado
              </p>
            </CardContent>
          </Card>
        ) : (
          downgradeRequests.map((request, index) => {
            const Icon = getTypeIcon(request.type);
            
            return (
              <Card 
                key={request.id}
                className="animate-fade-in hover:shadow-card-hover transition-shadow"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                      <Icon className="w-7 h-7 text-warning" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline">{getTypeLabel(request.type)}</Badge>
                        <Badge variant="secondary" className="bg-warning/10 text-warning">
                          {request.status === 'pending' ? 'Pendente' : request.status}
                        </Badge>
                      </div>
                      <p className="font-semibold text-foreground">
                        {request.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.cpfCnpj} • {request.plan}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>📧 {request.email}</span>
                        <span>📱 {request.phone}</span>
                        <span>
                          📅 {new Date(request.submittedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openViewDialog(request)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Detalhes
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-success border-success/30 hover:bg-success/10"
                        onClick={() => openApproveDialog(request)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => openRejectDialog(request)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialog} onOpenChange={setApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar a solicitação de <strong>{selectedRequest?.name}</strong>?
              <br /><br />
              O usuário receberá um email de confirmação com instruções de acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprove}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Aprovação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição da solicitação de <strong>{selectedRequest?.name}</strong>.
              O usuário receberá esta mensagem por email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Motivo da Rejeição *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Ex: Documentação incompleta, dados cadastrais inválidos, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Seja claro e objetivo. O usuário receberá esta mensagem.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReject}
              variant="destructive"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
            <DialogDescription>
              Informações completas do pedido
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Tipo de Solicitação</Label>
                  <p className="font-medium">{getTypeLabel(selectedRequest.type)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant="secondary" className="bg-warning/10 text-warning">
                    {selectedRequest.status === 'pending' ? 'Pendente' : selectedRequest.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Nome Completo</Label>
                <p className="font-medium">{selectedRequest.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">CPF/CNPJ</Label>
                  <p className="font-medium">{selectedRequest.cpfCnpj}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Plano Solicitado</Label>
                  <p className="font-medium">{selectedRequest.plan}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Telefone</Label>
                  <p className="font-medium">{selectedRequest.phone}</p>
                </div>
              </div>

              {selectedRequest.propertyName && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nome da Propriedade</Label>
                  <p className="font-medium">{selectedRequest.propertyName}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Data da Solicitação</Label>
                  <p className="font-medium">
                    {new Date(selectedRequest.submittedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Origem</Label>
                  <p className="font-medium">{selectedRequest.source || 'Site'}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setViewDialog(false)}>
              Fechar
            </Button>
            <Button 
              variant="outline" 
              className="text-success border-success/30 hover:bg-success/10"
              onClick={() => {
                setViewDialog(false);
                if (selectedRequest) openApproveDialog(selectedRequest);
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar
            </Button>
            <Button 
              variant="outline" 
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => {
                setViewDialog(false);
                if (selectedRequest) openRejectDialog(selectedRequest);
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
