import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ============================================
// REGISTRO DO SERVICE WORKER COM TENANT
// ============================================
const registerSW = async () => {
    if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Workers não são suportados');
        return;
    }

    try {
        // ✅ OBTER TENANT DA URL
        const urlParams = new URLSearchParams(window.location.search);
        const tenant = urlParams.get('tenant') || 'fireburger';
        
        // ✅ REGISTRAR SW COM TENANT NA URL
        const swUrl = `/service-worker.js?tenant=${encodeURIComponent(tenant)}`;
        console.log(`📱 Registrando SW com tenant: ${tenant}`, swUrl);

        const registration = await navigator.serviceWorker.register(swUrl, {
            scope: '/'
        });

        console.log('✅ Service Worker registrado! Scope:', registration.scope);

        // ✅ ENVIAR TENANT PARA O SW
        if (registration.active) {
            registration.active.postMessage({
                type: 'SET_TENANT',
                tenant: tenant
            });
            console.log(`📱 Tenant enviado para SW: ${tenant}`);
        } else {
            // Aguardar o SW ficar ativo
            registration.addEventListener('activate', () => {
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'SET_TENANT',
                        tenant: tenant
                    });
                    console.log(`📱 Tenant enviado para SW (após activate): ${tenant}`);
                }
            });
        }

        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 Nova versão do SW encontrada!');

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                    console.log('📦 Nova versão instalada!');
                    // ✅ Enviar tenant para o novo SW
                    if (registration.active) {
                        registration.active.postMessage({
                            type: 'SET_TENANT',
                            tenant: tenant
                        });
                        console.log(`📱 Tenant enviado para novo SW: ${tenant}`);
                    }
                    window.dispatchEvent(new CustomEvent('swUpdate'));
                }
            });
        });

        // ✅ Verificar se já existe e enviar tenant
        if (registration.active) {
            setTimeout(() => {
                registration.active?.postMessage({
                    type: 'SET_TENANT',
                    tenant: tenant
                });
                console.log(`📱 Tenant reenviado para SW (ready): ${tenant}`);
            }, 500);
        }

        if ('Notification' in window) {
            const permission = Notification.permission;
            console.log(`🔔 Permissão de notificação: ${permission}`);

            if (permission === 'granted') {
                console.log('✅ Permissão concedida!');
                await subscribeToPush(registration, tenant);
            }
        }

        return registration;
    } catch (error) {
        console.error('❌ Erro ao registrar SW:', error);
    }
};

// ============================================
// SUBSCRIÇÃO PUSH COM TENANT
// ============================================
const subscribeToPush = async (registration, tenant) => {
    try {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            console.log('✅ Já inscrito para notificações push');
            return existingSubscription;
        }

        console.log('📱 Tentando inscrever após instalação do SW...');
        console.log('📱 Aguardando Service Worker estar pronto...');

        // Aguardar o SW ficar pronto
        const swRegistration = await navigator.serviceWorker.ready;
        console.log('📱 Service Worker pronto!');

        const response = await fetch('/api/notifications/vapid-public-key');
        const data = await response.json();
        const publicKey = data.publicKey;

        if (!publicKey) {
            console.warn('⚠️ VAPID public key não disponível');
            return null;
        }

        console.log('📱 Buscando chave VAPID pública...');
        console.log('📱 Convertendo chave VAPID...');

        // Converter chave para Uint8Array
        const applicationServerKey = (key) => {
            const base64 = key.replace(/-/g, '+').replace(/_/g, '/');
            const rawData = atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        };

        const vapidKey = applicationServerKey(publicKey);
        console.log('✅ Chave VAPID convertida para Uint8Array');

        console.log('📱 Inscrevendo para push...');
        const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey
        });

        console.log('✅ Inscrito para push!');
        console.log('📱 Salvando inscrição no servidor...');

        const tenantId = tenant || new URLSearchParams(window.location.search).get('tenant') || 'fireburger';

        const saveResponse = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscription: subscription,
                tenant: tenantId,
                userType: 'client'
            }),
        });

        const saveData = await saveResponse.json();
        console.log('✅ Resposta do servidor:', saveData);

        console.log('🎉✅ INSCRIÇÃO COMPLETA!');
        return subscription;
    } catch (error) {
        console.error('❌ Erro ao inscrever para push:', error);
        return null;
    }
};

// ============================================
// PERMISSÃO DE NOTIFICAÇÃO
// ============================================
const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        alert('Este navegador não suporta notificações.');
        return false;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
        console.log('✅ Permissão concedida!');
        const registration = await navigator.serviceWorker.ready;
        const tenant = new URLSearchParams(window.location.search).get('tenant') || 'fireburger';
        await subscribeToPush(registration, tenant);
        return true;
    } else {
        console.warn('❌ Permissão negada:', permission);
        return false;
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

// Registrar SW ao carregar
if (document.readyState === 'complete') {
    registerSW();
} else {
    window.addEventListener('load', registerSW);
}

// ✅ CORRIGIDO: NÃO recarrega automaticamente
navigator.serviceWorker?.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker atualizado!');
    // ✅ Apenas notifica, sem recarregar
    window.dispatchEvent(new CustomEvent('swUpdate'));
});

// ============================================
// EXPORTAR FUNÇÕES PARA USO NO APP
// ============================================
window.__PWA = {
    registerSW,
    subscribeToPush,
    requestNotificationPermission,
};

// ============================================
// RENDERIZAÇÃO DO APP
// ============================================
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);