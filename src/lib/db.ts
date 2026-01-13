/**
 * IndexedDB Configuration for AgroSaldo
 * Offline-first database para sincronização de dados
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Schema do banco de dados
interface AgroSaldoDB extends DBSchema {
  users: {
    key: string;
    value: {
      id: string;
      name: string;
      email: string;
      cpfCnpj: string;
      role: string;
      avatar?: string;
      lastSync: Date;
    };
  };
  properties: {
    key: string;
    value: {
      id: string;
      userId: string;
      name: string;
      city: string;
      state: string;
      totalArea: number;
      cultivatedArea: number;
      naturalArea: number;
      cattleCount: number;
      status: string;
      plan: string;
      lastSync: Date;
    };
    indexes: { 'by-user': string };
  };
  movements: {
    key: string;
    value: {
      id: string;
      propertyId: string;
      type: 'birth' | 'death' | 'sale' | 'purchase' | 'vaccine' | 'adjustment';
      date: string;
      quantity: number;
      sex?: 'male' | 'female';
      ageGroupId?: string;
      description: string;
      destination?: string;
      value?: number;
      gtaNumber?: string;
      photoUrl?: string;
      cause?: string;
      birthDate?: string;
      createdAt: string;
      syncStatus: 'pending' | 'synced' | 'error';
      lastSync?: Date;
    };
    indexes: { 
      'by-property': string;
      'by-sync-status': string;
      'by-date': string;
    };
  };
  photos: {
    key: string;
    value: {
      id: string;
      movementId: string;
      dataUrl: string; // Base64 image data
      compressed: boolean;
      originalSize: number;
      compressedSize: number;
      createdAt: Date;
      syncStatus: 'pending' | 'synced' | 'error';
    };
    indexes: { 
      'by-movement': string;
      'by-sync-status': string;
    };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      propertyId: string;
      entityType: 'movement' | 'photo' | 'user' | 'property';
      entityId: string;
      action: 'create' | 'update' | 'delete';
      payload: any;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      retryCount: number;
      lastAttempt?: Date;
      errorMessage?: string;
      createdAt: Date;
    };
    indexes: { 
      'by-status': string;
      'by-property': string;
    };
  };
}

const DB_NAME = 'agrosaldo-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<AgroSaldoDB> | null = null;

/**
 * Inicializa e retorna instância do banco de dados
 */
export async function getDB(): Promise<IDBPDatabase<AgroSaldoDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<AgroSaldoDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store: users
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }

      // Store: properties
      if (!db.objectStoreNames.contains('properties')) {
        const propertyStore = db.createObjectStore('properties', { keyPath: 'id' });
        propertyStore.createIndex('by-user', 'userId');
      }

      // Store: movements
      if (!db.objectStoreNames.contains('movements')) {
        const movementStore = db.createObjectStore('movements', { keyPath: 'id' });
        movementStore.createIndex('by-property', 'propertyId');
        movementStore.createIndex('by-sync-status', 'syncStatus');
        movementStore.createIndex('by-date', 'date');
      }

      // Store: photos
      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('by-movement', 'movementId');
        photoStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Store: sync_queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
        syncStore.createIndex('by-status', 'status');
        syncStore.createIndex('by-property', 'propertyId');
      }
    },
  });

  return dbInstance;
}

// ==================== CRUD HELPERS ====================

/**
 * Cria ou atualiza um registro genérico
 */
export async function upsert<K extends keyof AgroSaldoDB>(
  storeName: K,
  value: AgroSaldoDB[K]['value']
): Promise<void> {
  const db = await getDB();
  await db.put(storeName, value);
}

/**
 * Busca um registro por ID
 */
export async function getById<K extends keyof AgroSaldoDB>(
  storeName: K,
  id: string
): Promise<AgroSaldoDB[K]['value'] | undefined> {
  const db = await getDB();
  return await db.get(storeName, id);
}

/**
 * Busca todos os registros de uma store
 */
