// ============================================================
//  SERVICO DE PUSH NOTIFICATIONS
// ============================================================

import { getVapidPublicKey } from '../utils/vapid';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Registra o Service Worker e solicita permissão
 */
export const registerServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[PushService] Service Worker registrado:', registration);
      
      // Aguardar o SW estar ativo
      await navigator.serviceWorker.ready;
      console.log('[PushService] Service Worker pronto');
      
      return registration;
    }
    throw new Error('Service Worker não suportado');
  } catch (error) {
    console.error('[PushService] Erro ao registrar SW:', error);
    throw error;
  }
};

/**
 * Solicita permissão para notificações
 */
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      throw new Error('Notificações não suportadas');
    }
    
    const permission = await Notification.requestPermission();
    console.log('[PushService] Permissão:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[PushService] Erro ao solicitar permissão:', error);
    return false;
  }
};

/**
 * Inscreve o dispositivo para receber push
 */
export const subscribeToPush = async (registration) => {
  try {
    // Obter chave VAPID pública
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('Chave VAPID não disponível');
    }
    
    // Criar inscrição
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey
    });
    
    console.log('[PushService] Inscrição criada:', subscription);
    
    // Salvar no backend
    const response = await fetch(`${API_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        tenant: localStorage.getItem('tenant') || 'default'
      })
    });
    
    if (!response.ok) {
      throw new Error('Erro ao salvar inscrição');
    }
    
    const data = await response.json();
    console.log('[PushService] Inscrição salva:', data);
    
    return subscription;
  } catch (error) {
    console.error('[PushService] Erro ao inscrever:', error);
    throw error;
  }
};

/**
 * Desinscreve o dispositivo
 */
export const unsubscribeFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PushService] Desinscrito');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PushService] Erro ao desinscrever:', error);
    return false;
  }
};

/**
 * Verifica se está inscrito
 */
export const isSubscribed = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
};