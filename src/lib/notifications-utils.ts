/**
 * Utilitários para notificações
 */

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'agora';
  if (diffMinutes < 60) return `${diffMinutes}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return date.toLocaleDateString('pt-BR');
}

/**
 * Utilitário para criar notificações do sistema
 */
export async function createSystemNotification(
  propertyId: string,
  title: string,
  message: string,
  type: 'system' | 'reminder' | 'announcement' = 'system',
  actionUrl?: string
) {
  const { saveNotification } = await import('@/lib/indexeddb');

  return saveNotification({
    propertyId,
    type,
    status: 'unread',
    title,
    message,
    actionUrl,
    createdAt: new Date().toISOString(),
  });
}
