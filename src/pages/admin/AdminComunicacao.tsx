import React, { useState } from 'react';
import {
  Bell,
  Send,
  Image,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Users,
  Calendar,
  Check,
  X,
  Megaphone,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'push' | 'banner';
  title: string;
  message: string;
  sentAt: string;
  recipients: number;
  status: 'draft' | 'scheduled' | 'sent' | 'active' | 'expired';
  targetAudience: 'all' | 'active' | 'overdue' | 'new';
  color?: string;
  startDate?: string;
  endDate?: string;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'push',
    title: 'Campanha de Aftosa Iniciada!',
    message: 'A campanha de vacinação contra aftosa começou. Atualize seus registros.',
    sentAt: '2024-01-15',
    recipients: 245,
    status: 'sent',
    targetAudience: 'all',
  },
  {
    id: '2',
    type: 'banner',
    title: 'Manutenção Programada',
    message: 'O sistema ficará indisponível no dia 20/01 das 02h às 04h.',
    sentAt: '2024-01-14',
    recipients: 312,
    status: 'active',
    targetAudience: 'all',
    color: 'warning',
    startDate: '2024-01-14',
    endDate: '2024-01-21',
  },
  {
    id: '3',
    type: 'push',
    title: 'Lembrete de Pagamento',
    message: 'Sua fatura vence em 3 dias. Regularize para manter o acesso.',
    sentAt: '2024-01-12',
    recipients: 48,
    status: 'sent',
    targetAudience: 'overdue',
  },
];

const bannerColors = [
  { id: 'primary', label: 'Primário', class: 'bg-primary' },
  { id: 'success', label: 'Sucesso', class: 'bg-success' },
  { id: 'warning', label: 'Aviso', class: 'bg-warning' },
  { id: 'error', label: 'Erro', class: 'bg-error' },
  { id: 'chart-3', label: 'Info', class: 'bg-chart-3' },
];

const audienceOptions = [
  { value: 'all', label: 'Todos os usuários', count: 312 },
  { value: 'active', label: 'Apenas ativos', count: 284 },
  { value: 'overdue', label: 'Inadimplentes', count: 28 },
  { value: 'new', label: 'Novos (últimos 30 dias)', count: 45 },
];

