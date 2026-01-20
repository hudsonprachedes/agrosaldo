import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export function createAppPersister() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return createSyncStoragePersister({
    storage: window.localStorage,
    key: 'agrosaldo_tanstack_query_cache_v1',
    throttleTime: 1000,
  });
}
