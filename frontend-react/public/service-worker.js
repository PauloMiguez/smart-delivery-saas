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
// NOTIFICAÇÕES PUSH - CORRIGIDO
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
      
      // ✅ PRIORIDADE: orderId e token
      orderId = payload.orderId || payload.data?.orderId || null;
      token = payload.token || payload.data?.token || null;
      url = payload.url || payload.data?.url || '/';
      
      console.log('[SW] 📦 Dados: orderId=' + orderId + ', token=' + (token ? 'presente' : 'ausente'));
    } catch (error) {
      console.log('[SW] ❌ Erro ao parsear payload:', error);
      body = event.data.text() || body;
    }
  }
  
  // ✅ CONSTRUIR URL DO PEDIDO
  let targetUrl = url;
  if (orderId && token) {
    targetUrl = `/track/${orderId}?token=${token}`;
    console.log('[SW] 🎯 URL do pedido:', targetUrl);
  }
  
  const options = {
    body: body,
    icon: icon,
    badge: badge,
    tag: tag,
    data: { 
      orderId: orderId,
      token: token,
      url: targetUrl
    },
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'open', title: '🔍 Ver agora' },
      { action: 'close', title: '❌ Fechar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW] ✅ Notificação exibida'))
      .catch((error) => console.log('[SW] ❌ Erro ao exibir:', error))
  );
});

// ============================================
// CLIQUE NA NOTIFICAÇÃO - CORRIGIDO
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Notificação clicada!');
  console.log('[SW] 🔍 Evento:', event);
  console.log('[SW] 🔍 Ação:', event.action);
  console.log('[SW] 🔍 Notification data:', event.notification.data);
  
  // Fechar a notificação
  event.notification.close();
  
  // Obter dados da notificação
  const data = event.notification.data || {};
  const action = event.action || 'open';
  
  console.log('[SW] 📦 Dados:', data);
  console.log('[SW] 🎯 Ação:', action);
  
  // Se for ação de fechar, não faz nada
  if (action === 'close') {
    console.log('[SW] ❌ Notificação fechada');
    return;
  }
  
  // ✅ CONSTRUIR URL DE DESTINO
  let targetUrl = '/';
  
  // PRIORIDADE 1: orderId + token (do data da notificação)
  if (data.orderId && data.token) {
    targetUrl = `/track/${data.orderId}?token=${data.token}`;
    console.log('[SW] 🎯 URL do pedido (data):', targetUrl);
  } 
  // PRIORIDADE 2: url do data
  else if (data.url) {
    targetUrl = data.url;
    console.log('[SW] 🎯 URL do data:', targetUrl);
  }
  // PRIORIDADE 3: url da notificação (fallback)
  else {
    targetUrl = '/';
    console.log('[SW] 🎯 URL padrão:', targetUrl);
  }
  
  console.log('[SW] 🔗 Abrindo URL final:', targetUrl);
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
    .then((clientList) => {
      // Verificar se já existe uma janela com a URL
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
      console.log('[SW] ❌ Erro ao abrir URL:', error);
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] ❌ Notificação fechada');
});

console.log('[SW] ✅ Service Worker carregado!');