export default function AdminComunicacao() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Push form state
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushAudience, setPushAudience] = useState<'all' | 'active' | 'overdue' | 'new'>('all');
  const [pushScheduled, setPushScheduled] = useState(false);
  const [pushScheduleDate, setPushScheduleDate] = useState('');

  // Banner form state
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerColor, setBannerColor] = useState('primary');
  const [bannerStartDate, setBannerStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bannerEndDate, setBannerEndDate] = useState('');
  const [bannerLink, setBannerLink] = useState('');

  const resetPushForm = () => {
    setPushTitle('');
    setPushMessage('');
    setPushAudience('all');
    setPushScheduled(false);
    setPushScheduleDate('');
  };

  const resetBannerForm = () => {
    setBannerTitle('');
    setBannerMessage('');
    setBannerColor('primary');
    setBannerStartDate(new Date().toISOString().split('T')[0]);
    setBannerEndDate('');
    setBannerLink('');
  };

  const handleSendPush = () => {
    if (!pushTitle.trim() || !pushMessage.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const audience = audienceOptions.find(a => a.value === pushAudience);
    const newNotification: Notification = {
      id: Date.now().toString(),
      type: 'push',
      title: pushTitle,
      message: pushMessage,
      sentAt: pushScheduled ? pushScheduleDate : new Date().toISOString().split('T')[0],
      recipients: audience?.count || 312,
      status: pushScheduled ? 'scheduled' : 'sent',
      targetAudience: pushAudience,
    };

    setNotifications([newNotification, ...notifications]);
    
    if (pushScheduled) {
      toast.success('Push agendada com sucesso!', {
        description: `Será enviada em ${new Date(pushScheduleDate).toLocaleDateString('pt-BR')} para ${audience?.count} usuários`,
      });
    } else {
      toast.success('Push enviada com sucesso!', {
        description: `${audience?.count} usuários notificados`,
        icon: '🔔',
      });
    }
    
    resetPushForm();
    setPushDialogOpen(false);
  };

  const handleCreateBanner = () => {
    if (!bannerTitle.trim() || !bannerMessage.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const newNotification: Notification = {
      id: Date.now().toString(),
      type: 'banner',
      title: bannerTitle,
      message: bannerMessage,
      sentAt: bannerStartDate,
      recipients: 312,
      status: 'active',
      targetAudience: 'all',
      color: bannerColor,
      startDate: bannerStartDate,
      endDate: bannerEndDate,
    };

    setNotifications([newNotification, ...notifications]);
    toast.success('Banner criado e ativado!', {
      description: 'O banner está visível para todos os usuários',
      icon: '🎨',
    });
    
    resetBannerForm();
    setBannerDialogOpen(false);
  };

  const handleDelete = () => {
    if (!selectedNotification) return;
    
    setNotifications(notifications.filter(n => n.id !== selectedNotification.id));
    toast.success(`${selectedNotification.type === 'push' ? 'Push' : 'Banner'} excluído(a)`);
    setDeleteDialogOpen(false);
    setSelectedNotification(null);
  };

  const handleToggleBanner = (notification: Notification) => {
    setNotifications(notifications.map(n => {
      if (n.id === notification.id) {
        const newStatus = n.status === 'active' ? 'expired' : 'active';
        toast.success(`Banner ${newStatus === 'active' ? 'ativado' : 'desativado'}`);
        return { ...n, status: newStatus };
      }
      return n;
    }));
  };

  const getAudienceLabel = (audience: string) => {
    return audienceOptions.find(a => a.value === audience)?.label || 'Todos';
  };

  const stats = {
    pushThisMonth: notifications.filter(n => n.type === 'push' && n.status === 'sent').length,
    activeBanners: notifications.filter(n => n.type === 'banner' && n.status === 'active').length,
    totalReach: notifications.reduce((sum, n) => sum + n.recipients, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-primary" />
            Comunicação
          </h1>
          <p className="text-muted-foreground">
            Envie notificações e gerencie banners do app
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={pushDialogOpen} onOpenChange={(open) => { setPushDialogOpen(open); if (!open) resetPushForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Nova Push
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Enviar Push Notification
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input 
                    placeholder="Ex: Campanha de Aftosa" 
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground text-right">{pushTitle.length}/60</p>
                </div>
                <div className="space-y-2">
                  <Label>Mensagem *</Label>
                  <Textarea 
                    placeholder="Digite a mensagem que será enviada..."
                    rows={4}
                    value={pushMessage}
                    onChange={(e) => setPushMessage(e.target.value)}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground text-right">{pushMessage.length}/200</p>
                </div>
                <div className="space-y-2">
                  <Label>Destinatários</Label>
                  <Select value={pushAudience} onValueChange={(v: any) => setPushAudience(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audienceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            {option.label}
                            <Badge variant="secondary" className="text-xs">{option.count}</Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label className="font-medium">Agendar envio</Label>
                    <p className="text-xs text-muted-foreground">Defina uma data futura</p>
                  </div>
                  <Switch checked={pushScheduled} onCheckedChange={setPushScheduled} />
                </div>
                {pushScheduled && (
                  <div className="space-y-2">
                    <Label>Data de Envio</Label>
                    <Input 
                      type="datetime-local" 
                      value={pushScheduleDate}
                      onChange={(e) => setPushScheduleDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPushDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSendPush}>
                  <Send className="w-4 h-4 mr-2" />
                  {pushScheduled ? 'Agendar' : 'Enviar Agora'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={bannerDialogOpen} onOpenChange={(open) => { setBannerDialogOpen(open); if (!open) resetBannerForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Image className="w-4 h-4 mr-2" />
                Novo Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-success" />
                  Criar Banner
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input 
                    placeholder="Ex: Promoção Especial" 
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem *</Label>
                  <Textarea 
                    placeholder="Conteúdo do banner..."
                    rows={3}
                    value={bannerMessage}
                    onChange={(e) => setBannerMessage(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input 
                      type="date" 
                      value={bannerStartDate}
                      onChange={(e) => setBannerStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim (opcional)</Label>
                    <Input 
                      type="date" 
                      value={bannerEndDate}
                      onChange={(e) => setBannerEndDate(e.target.value)}
                      min={bannerStartDate}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Link (opcional)</Label>
                  <Input 
                    placeholder="https://..." 
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor do Banner</Label>
                  <div className="flex gap-2">
                    {bannerColors.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setBannerColor(color.id)}
                        className={cn(
                          "w-10 h-10 rounded-lg transition-all",
                          color.class,
                          bannerColor === color.id && "ring-2 ring-offset-2 ring-foreground"
                        )}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className={cn(
                    "p-4 rounded-lg text-white",
                    bannerColors.find(c => c.id === bannerColor)?.class
                  )}>
                    <p className="font-semibold">{bannerTitle || 'Título do Banner'}</p>
                    <p className="text-sm opacity-90">{bannerMessage || 'Mensagem do banner...'}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBannerDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateBanner}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Banner
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pushThisMonth}</p>
              <p className="text-sm text-muted-foreground">Push enviadas este mês</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Image className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeBanners}</p>
              <p className="text-sm text-muted-foreground">Banners ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalReach.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Usuários alcançados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Comunicações</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma comunicação enviada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div 
                  key={notification.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    notification.type === 'push' ? 'bg-primary/10' : 
                    notification.color ? `bg-${notification.color}/10` : 'bg-success/10'
                  )}>
                    {notification.type === 'push' ? (
                      <Bell className="w-5 h-5 text-primary" />
                    ) : (
                      <Image className={cn(
                        "w-5 h-5",
                        notification.color ? `text-${notification.color}` : 'text-success'
                      )} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{notification.title}</p>
                      <Badge variant="outline" className="shrink-0">
                        {notification.type === 'push' ? 'Push' : 'Banner'}
                      </Badge>
                      <Badge 
                        className={cn(
                          "shrink-0",
                          notification.status === 'sent' && 'bg-muted text-muted-foreground',
                          notification.status === 'active' && 'bg-success/10 text-success',
                          notification.status === 'scheduled' && 'bg-chart-3/10 text-chart-3',
                          notification.status === 'expired' && 'bg-muted text-muted-foreground',
                          notification.status === 'draft' && 'bg-warning/10 text-warning'
                        )}
                      >
                        {notification.status === 'sent' && 'Enviado'}
                        {notification.status === 'active' && 'Ativo'}
                        {notification.status === 'scheduled' && 'Agendado'}
                        {notification.status === 'expired' && 'Expirado'}
                        {notification.status === 'draft' && 'Rascunho'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notification.sentAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {notification.recipients} destinatários
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {getAudienceLabel(notification.targetAudience)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {notification.type === 'banner' && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleToggleBanner(notification)}
                        title={notification.status === 'active' ? 'Desativar' : 'Ativar'}
                      >
                        {notification.status === 'active' ? (
                          <X className="w-4 h-4 text-destructive" />
                        ) : (
                          <Check className="w-4 h-4 text-success" />
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setSelectedNotification(notification);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedNotification(notification);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification?.type === 'push' ? (
                <Bell className="w-5 h-5 text-primary" />
              ) : (
                <Image className="w-5 h-5 text-success" />
              )}
              Detalhes da Comunicação
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground text-xs">Título</Label>
                <p className="font-medium">{selectedNotification.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Mensagem</Label>
                <p>{selectedNotification.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Data</Label>
                  <p>{new Date(selectedNotification.sentAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Destinatários</Label>
                  <p>{selectedNotification.recipients}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Público-alvo</Label>
                  <p>{getAudienceLabel(selectedNotification.targetAudience)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <Badge className={cn(
                    selectedNotification.status === 'active' && 'bg-success/10 text-success',
                    selectedNotification.status === 'sent' && 'bg-muted'
                  )}>
                    {selectedNotification.status === 'sent' ? 'Enviado' : 
                     selectedNotification.status === 'active' ? 'Ativo' : 
                     selectedNotification.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedNotification?.title}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}