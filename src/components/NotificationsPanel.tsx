import React, { useEffect, useState } from 'react';
import { Bell, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getPropertyNotifications,
  markNotificationAsRead,
  getUnreadNotifications,
} from '@/lib/indexeddb';
import { formatTimeAgo } from '@/lib/notifications-utils';

export interface NotificationItem {
  id: string;
  propertyId?: string;
  userId?: string;
  type: 'announcement' | 'system' | 'reminder';
  status: 'unread' | 'read' | 'archived';
  title: string;
  message: string;
  actionUrl?: string;
  icon?: string;
  createdAt: string;
  readAt?: string;
}

interface NotificationsPanelProps {
  propertyId?: string;
  userId?: string;
  className?: string;
}

/**
 * Componente de Notificações (Bell Icon com dropdown)
 * Exibe notificações do sistema e anúncios do SuperAdmin
 */
export function NotificationsPanel({ propertyId, userId, className }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar notificações
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        let notifs: NotificationItem[] = [];

        if (propertyId) {
          notifs = await getPropertyNotifications(propertyId);
        } else if (userId) {
          const all = await getUnreadNotifications();
          notifs = all.filter(n => n.userId === userId);
        } else {
          notifs = [];
        }

        // Ordenar por data (mais recentes primeiro)
        notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => n.status === 'unread').length);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, propertyId, userId]);

  // Marcar como lida
  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, status: 'read' } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Navegar para ação
  const handleAction = (notification: NotificationItem) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    handleMarkAsRead(notification.id);
  };

  // Badge de notificação
  const showBadge = unreadCount > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          title="Notificações"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          {showBadge && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* LOADING */}
        {isLoading && (
          <div className="px-4 py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto" />
            <p className="text-xs text-gray-500 mt-2">Carregando...</p>
          </div>
        )}

        {/* LISTA DE NOTIFICAÇÕES */}
        {!isLoading && notifications.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="space-y-1">
            {notifications.map((notif, idx) => (
              <React.Fragment key={notif.id}>
                <div
                  className={cn(
                    'px-4 py-3 cursor-pointer transition-colors',
                    notif.status === 'unread'
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  )}
                >
                  {/* TIPO E ÍCONE */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'mt-1 text-2xl',
                        notif.type === 'system' && '⚠️',
                        notif.type === 'reminder' && '📅',
                        notif.type === 'announcement' && '📢'
                      )}
                    >
                      {notif.icon || (notif.type === 'system' ? '⚠️' : '📢')}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* TÍTULO */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {notif.title}
                        </p>
                        {notif.status === 'unread' && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                        )}
                      </div>

                      {/* MENSAGEM */}
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notif.message}
                      </p>

                      {/* DATA */}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(new Date(notif.createdAt))}
                      </p>

                      {/* AÇÕES */}
                      <div className="flex items-center gap-2 mt-2">
                        {notif.actionUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 gap-1"
                            onClick={e => {
                              e.stopPropagation();
                              handleAction(notif);
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver
                          </Button>
                        )}

                        {notif.status === 'unread' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6 text-gray-500"
                            onClick={e => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.id);
                            }}
                          >
                            Marcar como lida
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {idx < notifications.length - 1 && <DropdownMenuSeparator />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* FOOTER */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500"
                onClick={() => {
                  // TODO: Implementar página de histórico completo
                }}
              >
                Ver todas as notificações →
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
