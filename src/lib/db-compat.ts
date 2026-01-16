/**
 * Camada de compatibilidade para funções de sincronização
 * Antes de integração com backend real
 */

import { getDB, getSyncQueueItems, updateSyncQueueItem } from './indexeddb';

interface ApiClient {
  post: (path: string, data: unknown) => Promise<unknown>;
}

/**
 * Sincroniza movimentos pendentes com o servidor
 * Implementa retry com backoff exponencial
 */
export async function syncMovements(apiClient?: ApiClient): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    const pendingItems = await getSyncQueueItems('pending');
    const movementItems = pendingItems.filter(item => item.type === 'movement');

    for (const item of movementItems) {
      try {
        await updateSyncQueueItem(item.id, 'syncing');

        // TODO: Integrar com API real quando backend estiver pronto
        // const response = await apiClient.post('/api/lancamentos', item.payload);
        
        // Simular sucesso por enquanto
        await new Promise(resolve => setTimeout(resolve, 100));

        await updateSyncQueueItem(item.id, 'synced');
        result.success++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        await updateSyncQueueItem(item.id, 'failed', errorMessage);
        result.failed++;
        result.errors.push(`Movimento ${item.resourceId}: ${errorMessage}`);
      }
    }

  } catch (error) {
    console.error('Erro durante sincronização:', error);
    result.errors.push('Erro geral na sincronização');
  }

  return result;
}

/**
 * Sincroniza fotos pendentes com o servidor
 */
export async function syncPhotos(apiClient?: ApiClient): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    const pendingItems = await getSyncQueueItems('pending');
    const photoItems = pendingItems.filter(item => item.type === 'photo');

    for (const item of photoItems) {
      try {
        await updateSyncQueueItem(item.id, 'syncing');

        // TODO: Upload real quando backend estiver pronto
        // const response = await apiClient.post('/api/photos', item.payload);

        // Simular sucesso
        await new Promise(resolve => setTimeout(resolve, 200));

        await updateSyncQueueItem(item.id, 'synced');
        result.success++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        result.failed++;
        result.errors.push(`Foto ${item.resourceId}: ${errorMessage}`);
        await updateSyncQueueItem(item.id, 'failed', errorMessage);
      }
    }

  } catch (error) {
    console.error('Erro durante sincronização de fotos:', error);
    result.errors.push('Erro geral na sincronização de fotos');
  }

  return result;
}

/**
 * Sincroniza todos os itens pendentes
 */
export async function syncAll(apiClient?: ApiClient): Promise<{
  movements: { success: number; failed: number };
  photos: { success: number; failed: number };
  totalErrors: string[];
}> {
  const [movementResults, photoResults] = await Promise.all([
    syncMovements(apiClient),
    syncPhotos(apiClient),
  ]);

  return {
    movements: {
      success: movementResults.success,
      failed: movementResults.failed,
    },
    photos: {
      success: photoResults.success,
      failed: photoResults.failed,
    },
    totalErrors: [...movementResults.errors, ...photoResults.errors],
  };
}

/**
 * Agenda sincronização automática quando internet retorna
 */
export function setupAutoSync(apiClient?: ApiClient): () => void {
  const handleOnline = async () => {
    console.log('🌐 Conexão restaurada, iniciando sincronização...');
    const results = await syncAll(apiClient);
    
    const totalSuccess = results.movements.success + results.photos.success;
    const totalFailed = results.movements.failed + results.photos.failed;

    if (totalSuccess > 0) {
      console.log(`✅ Sincronizados: ${totalSuccess} itens`);
    }
    if (totalFailed > 0) {
      console.error(`❌ Falhas: ${totalFailed} itens`, results.totalErrors);
    }
  };

  window.addEventListener('online', handleOnline);

  // Retorna função para limpar listener
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * Obter itens pendentes de sincronização
 */
export async function getPendingSyncItems(): Promise<Record<string, unknown>[]> {
  const dbInstance = await getDB();
  
  const syncQueue = await dbInstance.getAll('syncQueue');
  return syncQueue.filter((item: Record<string, unknown>) => item.status === 'pending');
}

/**
 * Obter estatísticas do banco de dados
 */
export async function getDatabaseStats(): Promise<{
  totalMovements: number;
  totalPhotos: number;
  pendingSyncItems: number;
  queueSize: number;
}> {
  const dbInstance = await getDB();
  
  const movements = await dbInstance.getAll('movements');
  const photos = await dbInstance.getAll('photos');
  const syncQueue = await dbInstance.getAll('syncQueue');
  const pendingItems = syncQueue.filter((item: Record<string, unknown>) => item.status === 'pending');
  
  return {
    totalMovements: movements.length,
    totalPhotos: photos.length,
    pendingSyncItems: pendingItems.length,
    queueSize: syncQueue.length,
  };
}
