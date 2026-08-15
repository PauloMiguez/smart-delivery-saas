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

// Instalação
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

// Ativação
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

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorar API, WebSocket e imagens externas
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
// NOTIFICAÇÕES PUSH
// ============================================

// Recebimento de notificação push
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);
    
    let data = {
        title: 'Smart Delivery',
        body: 'Você tem uma nova notificação!',
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: 'default',
        data: { url: '/' },
        vibrate: [200, 100, 200],
        requireInteraction: true,
        actions: [
            { action: 'open', title: '🔍 Ver agora' },
            { action: 'close', title: '❌ Fechar' }
        ]
    };
    
    // Parse dos dados da notificação
    if (event.data) {
        try {
            const payload = event.data.json();
            data = { ...data, ...payload };
            console.log('[SW] Payload:', payload);
        } catch (e) {
            console.log('[SW] Erro ao parsear payload:', e);
            data.body = event.data.text();
        }
    }
    
    console.log('[SW] Mostrando notificação:', data);
    
    // Garantir que a notificação seja mostrada
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/favicon.png',
            badge: data.badge || '/favicon.png',
            tag: data.tag || `notification-${Date.now()}`,
            data: data.data || { url: '/' },
            vibrate: data.vibrate || [200, 100, 200],
            requireInteraction: true,
            actions: data.actions || [
                { action: 'open', title: '🔍 Ver agora' },
                { action: 'close', title: '❌ Fechar' }
            ],
            silent: false,
            renotify: true,
            timestamp: Date.now()
        })
    );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 👆 Notificação clicada:', event);
    
    // Fechar a notificação
    event.notification.close();
    
    // Obter dados da notificação
    const notification = event.notification;
    const data = notification.data || {};
    const action = event.action || 'open';
    
    // Construir URL de destino
    let targetUrl = '/';
    
    // Prioridade: orderId + token > url > /
    if (data.orderId && data.token) {
        targetUrl = `/track/${data.orderId}?token=${data.token}`;
        console.log(`[SW] 🎯 URL do pedido: ${targetUrl}`);
    } else if (data.url) {
        targetUrl = data.url;
        console.log(`[SW] 🎯 URL da notificação: ${targetUrl}`);
    } else {
        console.log(`[SW] 🎯 URL padrão: ${targetUrl}`);
    }
    
    console.log(`[SW] 🔗 URL final: ${targetUrl}`);
    console.log(`[SW] 🎯 Ação: ${action}`);
    
    // Se for ação de fechar, não faz nada
    if (action === 'close') {
        console.log('[SW] ❌ Notificação fechada pelo usuário');
        return;
    }
    
    // Abrir a URL
    event.waitUntil(
        clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: true 
        })
        .then((clientList) => {
            // Verificar se já existe uma janela com a URL
            for (const client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    console.log('[SW] 📱 Focando janela existente:', client.url);
                    return client.focus();
                }
            }
            // Abrir nova janela
            console.log('[SW] 🪟 Abrindo nova janela:', targetUrl);
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
        .catch((error) => {
            console.log('[SW] ❌ Erro ao abrir URL:', error);
            // Fallback: abrir a página inicial
            return clients.openWindow('/');
        })
    );
});

console.log('[SW] Service Worker loaded!');
