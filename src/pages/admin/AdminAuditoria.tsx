import React, { useMemo, useState } from 'react';
import type { AuditLog, ActivityLog } from '@/services/api.service';
import { toast } from 'sonner';
import {
  Shield,
  Search,
  Filter,
  User,
  Calendar,
  Clock,
  Monitor,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useAdminTenants } from '@/hooks/queries/admin/useAdminTenants';
import { useAdminAuditLogs } from '@/hooks/queries/admin/useAdminAuditLogs';
import { useAdminActivityLogs } from '@/hooks/queries/admin/useAdminActivityLogs';
import {
  useAdminArchiveActivityLogs,
  useAdminDeleteActivityLogs,
  useAdminUnarchiveActivityLogs,
} from '@/hooks/mutations/admin/useAdminActivityLogsMutations';

const actionColors: Record<string, string> = {
  'login': 'bg-success/10 text-success',
  'logout': 'bg-muted text-muted-foreground',
  'approve': 'bg-success/10 text-success',
  'reject': 'bg-error/10 text-error',
  'block': 'bg-error/10 text-error',
  'unblock': 'bg-success/10 text-success',
  'impersonate': 'bg-warning/10 text-warning',
  'edit': 'bg-primary/10 text-primary',
  'create': 'bg-chart-3/10 text-chart-3',
  'delete': 'bg-error/10 text-error',
};

const actionLabels: Record<string, string> = {
  'login': 'Login',
  'logout': 'Logout',
  'approve': 'Aprovação',
  'reject': 'Rejeição',
  'block': 'Bloqueio',
  'unblock': 'Desbloqueio',
  'impersonate': 'Impersonate',
  'edit': 'Edição',
  'create': 'Criação',
  'delete': 'Exclusão',
};

const ALL_VALUE = '__all__';

