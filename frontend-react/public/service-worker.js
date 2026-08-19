// ============================================================
// SERVICE WORKER PARA SMART DELIVERY SAAS - MULTI-TENANT
// ============================================================

const CACHE_NAME = 'smart-delivery-v3';
const OFFLINE_URL = '/offline.html';

// ============================================================
// 1. DETECTAR TENANT DA URL - CORRIGIDO
// ============================================================
function getTenantFromUrl() {
    try {
        // 1. Tentar da query string
        const urlParams = new URLSearchParams(self.location.search);
        const tenant = urlParams.get('tenant');
        if (tenant) {
            console.log(`[SW] 📱 Tenant da query: ${tenant}`);
            return tenant;
        }
        
        // 2. Tentar do hostname (domínio personalizado)
        const hostname = self.location.hostname;
        console.log(`[SW] 📱 Hostname: ${hostname}`);
        
        // Verificar se é um domínio personalizado
        const parts = hostname.split('.');
        
        // Para domínios como fireburgerpetropolis.com.br
        if (parts.length >= 2) {
            const firstPart = parts[0];
            // Verificar se não é um subdomínio comum
            if (firstPart && 
                firstPart !== 'www' && 
                firstPart !== 'smart-delivery-saas' &&
                firstPart !== 'localhost' &&
                firstPart !== '127.0.0.1') {
                
                // Verificar se parece um tenant (não é um TLD conhecido)
                const knownTlds = ['com', 'br', 'net', 'org', 'io', 'app', 'dev', 'tech', 'shop', 'store'];
                if (!knownTlds.includes(firstPart) && firstPart.length > 2) {
                    console.log(`[SW] 📱 Tenant do domínio personalizado: ${firstPart}`);
                    return firstPart;
                }
            }
        }
        
        // 3. Tentar do path
        const pathParts = self.location.pathname.split('/');
        for (const part of pathParts) {
            if (part && part.length > 0 && !part.includes('.')) {
                // Verificar se é um tenant válido (evitar conflitos)
                if (!['api', 'admin', 'track', 'login', 'register', 'checkout', 'offline'].includes(part)) {
                    if (part.length > 2 && part.length < 30) {
                        console.log(`[SW] 📱 Tenant do path: ${part}`);
                        return part;
                    }
                }
            }
        }
        
        console.log('[SW] 📱 Nenhum tenant detectado, usando default');
        return null;
    } catch (error) {
        console.error('[SW] ❌ Erro ao detectar tenant:', error);
        return null;
    }
}

// Detectar tenant inicial
let TENANT = getTenantFromUrl() || 'default';
console.log(`[SW] 🏷️ Tenant detectado: ${TENANT}`);

// ============================================================
// 2. RECEBER TENANT DO CLIENTE VIA MENSAGEM - CORRIGIDO
// ============================================================
self.addEventListener('message', (event) => {
    console.log('[SW] 📨 Mensagem recebida:', event.data);
    
    if (event.data && event.data.type === 'SET_TENANT') {
        const newTenant = event.data.tenant;
        if (newTenant && newTenant !== TENANT) {
            console.log(`[SW] 📱 Tenant atualizado via mensagem: ${newTenant} (era: ${TENANT})`);
            TENANT = newTenant;
            // Atualizar cache com novo tenant
            updateCacheForTenant(TENANT);
        }
        
        // ✅ RESPONDER AO CLIENTE CONFIRMANDO RECEBIMENTO
        if (event.ports && event.ports.length > 0) {
            event.ports[0].postMessage({
                type: 'TENANT_SET',
                tenant: TENANT,
                success: true,
                timestamp: Date.now()
            });
            console.log(`[SW] 📤 Resposta enviada para o cliente: TENANT_SET`);
        } else {
            // Fallback: responder via clients
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'TENANT_SET',
                        tenant: TENANT,
                        success: true,
                        timestamp: Date.now()
                    });
                });
            });
        }
    }
});

// Função para atualizar cache com novo tenant
async function updateCacheForTenant(tenant) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const manifestUrl = `/manifest.json?tenant=${encodeURIComponent(tenant)}`;
        
        // Verificar se já está no cache
        const cached = await cache.match(manifestUrl);
        if (!cached) {
            await cache.add(manifestUrl);
            console.log(`[SW] 📦 Cache atualizado para tenant: ${tenant}`);
        }
    } catch (error) {
        console.error('[SW] ❌ Erro ao atualizar cache:', error);
    }
}

// ============================================================
// 3. ASSETS ESTÁTICOS COM SUPORTE MULTI-TENANT
// ============================================================
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/favicon.png',
    '/icons.svg',
];

