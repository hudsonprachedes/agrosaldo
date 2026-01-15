import { useEffect, useCallback } from 'react';
import { getSyncQueueItems, updateSyncQueueItem } from '@/lib/db';
import { movementService } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';

export function useApiSync(propertyId: string | undefined) {
  const { toast } = useToast();

  const syncPendingMovements = useCallback(async () => {
    if (!navigator.onLine || !propertyId) return;

    try {
      const pending = await getSyncQueueItems();
      
      if (pending.length === 0) return;

      let synced = 0;
      let failed = 0;

      for (const item of pending) {
        try {
          if (item.type === 'movement' && item.payload) {
            await movementService.create(item.payload as any);
            await updateSyncQueueItem(item.id!, { status: 'synced' });
            synced++;
          }
        } catch (error) {
          console.error('Erro ao sincronizar item:', error);
          await updateSyncQueueItem(item.id!, { status: 'failed' });
          failed++;
        }
      }

      if (synced > 0) {
        toast({
          title: 'Sincronização concluída',
          description: `${synced} lançamento(s) sincronizado(s)${failed > 0 ? `, ${failed} falhou(ram)` : ''}`,
        });
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  }, [propertyId, toast]);

  useEffect(() => {
    const handleOnline = () => {
      syncPendingMovements();
    };

    window.addEventListener('online', handleOnline);
    
    if (navigator.onLine) {
      syncPendingMovements();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncPendingMovements]);

  return { syncPendingMovements };
}
