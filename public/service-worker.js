/**
 * Service Worker para AgroSaldo
 * Gerencia cache e sincronização offline-first
 */

const CACHE_NAME = 'agrosaldo-v1';
const API_CACHE_NAME = 'agrosaldo-api-v1';

// Recursos para cache estático
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static resources');
      return cache.addAll(STATIC_RESOURCES);
    })
  );
  
  // Ativa imediatamente sem esperar
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Assumir controle imediatamente
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições de extensões do navegador
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }

  // Strategy: Network First para APIs, Cache First para assets
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
  } else {
    event.respondWith(cacheFirstStrategy(request));
  }
});

/**
 * Cache First: Tenta buscar do cache, se não houver busca da rede
 * Ideal para assets estáticos
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    
    // Retornar página offline se disponível
    return caches.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

/**
 * Network First: Tenta buscar da rede, se falhar busca do cache
 * Ideal para requisições de API
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Você está offline. Tente novamente quando houver conexão.' 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-movements') {
    event.waitUntil(syncMovements());
  }
  
  if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos());
  }
});

/**
 * Sincroniza movimentos pendentes quando internet retorna
 */
async function syncMovements() {
  console.log('[Service Worker] Syncing movements...');
  
  try {
    // Envia mensagem para o cliente ativo para processar sincronização
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_MOVEMENTS',
        timestamp: Date.now(),
      });
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Sync movements failed:', error);
    return Promise.reject(error);
  }
}

/**
 * Sincroniza fotos pendentes quando internet retorna
 */
async function syncPhotos() {
  console.log('[Service Worker] Syncing photos...');
  
  try {
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_PHOTOS',
        timestamp: Date.now(),
      });
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Sync photos failed:', error);
    return Promise.reject(error);
  }
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLAIM_CLIENTS') {
    self.clients.claim();
  }
});

// Push notifications (futuro)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'AgroSaldo';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url,
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Se já houver uma janela aberta, focar nela
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Caso contrário, abrir nova janela
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[Service Worker] Loaded successfully');
