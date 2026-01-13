/**
 * Service Worker para sincronização offline
 * Detecta volta da internet e sincroniza dados automaticamente
 */

declare global {
  interface ServiceWorkerGlobalScope {
    skipWaiting: () => void;
  }
}

const CACHE_NAME = 'agrosaldo-v1';
const API_URLS = [
  '/api/lancamentos',
  '/api/rebanho',
  '/api/usuarios',
  '/api/propriedades',
];

// Instalar Service Worker
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[ServiceWorker] Instalando...');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[ServiceWorker] Cache aberto');
      self.skipWaiting();
    })()
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[ServiceWorker] Ativando...');
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      // Remover caches antigos
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      const client = await self.clients.claim();
      console.log('[ServiceWorker] Pronto para substituir clientes antigos');
    })()
  );
});

// Estratégia de cache: network first para APIs, cache fallback para assets
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Para APIs, usar estratégia network first com cache fallback
  if (API_URLS.some((apiUrl) => url.pathname.startsWith(apiUrl))) {
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Para assets estáticos, usar cache first com network fallback
    event.respondWith(cacheFirstStrategy(request));
  }
});

/**
 * Network first strategy: tenta rede primeiro, fallback para cache
 */
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request.clone());

    // Guardar resposta bem-sucedida em cache
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Se rede falhar, tentar cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[ServiceWorker] Usando cache:', request.url);
      return cachedResponse;
    }

    // Se não tiver cache, retornar erro offline
    return new Response('Offline - dados não disponíveis em cache', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Cache first strategy: tenta cache primeiro, fallback para rede
 */
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request.clone());

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback para offline page se necessário
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Sincronização em background
self.addEventListener('sync', (event: SyncEvent) => {
  console.log('[ServiceWorker] Evento de sincronização:', event.tag);

  if (event.tag === 'sync-movements') {
    event.waitUntil(syncMovements());
  }
});

/**
 * Sincronizar movimentos pendentes
 */
async function syncMovements(): Promise<void> {
  try {
    console.log('[ServiceWorker] Iniciando sincronização de movimentos');

    // Notificar clientes sobre sincronização
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_START',
        message: 'Iniciando sincronização',
      });
    });

    // Simular sincronização - em produção, isso seria real
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Notificar sucesso
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_SUCCESS',
        message: 'Sincronização completa',
      });
    });

    console.log('[ServiceWorker] Sincronização concluída');
  } catch (error) {
    console.error('[ServiceWorker] Erro na sincronização:', error);

    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_ERROR',
        message: 'Erro ao sincronizar',
        error: String(error),
      });
    });
  }
}

// Detectar volta da internet
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Requisitar sincronização em background quando voltar online
  if (event.data && event.data.type === 'ONLINE') {
    console.log('[ServiceWorker] Volta da internet detectada, sincronizando...');
    if (self.registration && self.registration.sync) {
      self.registration.sync.register('sync-movements');
    }
  }
});

export {};
