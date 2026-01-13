/**
 * Configuração e utilitários para IndexedDB
 * Permite armazenamento de dados offline com sincronização automática
 */

import { openDB, IDBPDatabase } from 'idb';

export interface StoredMovement {
  id: string;
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
  photoData?: string; // Data URL da foto
  cause?: string;
  propertyId: string;
  createdAt: string;
  birthDate?: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncError?: string;
  syncAttempts: number;
}

export interface StoredPhoto {
  id: string;
  movementId: string;
  data: Blob;
  mimeType: string;
  size: number;
  originalSize: number;
  createdAt: string;
  compressionRatio: number;
}

export interface SyncQueueItem {
  id: string;
  propertyId: string;
  type: 'movement' | 'photo' | 'delete';
  resourceId: string;
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  createdAt: string;
  lastAttempt?: string;
  attempts: number;
  error?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source: 'landing_page' | 'blog' | 'contact';
  confirmed: boolean;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  role: 'super_admin' | 'owner' | 'manager' | 'operator';
  avatar?: string;
  lastSyncedAt?: string;
}

export interface StoredProperty {
  id: string;
  userId: string;
  name: string;
  city: string;
  state: string;
  totalArea: number;
  cultivatedArea: number;
  naturalArea: number;
  cattleCount: number;
  status: 'active' | 'pending' | 'suspended';
  plan: 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';
  lastSyncedAt?: string;
}

export interface AgroSaldoDB extends IDBPDatabase {
  // Store methods will be available via object notation
}

/**
 * Inicializa o banco de dados IndexedDB
 */
export async function initDB(): Promise<AgroSaldoDB> {
  return openDB('AgroSaldoDB', 1, {
    upgrade(db) {
      // Store de movimentos (lançamentos)
      if (!db.objectStoreNames.contains('movements')) {
        const movStore = db.createObjectStore('movements', {
          keyPath: 'id',
        });
        movStore.createIndex('propertyId', 'propertyId');
        movStore.createIndex('syncStatus', 'syncStatus');
        movStore.createIndex('createdAt', 'createdAt');
        movStore.createIndex('propertyId-date', ['propertyId', 'date']);
      }

      // Store de fotos
      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', {
          keyPath: 'id',
        });
        photoStore.createIndex('movementId', 'movementId');
        photoStore.createIndex('syncStatus', 'syncStatus');
      }

      // Store de fila de sincronização
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', {
          keyPath: 'id',
        });
        syncStore.createIndex('propertyId', 'propertyId');
        syncStore.createIndex('status', 'status');
        syncStore.createIndex('createdAt', 'createdAt');
      }

      // Store de usuários (cache)
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }

      // Store de propriedades (cache)
      if (!db.objectStoreNames.contains('properties')) {
        const propStore = db.createObjectStore('properties', {
          keyPath: 'id',
        });
        propStore.createIndex('userId', 'userId');
      }

      // Store de metadata de sincronização
      if (!db.objectStoreNames.contains('syncMetadata')) {
        db.createObjectStore('syncMetadata', { keyPath: 'key' });
      }

      // Store de newsletter subscribers
      if (!db.objectStoreNames.contains('newsletter')) {
        const newsletterStore = db.createObjectStore('newsletter', {
          keyPath: 'id',
        });
        newsletterStore.createIndex('email', 'email', { unique: true });
        newsletterStore.createIndex('subscribedAt', 'subscribedAt');
      }
    },
  }) as Promise<AgroSaldoDB>;
}

/**
 * Obter instância do DB (singleton)
 */
let dbInstance: AgroSaldoDB | null = null;

export async function getDB(): Promise<AgroSaldoDB> {
  if (!dbInstance) {
    dbInstance = await initDB();
  }
  return dbInstance;
}

/**
 * Salvar um movimento offline
 */
export async function saveMovementOffline(
  movement: Omit<StoredMovement, 'syncStatus' | 'syncAttempts'>
): Promise<StoredMovement> {
  const db = await getDB();
  const stored: StoredMovement = {
    ...movement,
    syncStatus: 'pending',
    syncAttempts: 0,
  };

  await db.add('movements', stored);
  return stored;
}

/**
 * Obter movimentos pendentes de sincronização
 */
export async function getPendingMovements(
  propertyId?: string
): Promise<StoredMovement[]> {
  const db = await getDB();
  const index = db
    .transaction('movements')
    .store.index('syncStatus');

  const results = await index.getAll('pending');

  if (propertyId) {
    return results.filter((m) => m.propertyId === propertyId);
  }

  return results;
}

/**
 * Atualizar status de sincronização de um movimento
 */
export async function updateMovementSyncStatus(
  id: string,
  status: 'pending' | 'syncing' | 'synced' | 'failed',
  error?: string
): Promise<void> {
  const db = await getDB();
  const movement = await db.get('movements', id);

  if (!movement) throw new Error(`Movimento ${id} não encontrado`);

  movement.syncStatus = status;
  movement.syncError = error;
  movement.syncAttempts += 1;

  await db.put('movements', movement);
}

/**
 * Adicionar item à fila de sincronização
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'attempts' | 'createdAt'>): Promise<string> {
  const db = await getDB();
  const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const queueItem: SyncQueueItem = {
    ...item,
    id,
    attempts: 0,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  await db.add('syncQueue', queueItem);
  return id;
}

/**
 * Obter itens da fila de sincronização pendentes
 */
