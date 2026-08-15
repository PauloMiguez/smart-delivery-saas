// Service Worker para Smart Delivery SaaS
const CACHE_NAME = 'smart-delivery-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/favicon.png',
  '/icons.svg',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/socket.io/') ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('tidbcloud.com')
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// ============================================
// NOTIFICAÇÕES PUSH - VERSÃO FINAL
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] 🔔 Push recebido!');
  
  let title = 'Smart Delivery';
  let body = 'Você tem uma nova notificação!';
  let icon = '/favicon.png';
  let badge = '/favicon.png';
  let tag = `notification-${Date.now()}`;
  let orderId = null;
  let token = null;
  let url = '/';
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] 📦 Payload:', payload);
      
      title = payload.title || title;
      body = payload.body || body;
      icon = payload.icon || icon;
      badge = payload.badge || badge;
      tag = payload.tag || tag;
      
      // Extrair orderId e token de várias fontes
      orderId = payload.orderId || payload.data?.orderId || null;
      token = payload.token || payload.data?.token || null;
      url = payload.url || payload.data?.url || '/';
      
      console.log('[SW] 📦 orderId=' + orderId + ', token=' + (token ? '✅ presente' : '❌ ausente'));
    } catch (error) {
      console.log('[SW] ❌ Erro ao parsear payload:', error);
      body = event.data.text() || body;
    }
  }
  
  // Construir URL do pedido
  let targetUrl = url;
  if (orderId && token) {
    targetUrl = `/track/${orderId}?token=${token}`;
    console.log('[SW] 🎯 URL construída:', targetUrl);
  }
  
  const options = {
    body: body,
    icon: icon,
    badge: badge,
    tag: tag,
    data: { 
      orderId: orderId,
      token: token,
      url: targetUrl,
      targetUrl: targetUrl
    },
    vibrate: [200, 100, 200],
    requireInteraction: true,
    // ✅ Botão único para evitar confusão
    actions: [
      { action: 'open', title: '📦 Ver pedido' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW] ✅ Notificação exibida'))
      .catch((error) => console.log('[SW] ❌ Erro ao exibir:', error))
  );
});

// ============================================
// CLIQUE NA NOTIFICAÇÃO - VERSÃO FINAL
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Notificação clicada!');
  console.log('[SW] 🔍 Action recebida:', event.action);
  console.log('[SW] 🔍 Dados da notificação:', event.notification.data);
  
  // Fechar a notificação
  event.notification.close();
  
  // Obter dados
  const data = event.notification.data || {};
  const action = event.action || 'open';
  
  console.log('[SW] 🎯 Action processada:', action);
  console.log('[SW] 📦 Dados:', data);
  
  // ✅ TODO CLIQUE ABRE O PEDIDO (exceto se for explicitamente 'close')
  if (action === 'close' || action === 'fechar') {
    console.log('[SW] ❌ Fechar - ignorando');
    return;
  }
  
  // ✅ Construir URL de destino
  let targetUrl = '/';
  
  // Tentar todas as fontes de URL
  if (data.targetUrl && data.targetUrl !== '/') {
    targetUrl = data.targetUrl;
    console.log('[SW] 🎯 targetUrl:', targetUrl);
  } else if (data.url && data.url !== '/') {
    targetUrl = data.url;
    console.log('[SW] 🎯 url:', targetUrl);
  } else if (data.orderId && data.token) {
    targetUrl = `/track/${data.orderId}?token=${data.token}`;
    console.log('[SW] 🎯 orderId+token:', targetUrl);
  }
  
  console.log('[SW] 🔗 URL final:', targetUrl);
  
  // ✅ Abrir a URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Verificar janela existente
        for (const client of clientList) {
          if (client.url && client.url.includes(targetUrl) && 'focus' in client) {
            console.log('[SW] 📱 Focando janela existente:', client.url);
            return client.focus();
          }
        }
        // Abrir nova janela
        console.log('[SW] 🪟 Abrindo nova janela:', targetUrl);
        return clients.openWindow(targetUrl);
      })
      .catch((error) => {
        console.log('[SW] ❌ Erro:', error);
        return clients.openWindow('/');
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] ❌ Notificação fechada sem ação');
});

console.log('[SW] ✅ Service Worker FINAL carregado!');
