import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncItems, getDatabaseStats, syncAll } from '@/lib/db';

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';

interface SyncStatusData {
  status: SyncStatus;
  pendingCount: number;
  lastSync: Date | null;
  isOnline: boolean;
  errorMessage?: string;
}

/**
 * Hook para monitorar status de sincronização offline-first
 */
export function useSyncStatus() {
  const [syncData, setSyncData] = useState<SyncStatusData>({
    status: 'synced',
    pendingCount: 0,
    lastSync: null,
    isOnline: navigator.onLine,
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Atualizar status de conexão
  const updateOnlineStatus = useCallback(() => {
    setSyncData((prev) => ({
      ...prev,
      isOnline: navigator.onLine,
      status: navigator.onLine ? prev.status : 'offline',
    }));
  }, []);

  // Verificar itens pendentes
  const checkPendingItems = useCallback(async () => {
    try {
      const pendingItems = await getPendingSyncItems();
      const stats = await getDatabaseStats();

      setSyncData((prev) => ({
        ...prev,
        pendingCount: pendingItems.length,
        status: pendingItems.length > 0 && prev.isOnline ? 'syncing' : pendingItems.length > 0 ? 'offline' : 'synced',
      }));

      return pendingItems.length;
    } catch (error) {
      console.error('Erro ao verificar itens pendentes:', error);
      return 0;
    }
  }, []);

  // Sincronizar manualmente
  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncData((prev) => ({
        ...prev,
        status: 'offline',
        errorMessage: 'Sem conexão com a internet',
      }));
      return false;
    }

    setIsSyncing(true);
    setSyncData((prev) => ({ ...prev, status: 'syncing' }));

    try {
      const pendingItems = await getPendingSyncItems();

      if (pendingItems.length === 0) {
        setSyncData((prev) => ({
          ...prev,
          status: 'synced',
          lastSync: new Date(),
        }));
        setIsSyncing(false);
        return true;
      }

      // Executar sincronização real
      const results = await syncAll();
      
      const totalSuccess = results.movements.success + results.photos.success;
      const totalFailed = results.movements.failed + results.photos.failed;

      console.log(`✅ Sincronizados: ${totalSuccess} itens | ❌ Falhas: ${totalFailed}`);

      await checkPendingItems();

      if (totalFailed > 0 && results.totalErrors.length > 0) {
        setSyncData((prev) => ({
          ...prev,
          status: 'error',
          lastSync: new Date(),
          errorMessage: results.totalErrors[0],
        }));
      } else {
        setSyncData((prev) => ({
          ...prev,
          status: 'synced',
          lastSync: new Date(),
          errorMessage: undefined,
        }));
      }

      setIsSyncing(false);
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      setSyncData((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
      }));
      setIsSyncing(false);
      return false;
    }
  }, [checkPendingItems]);

  // Listeners de eventos
  useEffect(() => {
    // Verificar itens pendentes ao montar
    checkPendingItems();

    // Listeners de conexão
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listener de eventos customizados do Service Worker
    const handleSyncMovements = () => {
      checkPendingItems();
    };

    const handleSyncPhotos = () => {
      checkPendingItems();
    };

    window.addEventListener('sync-movements', handleSyncMovements);
    window.addEventListener('sync-photos', handleSyncPhotos);

    // Verificar periodicamente (a cada 30 segundos)
    const interval = setInterval(() => {
      checkPendingItems();
    }, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('sync-movements', handleSyncMovements);
      window.removeEventListener('sync-photos', handleSyncPhotos);
      clearInterval(interval);
    };
  }, [updateOnlineStatus, checkPendingItems]);

  // Tentar sincronizar automaticamente quando voltar online
  useEffect(() => {
    if (navigator.onLine && syncData.pendingCount > 0 && !isSyncing) {
      syncNow();
    }
  }, [navigator.onLine, syncData.pendingCount, isSyncing, syncNow]);

  return {
    ...syncData,
    isSyncing,
    syncNow,
    refresh: checkPendingItems,
  };
}
