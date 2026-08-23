import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ============================================
// FUNÇÃO PARA CONVERTER CHAVE VAPID
// ============================================
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

// ============================================
// REGISTRO DO SERVICE WORKER COM TENANT
// ============================================
const registerSW = async () => {
    if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Workers não são suportados');
        return;
    }

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const tenant = urlParams.get('tenant') || 'fireburger';
        const swUrl = `/service-worker.js?tenant=${encodeURIComponent(tenant)}`;

        console.log(`📱 Registrando SW com tenant: ${tenant}`, swUrl);

        const registration = await navigator.serviceWorker.register(swUrl, {
            scope: '/'
        });

        console.log('✅ Service Worker registrado! Scope:', registration.scope);

        // ✅ ENVIAR TENANT PARA O SW
        const sendTenantToSW = (reg) => {
            if (reg.active) {
                reg.active.postMessage({
                    type: 'SET_TENANT',
                    tenant: tenant
                });
                console.log(`📱 Tenant enviado para SW: ${tenant}`);
                return true;
            }
            return false;
        };

        // Tentar enviar imediatamente
        if (!sendTenantToSW(registration)) {
            // Aguardar o SW ficar ativo
            registration.addEventListener('activate', () => {
                sendTenantToSW(registration);
            });
        }

        // ✅ Aguardar o SW ficar ativo ANTES de tentar inscrever
        await navigator.serviceWorker.ready;

        // ✅ Verificar se o SW está ativo
        const swRegistration = await navigator.serviceWorker.ready;
        if (!swRegistration.active) {
            console.log('⏳ Aguardando SW ativar...');
            await new Promise(resolve => {
                if (swRegistration.active) {
                    resolve();
                } else {
                    swRegistration.addEventListener('activate', () => {
                        resolve();
                    });
                }
            });
        }

        console.log('✅ SW ativo, pronto para inscrição!');

        // ✅ Tentar inscrever com retry
        if ('Notification' in window) {
            const permission = Notification.permission;
            console.log(`🔔 Permissão de notificação: ${permission}`);

            if (permission === 'granted') {
                console.log('✅ Permissão concedida!');
                await subscribeToPush(tenant);
            } else if (permission === 'default') {
                console.log('📱 Solicitando permissão...');
                const result = await Notification.requestPermission();
                if (result === 'granted') {
                    await subscribeToPush(tenant);
                }
            }
        }

        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 Nova versão do SW encontrada!');

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                    console.log('📦 Nova versão instalada!');
                    sendTenantToSW(registration);
                    // Tentar inscrever novamente
                    setTimeout(() => subscribeToPush(tenant), 1000);
                    window.dispatchEvent(new CustomEvent('swUpdate'));
                }
            });
        });

        return registration;
    } catch (error) {
        console.error('❌ Erro ao registrar SW:', error);
    }
};

// ============================================
// SUBSCRIÇÃO PUSH COM TENANT E RETRY
// ============================================
const subscribeToPush = async (tenant, retryCount = 0) => {
    try {
        const maxRetries = 3;
        const swRegistration = await navigator.serviceWorker.ready;

        if (!swRegistration.active) {
            console.log('⏳ SW não está ativo, aguardando...');
            await new Promise(resolve => {
                if (swRegistration.active) {
                    resolve();
                } else {
                    swRegistration.addEventListener('activate', () => {
                        resolve();
                    });
                }
            });
        }

        // Verificar se já está inscrito
        let subscription = await swRegistration.pushManager.getSubscription();
        if (subscription) {
            console.log('✅ Já inscrito para notificações push');
            return subscription;
        }

        console.log('📱 Tentando inscrever para push...');

        // Buscar chave VAPID
        const response = await fetch('/api/notifications/vapid-public-key');
        const data = await response.json();
        const publicKey = data.publicKey;

        if (!publicKey) {
            console.warn('⚠️ VAPID public key não disponível');
            return null;
        }

        console.log('📱 Convertendo chave VAPID...');
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        console.log('✅ Chave VAPID convertida para Uint8Array');

        console.log('📱 Inscrevendo para push...');
        subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
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
        console.error(`❌ Erro ao inscrever para push (tentativa ${retryCount + 1}):`, error);

        if (retryCount < 3) {
            console.log(`🔄 Tentando novamente em ${(retryCount + 1) * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
            return subscribeToPush(tenant, retryCount + 1);
        }

        console.error('❌ Falha após 3 tentativas');
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

    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('✅ Permissão concedida!');
            const tenant = new URLSearchParams(window.location.search).get('tenant') || 'fireburger';
            await subscribeToPush(tenant);
            return true;
        } else {
            console.warn('❌ Permissão negada:', permission);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao solicitar permissão:', error);
        return false;
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

if (document.readyState === 'complete') {
    registerSW();
} else {
    window.addEventListener('load', registerSW);
}

navigator.serviceWorker?.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker atualizado!');
    window.dispatchEvent(new CustomEvent('swUpdate'));
});

// ============================================
// EXPORTAR FUNÇÕES
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