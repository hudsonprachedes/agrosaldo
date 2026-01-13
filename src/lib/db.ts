/**
 * Camada de compatibilidade IndexedDB para db.ts
 * Reexporta funções principais de indexeddb.ts e db-compat.ts
 */

// Reexportar tudo de indexeddb.ts
export {
  StoredMovement,
  StoredPhoto,
  SyncQueueItem,
  NewsletterSubscriber,
  StoredUser,
  StoredProperty,
  StoredInitialStock,
  StoredOnboardingStatus,
  StoredSpeciesBalance,
  StoredSpeciesAdjustment,
  StoredEpidemiologySurvey,
  StoredNotification,
  AgroSaldoDB,
  initDB,
  getDB,
  saveMovementOffline,
  getPendingMovements,
  updateMovementSyncStatus,
  addToSyncQueue,
  getSyncQueueItems,
  updateSyncQueueItem,
  savePhotoOffline,
  getPhotosForMovement,
  cleanSyncedData,
  getSyncMetadata,
  setSyncMetadata,
  getSyncStats,
  clearDatabase,
  addNewsletterSubscriber,
  getNewsletterCount,
  getAllNewsletterSubscribers,
  isEmailSubscribed,
  saveInitialStockEntry,
  getInitialStock,
  completeOnboarding,
  isOnboardingCompleted,
  getOnboardingStatus,
  saveSpeciesBalance,
  getSpeciesBalances,
  saveSpeciesAdjustment,
  getSpeciesAdjustments,
  saveEpidemiologySurvey,
  getLastEpidemiologySurvey,
  getEpidemiologySurveyHistory,
  saveNotification,
  getUnreadNotifications,
  markNotificationAsRead,
  getPropertyNotifications,
  getAllNotifications,
} from './indexeddb';

// Reexportar funções de sincronização
export {
  syncMovements,
  syncPhotos,
  syncAll,
  setupAutoSync,
  getPendingSyncItems,
  getDatabaseStats,
} from './db-compat';

// Aliases para compatibilidade com código existente
import { 
  saveMovementOffline, 
  savePhotoOffline, 
  saveSpeciesBalance as saveSpeciesBalanceOriginal,
  saveSpeciesAdjustment as saveSpeciesAdjustmentOriginal,
} from './indexeddb';

export const saveMovement = saveMovementOffline;
export const savePhoto = savePhotoOffline;
export const saveSpeciesBalance = saveSpeciesBalanceOriginal;
export const saveSpeciesAdjustment = saveSpeciesAdjustmentOriginal;