// ✅ MANIFEST_URL - EXPLÍCITO PARA REFERÊNCIA
const MANIFEST_URL = `/manifest.json?tenant=${encodeURIComponent(TENANT)}`;
console.log(`[SW] 📦 MANIFEST_URL: ${MANIFEST_URL}`);

// ✅ Adicionar manifest com tenant (será adicionado no install)
console.log(`[SW] 📦 Assets base para tenant ${TENANT}:`, STATIC_ASSETS);

// ============================================================
// 4. INSTALL - CORRIGIDO
// ============================================================
self.addEventListener('install', (event) => {
    console.log('[SW] 📦 Installing...');
    console.log(`[SW] 🏷️ Tenant: ${TENANT}`);
    
    // Construir lista de assets com manifest do tenant
    const manifestUrl = `/manifest.json?tenant=${encodeURIComponent(TENANT)}`;
    const assets = [...STATIC_ASSETS, manifestUrl];
    
    console.log(`[SW] 📦 Assets para tenant ${TENANT}:`, assets);
    console.log(`[SW] 📦 Total: ${assets.length} assets`);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 📦 Caching static assets...');
                return cache.addAll(assets);
            })
            .then(() => {
                console.log('[SW] ✅ Cache concluído!');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] ❌ Erro no cache:', error);
                // Tentar cache individual em caso de erro
                console.log('[SW] 🔄 Tentando cache individual...');
                return caches.open(CACHE_NAME)
                    .then((cache) => {
                        const promises = assets.map(url => {
                            return cache.add(url).catch(err => {
                                console.warn(`[SW] ⚠️ Falha ao cachear: ${url}`, err);
                            });
                        });
                        return Promise.all(promises);
                    })
                    .then(() => {
                        console.log('[SW] ✅ Cache individual concluído!');
                        return self.skipWaiting();
                    });
            })
    );
});

// ============================================================
// 5. ACTIVATE
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
// 6. FETCH - CORRIGIDO (EVITA ERROS NO CHECKOUT)
// ============================================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // ✅ 1. Ignorar requisições de API e externas
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/socket.io/') ||
        url.hostname.includes('cloudinary.com') ||
        url.hostname.includes('tidbcloud.com')
    ) {
        return;
    }
    
    // ✅ 2. Para manifest.json, buscar do servidor
    if (url.pathname === '/manifest.json') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        })
                        .catch(() => {});
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // ✅ 3. Para assets estáticos (js, css, imagens), usar cache-first
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webmanifest|woff|woff2|ttf|eot)$/) ||
        url.pathname.startsWith('/assets/')
    ) {
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
                                })
                                .catch(() => {});
                            return response;
                        })
                        .catch(() => {
                            if (event.request.headers.get('accept')?.includes('text/html')) {
                                return caches.match(OFFLINE_URL);
                            }
                        });
                })
        );
        return;
    }
    
    // ✅ 4. Para páginas HTML (incluindo checkout) - NETWORK FIRST
    // ✅ Esta é a CORREÇÃO PRINCIPAL: evita erro no checkout
    if (event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cachear em background para uso offline (apenas se for 200)
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(() => {});
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback: tentar cache ou página offline
                    return caches.match(event.request)
                        .then((cached) => {
                            if (cached) {
                                return cached;
                            }
                            return caches.match(OFFLINE_URL);
                        });
                })
        );
        return;
    }
    
    // ✅ 5. Para outros recursos, cache-first
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
                            })
                            .catch(() => {});
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
// 7. NOTIFICAÇÕES PUSH - CORRIGIDA
// ============================================================
self.addEventListener('push', (event) => {
    console.log('[SW] 🔔 Push recebido!');
    console.log(`[SW] 🏷️ Tenant atual: ${TENANT}`);
    
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
    
    // ✅ Atualizar tenant se veio na notificação
    if (tenant && tenant !== TENANT) {
        console.log(`[SW] 📱 Atualizando tenant para: ${tenant}`);
        TENANT = tenant;
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
        targetUrl = `/?tenant=${encodeURIComponent(TENANT)}`;
    } else if (!targetUrl.includes('tenant=')) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${separator}tenant=${encodeURIComponent(TENANT)}`;
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
            tenant: TENANT,
            notificationData: {
                title: title,
                body: body,
                orderId: orderId,
                token: token,
                tenant: TENANT
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
// 8. CLIQUE NA NOTIFICAÇÃO - CORRIGIDA
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
    
    // ✅ Usar tenant dos dados ou o atual
    const tenant = data.tenant || TENANT;
    console.log(`[SW] 📱 Tenant para a URL: ${tenant}`);
    
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