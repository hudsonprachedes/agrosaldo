import React, { useState, useEffect } from 'react';
import { adminService, AuditLog } from '@/services/api.service';
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

export default function AdminAuditoria() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await adminService.getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error('Erro ao carregar auditoria:', error);
        toast.error('Erro ao carregar logs de auditoria');
      } finally {
        setIsLoading(false);
      }
    };

    void loadLogs();
  }, []);

  const normalizedSearchTerm = searchTerm.toLowerCase();

  const filteredLogs = logs.filter((log) => {
    const userName = log.userName?.toLowerCase?.() ?? '';
    const action = log.action?.toLowerCase?.() ?? '';
    const details = log.details?.toLowerCase?.() ?? '';

    return (
      userName.includes(normalizedSearchTerm) ||
      action.includes(normalizedSearchTerm) ||
      details.includes(normalizedSearchTerm)
    );
  });

  const handleExport = () => {
    toast.success('Logs exportados com sucesso!');
  };

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
            <p className="text-2xl font-bold text-primary">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total de Logs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {logs.filter(l => l.action === 'login').length}
            </p>
            <p className="text-xs text-muted-foreground">Logins Hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {logs.filter(l => l.action === 'impersonate').length}
            </p>
            <p className="text-xs text-muted-foreground">Impersonates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-error">
              {logs.filter(l => l.action === 'block' || l.action === 'reject').length}
            </p>
            <p className="text-xs text-muted-foreground">Ações Restritivas</p>
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
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log encontrado
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div 
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${actionColors[log.action] || 'bg-muted'}`}>
                    <Shield className="w-5 h-5" />
                  </div>

                  {/* Content */}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
