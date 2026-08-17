// ============================================================
// SERVICE WORKER PARA SMART DELIVERY SAAS - MULTI-TENANT
// ============================================================

const CACHE_NAME = 'smart-delivery-v3'; // ← VERSÃO ATUALIZADA
const OFFLINE_URL = '/offline.html';

// ============================================================
// 1. DETECTAR TENANT DA URL
// ============================================================
function getTenantFromUrl() {
    try {
        // Tentar da query string
        const urlParams = new URLSearchParams(self.location.search);
        const tenant = urlParams.get('tenant');
        if (tenant) return tenant;
        
        // Tentar do path
        const pathParts = self.location.pathname.split('/');
        for (const part of pathParts) {
            if (part && part.length > 0 && !part.includes('.')) {
                // Verificar se é um tenant válido (evitar conflitos)
                if (!['api', 'admin', 'track', 'login', 'register'].includes(part)) {
                    return part;
                }
            }
        }
        return null;
    } catch {
        return null;
    }
}

const TENANT = getTenantFromUrl() || 'default';
console.log(`[SW] 🏷️ Tenant detectado: ${TENANT}`);

// ============================================================
// 2. ASSETS ESTÁTICOS COM SUPORTE MULTI-TENANT
// ============================================================
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/favicon.png',
    '/icons.svg',
];

// ✅ Adicionar manifest com tenant
const MANIFEST_URL = `/manifest.json?tenant=${encodeURIComponent(TENANT)}`;
STATIC_ASSETS.push(MANIFEST_URL);

console.log(`[SW] 📦 Assets para tenant ${TENANT}:`, STATIC_ASSETS);

// ============================================================
// 3. INSTALL
// ============================================================
self.addEventListener('install', (event) => {
    console.log('[SW] 📦 Installing...');
    console.log(`[SW] 🏷️ Tenant: ${TENANT}`);
    console.log(`[SW] 📦 Caching ${STATIC_ASSETS.length} assets...`);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 📦 Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] ✅ Cache concluído!');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] ❌ Erro no cache:', error);
                // Continuar mesmo com erro no cache
                return self.skipWaiting();
            })
    );
});

// ============================================================
// 4. ACTIVATE
// ============================================================
self.addEventListener('activate', (event) => {
    console.log('[SW] 🔄 Activating...');
    console.log(`[SW] 🏷️ Tenant: ${TENANT}`);
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] 🗑️ Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] ✅ Cache limpo!');
                return self.clients.claim();
            })
    );
});

// ============================================================
// 5. FETCH - COM SUPORTE A MANIFEST DINÂMICO
// ============================================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Ignorar requisições de API e externas
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/socket.io/') ||
        url.hostname.includes('cloudinary.com') ||
        url.hostname.includes('tidbcloud.com')
    ) {
        return;
    }
    
    // ✅ Para manifest.json, sempre buscar do servidor (não cache)
    if (url.pathname === '/manifest.json') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache da resposta para uso offline
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // ✅ Para outros assets, usar cache-first
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