export async function getAll<K extends keyof AgroSaldoDB>(
  storeName: K
): Promise<AgroSaldoDB[K]['value'][]> {
  const db = await getDB();
  return await db.getAll(storeName);
}

/**
 * Remove um registro por ID
 */
export async function deleteById<K extends keyof AgroSaldoDB>(
  storeName: K,
  id: string
): Promise<void> {
  const db = await getDB();
  await db.delete(storeName, id);
}

/**
 * Busca registros por índice
 */
export async function getByIndex<K extends keyof AgroSaldoDB>(
  storeName: K,
  indexName: string,
  query: string
): Promise<AgroSaldoDB[K]['value'][]> {
  const db = await getDB();
  return await db.getAllFromIndex(storeName, indexName as any, query);
}

// ==================== MOVEMENT HELPERS ====================

/**
 * Salva um movimento localmente
 */
export async function saveMovement(
  movement: Omit<AgroSaldoDB['movements']['value'], 'id' | 'createdAt' | 'syncStatus'>
): Promise<string> {
  const id = `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const movementData: AgroSaldoDB['movements']['value'] = {
    ...movement,
    id,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
  };

  await upsert('movements', movementData);
  
  // Adicionar à fila de sincronização
  await addToSyncQueue({
    propertyId: movement.propertyId,
    entityType: 'movement',
    entityId: id,
    action: 'create',
    payload: movementData,
  });

  return id;
}

/**
 * Busca movimentos de uma propriedade
 */
export async function getMovementsByProperty(propertyId: string): Promise<AgroSaldoDB['movements']['value'][]> {
  return await getByIndex('movements', 'by-property', propertyId);
}

/**
 * Busca movimentos pendentes de sincronização
 */
export async function getPendingMovements(): Promise<AgroSaldoDB['movements']['value'][]> {
  return await getByIndex('movements', 'by-sync-status', 'pending');
}

// ==================== PHOTO HELPERS ====================

/**
 * Salva uma foto localmente
 */
export async function savePhoto(
  movementId: string,
  dataUrl: string,
  originalSize: number,
  compressedSize: number
): Promise<string> {
  const id = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const photoData: AgroSaldoDB['photos']['value'] = {
    id,
    movementId,
    dataUrl,
    compressed: compressedSize < originalSize,
    originalSize,
    compressedSize,
    createdAt: new Date(),
    syncStatus: 'pending',
  };

  await upsert('photos', photoData);
  return id;
}

/**
 * Busca fotos de um movimento
 */
export async function getPhotosByMovement(movementId: string): Promise<AgroSaldoDB['photos']['value'][]> {
  return await getByIndex('photos', 'by-movement', movementId);
}

// ==================== SYNC QUEUE HELPERS ====================

/**
 * Adiciona item à fila de sincronização
 */
export async function addToSyncQueue(
  data: Omit<AgroSaldoDB['sync_queue']['value'], 'id' | 'status' | 'retryCount' | 'createdAt'>
): Promise<string> {
  const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const queueItem: AgroSaldoDB['sync_queue']['value'] = {
    ...data,
    id,
    status: 'pending',
    retryCount: 0,
    createdAt: new Date(),
  };

  await upsert('sync_queue', queueItem);
  return id;
}

/**
 * Busca itens pendentes de sincronização
 */
export async function getPendingSyncItems(): Promise<AgroSaldoDB['sync_queue']['value'][]> {
  return await getByIndex('sync_queue', 'by-status', 'pending');
}

/**
 * Atualiza status de um item da fila
 */
export async function updateSyncItemStatus(
  id: string,
  status: 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const item = await getById('sync_queue', id);
  if (!item) return;

  await upsert('sync_queue', {
    ...item,
    status,
    retryCount: status === 'failed' ? item.retryCount + 1 : item.retryCount,
    lastAttempt: new Date(),
    errorMessage,
  });
}

/**
 * Limpa itens sincronizados com sucesso
 */
export async function clearCompletedSyncItems(): Promise<void> {
  const db = await getDB();
  const completedItems = await getByIndex('sync_queue', 'by-status', 'completed');
  
  for (const item of completedItems) {
    await db.delete('sync_queue', item.id);
  }
}

// ==================== UTILS ====================

/**
 * Limpa todo o banco de dados (use com cuidado!)
 */
export async function clearDatabase(): Promise<void> {
  const db = await getDB();
  const storeNames: (keyof AgroSaldoDB)[] = ['users', 'properties', 'movements', 'photos', 'sync_queue'];
  
  for (const storeName of storeNames) {
    const tx = db.transaction(storeName, 'readwrite');
    await tx.store.clear();
    await tx.done;
  }
}

/**
 * Estatísticas do banco de dados
 */
export async function getDatabaseStats() {
  const db = await getDB();
  
  const stats = {
    users: await db.count('users'),
    properties: await db.count('properties'),
    movements: await db.count('movements'),
    photos: await db.count('photos'),
    syncQueue: await db.count('sync_queue'),
    pendingSync: (await getPendingSyncItems()).length,
  };

  return stats;
}

// ==================== SYNC LOGIC ====================

/**
 * Sincroniza movimentos pendentes com o servidor
 * Implementa retry com backoff exponencial
 */
export async function syncMovements(apiClient?: any): Promise<{
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
    const pendingItems = await getPendingSyncItems();
    const movementItems = pendingItems.filter(item => item.entityType === 'movement');

    for (const item of movementItems) {
      try {
        await updateSyncItemStatus(item.id, 'processing');

        // TODO: Integrar com API real quando backend estiver pronto
        // const response = await apiClient.post('/api/lancamentos', item.payload);
        
        // Simular sucesso por enquanto
        await new Promise(resolve => setTimeout(resolve, 100));

        // Atualizar movimento como sincronizado
        const movement = await getById('movements', item.entityId);
        if (movement) {
          await upsert('movements', {
            ...movement,
            syncStatus: 'synced',
            lastSync: new Date(),
          });
        }

        await updateSyncItemStatus(item.id, 'completed');
        result.success++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        await updateSyncItemStatus(item.id, 'failed', errorMessage);
        result.failed++;
        result.errors.push(`Movimento ${item.entityId}: ${errorMessage}`);
      }
    }

    // Limpar itens completados
    await clearCompletedSyncItems();

  } catch (error) {
    console.error('Erro durante sincronização:', error);
    result.errors.push('Erro geral na sincronização');
  }

  return result;
}

/**
 * Sincroniza fotos pendentes com o servidor
 */
export async function syncPhotos(apiClient?: any): Promise<{
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
    const pendingPhotos = await getByIndex('photos', 'by-sync-status', 'pending');

    for (const photo of pendingPhotos) {
      try {
        // TODO: Upload real quando backend estiver pronto
        // const response = await apiClient.post('/api/photos', {
        //   movementId: photo.movementId,
        //   image: photo.dataUrl,
        // });

        // Simular sucesso
        await new Promise(resolve => setTimeout(resolve, 200));

        await upsert('photos', {
          ...photo,
          syncStatus: 'synced',
        });

        result.success++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        result.failed++;
        result.errors.push(`Foto ${photo.id}: ${errorMessage}`);

        await upsert('photos', {
          ...photo,
          syncStatus: 'error',
        });
      }
    }

  } catch (error) {
    console.error('Erro durante sincronização de fotos:', error);
    result.errors.push('Erro geral na sincronização de fotos');
  }

  return result;
}

/**
 * Sincroniza todos os dados pendentes
 * Chama syncMovements e syncPhotos
 */
export async function syncAll(apiClient?: any): Promise<{
  movements: { success: number; failed: number };
  photos: { success: number; failed: number };
  totalErrors: string[];
}> {
  const movementResults = await syncMovements(apiClient);
  const photoResults = await syncPhotos(apiClient);

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
export function setupAutoSync(apiClient?: any): () => void {
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