export default function AdminAuditoria() {
  const [tab, setTab] = useState<'auditoria' | 'atividade'>('auditoria');
  const [searchTerm, setSearchTerm] = useState('');

  const [auditLimit] = useState(50);
  const [auditOffset, setAuditOffset] = useState(0);
  const [activityLimit] = useState(50);
  const [activityOffset, setActivityOffset] = useState(0);

  const [tenantId, setTenantId] = useState<string>(ALL_VALUE);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [activityEvent, setActivityEvent] = useState<string>('');
  const [activityStatus, setActivityStatus] = useState<string>(ALL_VALUE);
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);

  const [selectedActivityIds, setSelectedActivityIds] = useState<Record<string, boolean>>({});

  const tenantsQuery = useAdminTenants();
  const tenantOptions = useMemo(
    () => ((tenantsQuery.data ?? []) as any[]).map((t) => ({ id: String(t.id), name: String(t.name) })),
    [tenantsQuery.data],
  );

  const tenantIdFilter = tenantId === ALL_VALUE ? undefined : tenantId;
  const statusFilter = activityStatus === ALL_VALUE ? undefined : activityStatus;

  const auditLogsQuery = useAdminAuditLogs({
    userId: tenantIdFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: auditLimit,
    offset: auditOffset,
    enabled: tab === 'auditoria',
  });

  const activityLogsQuery = useAdminActivityLogs({
    tenantId: tenantIdFilter,
    event: activityEvent || undefined,
    status: statusFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    includeArchived,
    limit: activityLimit,
    offset: activityOffset,
    enabled: tab === 'atividade',
  });

  const archiveMutation = useAdminArchiveActivityLogs();
  const unarchiveMutation = useAdminUnarchiveActivityLogs();
  const deleteMutation = useAdminDeleteActivityLogs();

  const normalizedSearchTerm = searchTerm.toLowerCase();

  const audit = useMemo(
    () =>
      (auditLogsQuery.data ?? {
        items: [],
        total: 0,
        limit: auditLimit,
        offset: auditOffset,
      }) as { items: AuditLog[]; total: number; limit: number; offset: number },
    [auditLimit, auditLogsQuery.data, auditOffset],
  );

  const activity = useMemo(
    () =>
      (activityLogsQuery.data ?? {
        items: [],
        total: 0,
        limit: activityLimit,
        offset: activityOffset,
      }) as { items: ActivityLog[]; total: number; limit: number; offset: number },
    [activityLimit, activityLogsQuery.data, activityOffset],
  );

  const filteredAudit = audit.items.filter((log) => {
    const userName = log.userName?.toLowerCase?.() ?? '';
    const action = log.action?.toLowerCase?.() ?? '';
    const details = log.details?.toLowerCase?.() ?? '';
    return (
      userName.includes(normalizedSearchTerm) ||
      action.includes(normalizedSearchTerm) ||
      details.includes(normalizedSearchTerm)
    );
  });

  const filteredActivity = activity.items.filter((log) => {
    const userName = (log.usuarioNome ?? '').toLowerCase?.() ?? '';
    const event = (log.evento ?? '').toLowerCase?.() ?? '';
    const details = (log.detalhes ?? '').toLowerCase?.() ?? '';
    const status = (log.status ?? '').toLowerCase?.() ?? '';
    return (
      userName.includes(normalizedSearchTerm) ||
      event.includes(normalizedSearchTerm) ||
      details.includes(normalizedSearchTerm) ||
      status.includes(normalizedSearchTerm)
    );
  });

  const handleExport = () => {
    toast.success('Logs exportados com sucesso!');
  };

  const toggleSelectAllActivity = (checked: boolean) => {
    if (!checked) {
      setSelectedActivityIds({});
      return;
    }
    const next: Record<string, boolean> = {};
    filteredActivity.forEach((l) => {
      next[l.id] = true;
    });
    setSelectedActivityIds(next);
  };

  const selectedActivityCount = Object.values(selectedActivityIds).filter(Boolean).length;
  const selectedIds = Object.entries(selectedActivityIds)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const doArchive = async () => {
    if (selectedIds.length === 0) return;
    try {
      await archiveMutation.mutateAsync(selectedIds);
      setSelectedActivityIds({});
      toast.success('Logs arquivados');
    } catch (error) {
      console.error('Erro ao arquivar logs:', error);
      toast.error('Erro ao arquivar logs');
    }
  };

  const doUnarchive = async () => {
    if (selectedIds.length === 0) return;
    try {
      await unarchiveMutation.mutateAsync(selectedIds);
      setSelectedActivityIds({});
      toast.success('Logs desarquivados');
    } catch (error) {
      console.error('Erro ao desarquivar logs:', error);
      toast.error('Erro ao desarquivar logs');
    }
  };

  const doDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm('Tem certeza que deseja deletar os logs selecionados?')) return;
    try {
      await deleteMutation.mutateAsync(selectedIds);
      setSelectedActivityIds({});
      toast.success('Logs deletados');
    } catch (error) {
      console.error('Erro ao deletar logs:', error);
      toast.error('Erro ao deletar logs');
    }
  };

  const auditPage = Math.floor(audit.offset / audit.limit) + 1;
  const auditTotalPages = Math.max(1, Math.ceil(audit.total / audit.limit));

  const activityPage = Math.floor(activity.offset / activity.limit) + 1;
  const activityTotalPages = Math.max(1, Math.ceil(activity.total / activity.limit));

  const isLoading = tenantsQuery.isPending || auditLogsQuery.isPending || activityLogsQuery.isPending;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando logs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Auditoria
          </h1>
          <p className="text-muted-foreground">
            Logs completos de ações administrativas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nos logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {tab === 'auditoria' ? audit.total : activity.total}
            </p>
            <p className="text-xs text-muted-foreground">Total de Logs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {tab === 'auditoria'
                ? filteredAudit.filter((l) => l.action === 'login').length
                : filteredActivity.filter((l) => l.status === 'ok').length}
            </p>
            <p className="text-xs text-muted-foreground">
              {tab === 'auditoria' ? 'Logins' : 'OK'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {tab === 'auditoria'
                ? filteredAudit.filter((l) => l.action === 'impersonate').length
                : filteredActivity.filter((l) => l.status === 'erro').length}
            </p>
            <p className="text-xs text-muted-foreground">
              {tab === 'auditoria' ? 'Impersonates' : 'Erros'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-error">
              {tab === 'auditoria'
                ? filteredAudit.filter((l) => l.action === 'block' || l.action === 'reject').length
                : selectedActivityCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {tab === 'auditoria' ? 'Ações Restritivas' : 'Selecionados'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Logs de Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'auditoria' | 'atividade')}>
            <TabsList>
              <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
              <TabsTrigger value="atividade">Atividade</TabsTrigger>
            </TabsList>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por cliente (usuário)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                    {tenantOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />

              {tab === 'atividade' ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeArchived}
                    onCheckedChange={(v) => setIncludeArchived(Boolean(v))}
                    id="include-archived"
                  />
                  <label htmlFor="include-archived" className="text-sm text-muted-foreground">
                    Incluir arquivados
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filtros</span>
                </div>
              )}
            </div>

            {tab === 'atividade' ? (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
                <Input
                  placeholder="Evento (ex: GET /api/...)"
                  value={activityEvent}
                  onChange={(e) => setActivityEvent(e.target.value)}
                  className="md:col-span-3"
                />
                <Select value={activityStatus} onValueChange={setActivityStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                    <SelectItem value="ok">OK</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" disabled={selectedIds.length === 0} onClick={() => void doArchive()}>
                    Arquivar
                  </Button>
                  <Button variant="outline" disabled={selectedIds.length === 0} onClick={() => void doUnarchive()}>
                    Desarquivar
                  </Button>
                  <Button variant="destructive" disabled={selectedIds.length === 0} onClick={() => void doDelete()}>
                    Deletar
                  </Button>
                </div>
              </div>
            ) : null}

            <TabsContent value="auditoria">
              <div className="space-y-3 mt-4">
                {filteredAudit.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </div>
                ) : (
                  filteredAudit.map((log, index) => (
                    <div 
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${actionColors[log.action] || 'bg-muted'}`}>
                        <Shield className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={actionColors[log.action] || ''}>
                            {actionLabels[log.action] || log.action}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {log.details}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.userName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {log.ip}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setAuditOffset((prev) => Math.max(0, prev - auditLimit));
                        }}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" onClick={(e) => e.preventDefault()}>
                        {auditPage} / {auditTotalPages}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setAuditOffset((prev) => {
                            const nextOffset = prev + auditLimit;
                            return nextOffset >= audit.total ? prev : nextOffset;
                          });
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </TabsContent>

            <TabsContent value="atividade">
              <div className="space-y-3 mt-4">
                {filteredActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={filteredActivity.length > 0 && filteredActivity.every((l) => selectedActivityIds[l.id])}
                        onCheckedChange={(v) => toggleSelectAllActivity(Boolean(v))}
                        id="select-all"
                      />
                      <label htmlFor="select-all">Selecionar todos</label>
                    </div>

                    {filteredActivity.map((log, index) => {
                      const isSelected = Boolean(selectedActivityIds[log.id]);
                      const isArchived = Boolean(log.arquivadoEm);
                      return (
                        <div 
                          key={log.id}
                          className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className="pt-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(v) =>
                                setSelectedActivityIds((prev) => ({
                                  ...prev,
                                  [log.id]: Boolean(v),
                                }))
                              }
                            />
                          </div>

                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${log.status === 'erro' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                            <Shield className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={log.status === 'erro' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}>
                                {log.status}
                              </Badge>
                              {isArchived ? (
                                <Badge className="bg-muted text-muted-foreground">Arquivado</Badge>
                              ) : null}
                              <span className="text-sm font-medium text-foreground">
                                {log.evento}
                              </span>
                            </div>
                            {log.detalhes ? (
                              <div className="mt-1 text-sm text-muted-foreground">
                                {log.detalhes}
                              </div>
                            ) : null}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.usuarioNome ?? '—'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(log.dataHora).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(log.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                {log.ip ?? '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActivityOffset((prev) => Math.max(0, prev - activityLimit));
                        }}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" onClick={(e) => e.preventDefault()}>
                        {activityPage} / {activityTotalPages}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActivityOffset((prev) => {
                            const nextOffset = prev + activityLimit;
                            return nextOffset >= activity.total ? prev : nextOffset;
                          });
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
