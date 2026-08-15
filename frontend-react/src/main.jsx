import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ============================================
// REGISTRO DO SERVICE WORKER
// ============================================
const registerSW = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Workers não são suportados');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registrado! Scope:', registration.scope);
    
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('🔄 Nova versão do SW encontrada!');
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('📦 Nova versão instalada!');
          // ✅ Apenas notifica, NÃO recarrega automaticamente
          window.dispatchEvent(new CustomEvent('swUpdate'));
        }
      });
    });
    
    if ('Notification' in window) {
      const permission = Notification.permission;
      console.log(`🔔 Permissão de notificação: ${permission}`);
      
      if (permission === 'granted') {
        console.log('✅ Permissão concedida!');
        await subscribeToPush(registration);
      }
    }
    
    return registration;
  } catch (error) {
    console.error('❌ Erro ao registrar SW:', error);
  }
};

// ============================================
// SUBSCRIÇÃO PUSH
// ============================================
const subscribeToPush = async (registration) => {
  try {
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('✅ Já inscrito para notificações push');
      return existingSubscription;
    }
    
    const response = await fetch('/api/notifications/vapid-public-key');
    const data = await response.json();
    const publicKey = data.publicKey;
    
    if (!publicKey) {
      console.warn('⚠️ VAPID public key não disponível');
      return null;
    }
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });
    
    console.log('✅ Inscrito para push!');
    
    const tenant = new URLSearchParams(window.location.search).get('tenant') || 'fireburger';
    
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription,
        tenant: tenant
      }),
    });
    
    console.log('✅ Inscrição salva no servidor!');
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
    await subscribeToPush(registration);
    return true;
  } else {
    console.warn('❌ Permissão negada:', permission);
    return false;
  }
};

// ============================================
// INICIALIZAÇÃO
// ============================================
registerSW();

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