export async function getSyncQueueItems(
  status: 'pending' | 'syncing' | 'synced' | 'failed' = 'pending'
): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const index = db.transaction('syncQueue').store.index('status');
  return index.getAll(status);
}

/**
 * Atualizar item da fila de sincronização
 */
export async function updateSyncQueueItem(
  id: string,
  status: 'pending' | 'syncing' | 'synced' | 'failed',
  error?: string
): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', id);

  if (!item) throw new Error(`Sync queue item ${id} não encontrado`);

  item.status = status;
  item.lastAttempt = new Date().toISOString();
  item.attempts += 1;
  item.error = error;

  await db.put('syncQueue', item);
}

/**
 * Salvar foto comprimida localmente
 */
export async function savePhotoOffline(
  movementId: string,
  photoData: Blob,
  originalSize: number
): Promise<StoredPhoto> {
  const db = await getDB();

  const photo: StoredPhoto = {
    id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    movementId,
    data: photoData,
    mimeType: photoData.type || 'image/jpeg',
    size: photoData.size,
    originalSize,
    createdAt: new Date().toISOString(),
    compressionRatio: Math.round(((originalSize - photoData.size) / originalSize) * 100),
  };

  await db.add('photos', photo);
  return photo;
}

/**
 * Obter fotos de um movimento
 */
export async function getPhotosForMovement(movementId: string): Promise<StoredPhoto[]> {
  const db = await getDB();
  const index = db.transaction('photos').store.index('movementId');
  return index.getAll(movementId);
}

/**
 * Limpar dados sincronizados (após sucesso)
 */
export async function cleanSyncedData(daysToKeep: number = 30): Promise<void> {
  const db = await getDB();
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  // Remover movimentos sincronizados antigos
  const movements = await db.getAll('movements');
  for (const movement of movements) {
    if (
      movement.syncStatus === 'synced' &&
      new Date(movement.createdAt) < cutoffDate
    ) {
      await db.delete('movements', movement.id);
    }
  }

  // Remover itens da fila sincronizados antigos
  const queueItems = await db.getAll('syncQueue');
  for (const item of queueItems) {
    if (
      item.status === 'synced' &&
      new Date(item.createdAt) < cutoffDate
    ) {
      await db.delete('syncQueue', item.id);
    }
  }
}

/**
 * Obter metadata de sincronização
 */
export async function getSyncMetadata(key: string): Promise<any> {
  const db = await getDB();
  const metadata = await db.get('syncMetadata', key);
  return metadata?.value;
}

/**
 * Salvar metadata de sincronização
 */
export async function setSyncMetadata(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('syncMetadata', { key, value });
}

/**
 * Obter estatísticas de sincronização
 */
export async function getSyncStats(): Promise<{
  totalPending: number;
  totalFailed: number;
  totalSynced: number;
  lastSyncTime?: string;
  queueSize: number;
}> {
  const db = await getDB();

  const pendingMovements = await db
    .transaction('movements')
    .store.index('syncStatus')
    .countAll();

  const failedQueue = await db
    .transaction('syncQueue')
    .store.index('status')
    .count('failed');

  const syncedQueue = await db
    .transaction('syncQueue')
    .store.index('status')
    .count('synced');

  const queueItems = await db.getAll('syncQueue');
  const lastSync = await getSyncMetadata('lastSyncTime');

  return {
    totalPending: pendingMovements,
    totalFailed: failedQueue,
    totalSynced: syncedQueue,
    lastSyncTime: lastSync,
    queueSize: queueItems.length,
  };
}

/**
 * Limpar todo o banco de dados (para logout)
 */
export async function clearDatabase(): Promise<void> {
  const db = await getDB();

  await Promise.all([
    db.clear('movements'),
    db.clear('photos'),
    db.clear('syncQueue'),
    db.clear('users'),
    db.clear('properties'),
    db.clear('syncMetadata'),
    db.clear('newsletter'),
  ]);
}

/**
 * Newsletter Subscribers Functions
 */

/**
 * Adicionar subscriber de newsletter
 */
export async function addNewsletterSubscriber(
  email: string,
  source: 'landing_page' | 'blog' | 'contact' = 'landing_page'
): Promise<NewsletterSubscriber> {
  const db = await getDB();
  
  // Verifica se já existe
  const existing = await db.getFromIndex('newsletter', 'email', email);
  if (existing) {
    throw new Error('Email já cadastrado na newsletter');
  }

  const subscriber: NewsletterSubscriber = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email,
    subscribedAt: new Date().toISOString(),
    source,
    confirmed: false, // TODO: Implementar confirmação por email
  };

  await db.add('newsletter', subscriber);
  return subscriber;
}

/**
 * Obter total de inscritos na newsletter
 */
export async function getNewsletterCount(): Promise<number> {
  const db = await getDB();
  return db.count('newsletter');
}

/**
 * Obter todos os inscritos
 */
export async function getAllNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const db = await getDB();
  return db.getAll('newsletter');
}

/**
 * Verificar se email já está inscrito
 */
export async function isEmailSubscribed(email: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.getFromIndex('newsletter', 'email', email);
  return !!existing;
}