// ============================================================
// 6. NOTIFICAÇÕES PUSH - CORRIGIDA
// ============================================================
self.addEventListener('push', (event) => {
    console.log('[SW] 🔔 Push recebido!');
    console.log(`[SW] 🏷️ Tenant: ${TENANT}`);
    
    let title = 'Smart Delivery';
    let body = 'Você tem uma nova notificação!';
    let icon = '/favicon.png';
    let badge = '/favicon.png';
    let tag = `notification-${Date.now()}`;
    let orderId = null;
    let token = null;
    let url = '/';
    let tenant = TENANT;
    
    if (event.data) {
        try {
            const payload = event.data.json();
            console.log('[SW] 📦 Payload completo:', JSON.stringify(payload, null, 2));
            
            title = payload.title || title;
            body = payload.body || body;
            icon = payload.icon || icon;
            badge = payload.badge || badge;
            tag = payload.tag || tag;
            tenant = payload.tenant || tenant;
            
            // Extrair orderId e token
            orderId = payload.orderId || payload.data?.orderId || null;
            token = payload.token || payload.data?.token || null;
            url = payload.url || payload.data?.url || '/';
            
            console.log(`[SW] 📦 orderId=${orderId}, token=${token ? '✅ presente' : '❌ ausente'}`);
            console.log(`[SW] 📦 url=${url}`);
            console.log(`[SW] 📦 tenant=${tenant}`);
            
        } catch (error) {
            console.log('[SW] ❌ Erro ao parsear payload:', error);
            body = event.data.text() || body;
        }
    }
    
    // Construir URL do pedido - PRIORIDADE MÁXIMA para tracking
    let targetUrl = '/';
    if (orderId && token) {
        targetUrl = `/track/${orderId}?token=${token}`;
        console.log('[SW] 🎯 URL do tracking construída:', targetUrl);
    } else if (url && url !== '/') {
        targetUrl = url;
        console.log('[SW] 🎯 URL da notificação:', targetUrl);
    }
    
    // ✅ Adicionar tenant à URL se não estiver presente
    if (targetUrl === '/' || targetUrl === '/?') {
        targetUrl = `/?tenant=${encodeURIComponent(tenant)}`;
    } else if (!targetUrl.includes('tenant=')) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}tenant=${encodeURIComponent(tenant)}`;
    }
    
    console.log(`[SW] 🎯 URL final com tenant: ${targetUrl}`);
    
    const options = {
        body: body,
        icon: icon,
        badge: badge,
        tag: tag,
        data: {
            orderId: orderId,
            token: token,
            url: targetUrl,
            targetUrl: targetUrl,
            tenant: tenant,
            notificationData: {
                title: title,
                body: body,
                orderId: orderId,
                token: token,
                tenant: tenant
            }
        },
        vibrate: [200, 100, 200],
        requireInteraction: true,
        actions: [
            { action: 'open', title: '📦 Ver pedido' }
        ]
    };
    
    console.log('[SW] 📤 Opções da notificação:', JSON.stringify(options, null, 2));
    
    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => console.log('[SW] ✅ Notificação exibida com sucesso'))
            .catch((error) => console.log('[SW] ❌ Erro ao exibir:', error))
    );
});

// ============================================================
// 7. CLIQUE NA NOTIFICAÇÃO - CORRIGIDA
// ============================================================
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 👆 Notificação clicada!');
    console.log('[SW] 🔍 Action recebida:', event.action);
    console.log('[SW] 🔍 Dados da notificação:', JSON.stringify(event.notification.data, null, 2));
    
    event.notification.close();
    
    const data = event.notification.data || {};
    const action = event.action || 'open';
    
    console.log('[SW] 🎯 Action processada:', action);
    
    if (action === 'close' || action === 'fechar') {
        console.log('[SW] ❌ Fechar - ignorando');
        return;
    }
    
    // Construir URL de destino
    let targetUrl = '/';
    
    // 1. Tentar targetUrl
    if (data.targetUrl && data.targetUrl !== '/') {
        targetUrl = data.targetUrl;
        console.log('[SW] 🎯 targetUrl:', targetUrl);
    }
    // 2. Tentar url
    else if (data.url && data.url !== '/') {
        targetUrl = data.url;
        console.log('[SW] 🎯 url:', targetUrl);
    }
    // 3. Tentar construir com orderId + token
    else if (data.orderId && data.token) {
        targetUrl = `/track/${data.orderId}?token=${data.token}`;
        console.log('[SW] 🎯 orderId+token:', targetUrl);
    }
    
    // ✅ Adicionar tenant se não estiver presente
    const tenant = data.tenant || TENANT;
    if (!targetUrl.includes('tenant=')) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}tenant=${encodeURIComponent(tenant)}`;
    }
    
    console.log(`[SW] 🔗 URL final: ${targetUrl}`);
    
    // Converter para URL absoluta
    if (targetUrl.startsWith('/')) {
        const origin = self.location.origin;
        targetUrl = origin + targetUrl;
        console.log('[SW] 🔗 URL absoluta:', targetUrl);
    }
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((clientList) => {
            console.log('[SW] 📱 Janelas abertas:', clientList.length);
            
            // Verificar janela existente
            for (const client of clientList) {
                if (client.url && client.url.includes(targetUrl)) {
                    console.log('[SW] 📱 Janela existente encontrada:', client.url);
                    if ('focus' in client) {
                        return client.focus();
                    }
                    return client;
                }
            }
            
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
    console.log('[SW] ❌ Notificação fechada sem ação');
});

console.log(`[SW] ✅ Service Worker V3 carregado para tenant: ${TENANT}`);