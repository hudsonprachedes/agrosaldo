/**
 * Camada de compatibilidade para funções de sincronização
 * Antes de integração com backend real
 */

import { getDB, getSyncQueueItems, updateSyncQueueItem } from './indexeddb';
import { apiClient } from './api-client';

type HasId = { id: string };

type LocalMovementRecord = {
  id: string;
  serverId?: string;
  syncStatus?: string;
};

type LocalPhotoRecord = {
  movementId: string;
  data: Blob;
  mimeType?: string;
};

/**
 * Sincroniza movimentos pendentes com o servidor
 * Implementa retry com backoff exponencial
 */
export async function syncMovements(): Promise<{
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

        const payload = item.payload as Record<string, unknown>;
        const movementType = String(payload.type ?? 'adjustment');
        const endpoint =
          movementType === 'birth'
            ? '/lancamentos/nascimento'
            : movementType === 'death'
              ? '/lancamentos/mortalidade'
              : movementType === 'sale'
                ? '/lancamentos/venda'
                : movementType === 'vaccine'
                  ? '/lancamentos/vacina'
                  : '/lancamentos';

        const requestBody = {
          type: payload.type,
          date: payload.date,
          quantity: payload.quantity,
          sex: payload.sex,
          ageGroup: payload.ageGroup ?? payload.ageGroupId,
          description: payload.description,
          destination: payload.destination,
          value: payload.value,
          gtaNumber: payload.gtaNumber,
          photoUrl: undefined,
          cause: payload.cause,
        };

        const resp = await apiClient.post(endpoint, requestBody, {
          headers: { 'X-Property-ID': item.propertyId },
        });

        const db = await getDB();
        const localMovement = (await db.get('movements', item.resourceId)) as LocalMovementRecord | undefined;
        const respWithId = resp as unknown as Partial<HasId>;
        if (localMovement && respWithId?.id) {
          const next: LocalMovementRecord = {
            ...localMovement,
            serverId: respWithId.id,
            syncStatus: 'synced',
          };
          await db.put('movements', next);
        }

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
export async function syncPhotos(): Promise<{
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

        const db = await getDB();
        const photo = (await db.get('photos', item.resourceId)) as LocalPhotoRecord | undefined;
        if (!photo) {
          throw new Error('Foto não encontrada no IndexedDB');
        }

        const localMovement = (await db.get('movements', photo.movementId)) as LocalMovementRecord | undefined;
        const serverId = localMovement?.serverId ?? null;
        if (!serverId) {
          await updateSyncQueueItem(item.id, 'pending');
          continue;
        }

        const file = new File([photo.data], 'foto.jpg', { type: photo.mimeType || 'image/jpeg' });
        await apiClient.uploadFile(`/lancamentos/${serverId}/foto`, file);

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
export async function syncAll(): Promise<{
  movements: { success: number; failed: number };
  photos: { success: number; failed: number };
  totalErrors: string[];
}> {
  const [movementResults, photoResults] = await Promise.all([syncMovements(), syncPhotos()]);

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
export function setupAutoSync(): () => void {
  const handleOnline = async () => {
    console.log('🌐 Conexão restaurada, iniciando sincronização...');
    const results = await syncAll();
    
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
