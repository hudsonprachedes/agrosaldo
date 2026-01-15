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
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface SyncQueueItem {
  id: string;
  propertyId: string;
  type: 'movement' | 'photo' | 'delete';
  resourceId: string;
  payload: Record<string, unknown>;
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

// ============================================================================
// ONBOARDING E ESTOQUE INICIAL
// ============================================================================

export interface StoredInitialStock {
  id: string;
  propertyId: string;
  species: 'bovino' | 'bubalino';
  sex: 'male' | 'female';
  ageGroupId: string;
  quantity: number;
  createdAt: string;
}

export interface StoredOnboardingStatus {
  propertyId: string;
  completed: boolean;
  speciesEnabled: { bovino: boolean; bubalino: boolean };
  completedAt?: string;
}

// ============================================================================
// OUTRAS ESPÉCIES
// ============================================================================

export interface StoredSpeciesBalance {
  id: string;
  propertyId: string;
  species: string;
  count: number;
  updatedAt: string;
}

export interface StoredSpeciesAdjustment {
  id: string;
  propertyId: string;
  species: string;
  previousCount: number;
  newCount: number;
  quantityChanged: number;
  reason?: string;
  createdAt: string;
}

// ============================================================================
// QUESTIONÁRIO EPIDEMIOLÓGICO
// ============================================================================

export interface StoredEpidemiologySurvey {
  id: string;
  propertyId: string;
  version: number;
  answers: Array<{ fieldId: string; value: unknown }>;
  submittedAt: string;
  nextDueAt: string;
}

// ============================================================================
// NOTIFICAÇÕES
// ============================================================================

export interface StoredNotification {
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

// Vazio - apenas estende IDBPDatabase com tipagem correta
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
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

      // Store de estoque inicial (onboarding)
      if (!db.objectStoreNames.contains('initialStock')) {
        const initStockStore = db.createObjectStore('initialStock', {
          keyPath: 'id',
        });
        initStockStore.createIndex('propertyId', 'propertyId');
        initStockStore.createIndex('propertyId-species', ['propertyId', 'species']);
      }

      // Store de status de onboarding
      if (!db.objectStoreNames.contains('onboardingStatus')) {
        db.createObjectStore('onboardingStatus', { keyPath: 'propertyId' });
      }

      // Store de saldo de outras espécies
      if (!db.objectStoreNames.contains('speciesBalances')) {
        const speciesStore = db.createObjectStore('speciesBalances', {
          keyPath: 'id',
        });
        speciesStore.createIndex('propertyId', 'propertyId');
        speciesStore.createIndex('propertyId-species', ['propertyId', 'species']);
      }

      // Store de histórico de ajustes de outras espécies
      if (!db.objectStoreNames.contains('speciesAdjustments')) {
        const adjustStore = db.createObjectStore('speciesAdjustments', {
          keyPath: 'id',
        });
        adjustStore.createIndex('propertyId', 'propertyId');
        adjustStore.createIndex('propertyId-species', ['propertyId', 'species']);
        adjustStore.createIndex('createdAt', 'createdAt');
      }

      // Store de questionários epidemiológicos
      if (!db.objectStoreNames.contains('epidemiologySurveys')) {
        const surveyStore = db.createObjectStore('epidemiologySurveys', {
          keyPath: 'id',
        });
        surveyStore.createIndex('propertyId', 'propertyId');
        surveyStore.createIndex('submittedAt', 'submittedAt');
      }

      // Store de notificações
      if (!db.objectStoreNames.contains('notifications')) {
        const notifStore = db.createObjectStore('notifications', {
          keyPath: 'id',
        });
        notifStore.createIndex('propertyId', 'propertyId');
        notifStore.createIndex('userId', 'userId');
        notifStore.createIndex('status', 'status');
        notifStore.createIndex('createdAt', 'createdAt');
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
  movement: Omit<StoredMovement, 'id' | 'syncStatus' | 'syncAttempts'>
): Promise<StoredMovement> {
  const db = await getDB();
  const stored: StoredMovement = {
    ...movement,
    id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    syncStatus: 'pending',
    syncAttempts: 0,
  } as StoredMovement;

  await db.add('movements', stored);

  await addToSyncQueue({
    propertyId: stored.propertyId,
    type: 'movement',
    resourceId: stored.id,
    payload: stored as Record<string, unknown>,
    status: 'pending',
  });

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

  await addToSyncQueue({
    propertyId: movementId.split('-')[1] || 'unknown',
    type: 'photo',
    resourceId: photo.id,
    payload: photo as Record<string, unknown>,
    status: 'pending',
  });

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
export async function getSyncMetadata(key: string): Promise<unknown> {
  const db = await getDB();
  const metadata = await db.get('syncMetadata', key);
  return metadata?.value;
}

/**
 * Salvar metadata de sincronização
 */
export async function setSyncMetadata(key: string, value: unknown): Promise<void> {
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
    .count('pending');

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
    lastSyncTime: lastSync as string | undefined,
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
// ============================================================================
// INICIAL STOCK (ONBOARDING)
// ============================================================================

/**
 * Salvar entrada de estoque inicial
 */
export async function saveInitialStockEntry(
  entry: Omit<StoredInitialStock, 'id' | 'createdAt'>
): Promise<StoredInitialStock> {
  const db = await getDB();

  const stored: StoredInitialStock = {
    ...entry,
    id: `init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  await db.add('initialStock', stored);
  return stored;
}

/**
 * Obter estoque inicial de uma propriedade
 */
export async function getInitialStock(propertyId: string): Promise<StoredInitialStock[]> {
  const db = await getDB();
  const index = db.transaction('initialStock').store.index('propertyId');
  return index.getAll(propertyId);
}

/**
 * Marcar onboarding como completo
 */
export async function completeOnboarding(
  propertyId: string,
  speciesEnabled: { bovino: boolean; bubalino: boolean }
): Promise<void> {
  const db = await getDB();

  const status: StoredOnboardingStatus = {
    propertyId,
    completed: true,
    speciesEnabled,
    completedAt: new Date().toISOString(),
  };

  await db.put('onboardingStatus', status);
}

/**
 * Verificar se onboarding foi completado
 */
export async function isOnboardingCompleted(propertyId: string): Promise<boolean> {
  const db = await getDB();
  const status = await db.get('onboardingStatus', propertyId);
  return status?.completed ?? false;
}

/**
 * Obter status do onboarding
 */
export async function getOnboardingStatus(
  propertyId: string
): Promise<StoredOnboardingStatus | null> {
  const db = await getDB();
  return (await db.get('onboardingStatus', propertyId)) || null;
}

// ============================================================================
// OUTRAS ESPÉCIES
// ============================================================================

/**
 * Salvar ou atualizar saldo de espécie
 */
export async function saveSpeciesBalance(
  balance: Omit<StoredSpeciesBalance, 'id' | 'updatedAt'>
): Promise<StoredSpeciesBalance> {
  const db = await getDB();

  // Verifica se já existe
  const index = db.transaction('speciesBalances').store.index('propertyId-species');
  const existing = await index.getAll([balance.propertyId, balance.species]);

  if (existing.length > 0) {
    const updated = {
      ...existing[0],
      ...balance,
      updatedAt: new Date().toISOString(),
    };
    await db.put('speciesBalances', updated);
    return updated;
  }

  const stored: StoredSpeciesBalance = {
    ...balance,
    id: `species-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    updatedAt: new Date().toISOString(),
  };

  await db.add('speciesBalances', stored);
  return stored;
}

/**
 * Obter saldos de outras espécies de uma propriedade
 */
export async function getSpeciesBalances(propertyId: string): Promise<StoredSpeciesBalance[]> {
  const db = await getDB();
  const index = db.transaction('speciesBalances').store.index('propertyId');
  return index.getAll(propertyId);
}

/**
 * Registrar ajuste de espécie
 */
export async function saveSpeciesAdjustment(
  adjustment: Omit<StoredSpeciesAdjustment, 'id' | 'createdAt'>
): Promise<StoredSpeciesAdjustment> {
  const db = await getDB();

  const stored: StoredSpeciesAdjustment = {
    ...adjustment,
    id: `adj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  await db.add('speciesAdjustments', stored);
  return stored;
}

/**
 * Obter histórico de ajustes de uma espécie
 */
export async function getSpeciesAdjustments(
  propertyId: string,
  species?: string
): Promise<StoredSpeciesAdjustment[]> {
  const db = await getDB();
  const index = db.transaction('speciesAdjustments').store.index('propertyId');
  const all = await index.getAll(propertyId);

  if (species) {
    return all.filter((a) => a.species === species);
  }

  return all;
}

// ============================================================================
// QUESTIONÁRIO EPIDEMIOLÓGICO
// ============================================================================

/**
 * Salvar resposta de questionário epidemiológico
 */
export async function saveEpidemiologySurvey(
  survey: Omit<StoredEpidemiologySurvey, 'id'>
): Promise<StoredEpidemiologySurvey> {
  const db = await getDB();

  const stored: StoredEpidemiologySurvey = {
    ...survey,
    id: `survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  await db.add('epidemiologySurveys', stored);
  return stored;
}

/**
 * Obter última submissão de questionário
 */
export async function getLastEpidemiologySurvey(
  propertyId: string
): Promise<StoredEpidemiologySurvey | null> {
  const db = await getDB();
  const index = db.transaction('epidemiologySurveys').store.index('propertyId');
  const surveys = await index.getAll(propertyId);

  if (surveys.length === 0) return null;

  // Retorna a mais recente
  return surveys.reduce((latest, current) =>
    new Date(current.submittedAt) > new Date(latest.submittedAt) ? current : latest
  );
}

/**
 * Obter histórico de questionários
 */
export async function getEpidemiologySurveyHistory(
  propertyId: string
): Promise<StoredEpidemiologySurvey[]> {
  const db = await getDB();
  const index = db.transaction('epidemiologySurveys').store.index('propertyId');
  return index.getAll(propertyId);
}

// ============================================================================
// NOTIFICAÇÕES
// ============================================================================

/**
 * Salvar notificação
 */
export async function saveNotification(
  notification: Omit<StoredNotification, 'id'>
): Promise<StoredNotification> {
  const db = await getDB();

  const stored: StoredNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  await db.add('notifications', stored);
  return stored;
}

/**
 * Obter notificações não lidas
 */
export async function getUnreadNotifications(propertyId?: string): Promise<StoredNotification[]> {
  const db = await getDB();
  const index = db.transaction('notifications').store.index('status');
  const unread = await index.getAll('unread');

  if (propertyId) {
    return unread.filter((n) => n.propertyId === propertyId);
  }

  return unread;
}

/**
 * Marcar notificação como lida
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  const db = await getDB();
  const notification = await db.get('notifications', id);

  if (notification) {
    notification.status = 'read';
    notification.readAt = new Date().toISOString();
    await db.put('notifications', notification);
  }
}

/**
 * Obter notificações de uma propriedade
 */
export async function getPropertyNotifications(propertyId: string): Promise<StoredNotification[]> {
  const db = await getDB();
  const index = db.transaction('notifications').store.index('propertyId');
  return index.getAll(propertyId);
}

/**
 * Obter todas as notificações (paginado)
 */
export async function getAllNotifications(
  limit: number = 50,
  offset: number = 0
): Promise<StoredNotification[]> {
  const db = await getDB();
  const all = await db.getAll('notifications');
  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit);
}

/**
 * Excluir notificação
 */
export async function deleteNotification(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('notifications', id);
}

/**
 * Excluir todas as notificações (opcionalmente filtrando por propriedade e/ou usuário)
 */
export async function deleteNotifications(
  filter: { propertyId?: string; userId?: string } = {}
): Promise<void> {
  const db = await getDB();
  const all = await db.getAll('notifications');

  const toDelete = all.filter((n) => {
    if (filter.propertyId && n.propertyId !== filter.propertyId) return false;
    if (filter.userId && n.userId !== filter.userId) return false;
    return true;
  });

  await Promise.all(toDelete.map((n) => db.delete('notifications', n.id)));
}

// ============================================================================
// ALIASES PARA COMPATIBILIDADE
// ============================================================================

export const saveMovement = saveMovementOffline;
export const savePhoto = savePhotoOffline;