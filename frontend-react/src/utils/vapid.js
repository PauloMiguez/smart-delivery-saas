// ============================================================
//  UTILITÁRIO VAPID
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Obtém a chave VAPID pública do backend
 */
export const getVapidPublicKey = async () => {
  try {
    // Tentar do cache primeiro
    if (window.__vapidKey) {
      return window.__vapidKey;
    }

    const response = await fetch(`${API_URL}/api/notifications/vapid-public-key`);
    
    if (!response.ok) {
      throw new Error('Erro ao obter chave VAPID');
    }
    
    const data = await response.json();
    
    if (!data.publicKey) {
      throw new Error('Chave VAPID não disponível');
    }
    
    // Cache da chave
    window.__vapidKey = data.publicKey;
    
    return data.publicKey;
  } catch (error) {
    console.error('[VAPID] Erro:', error);
    return null;
  }
};

/**
 * Converte a chave VAPID para o formato esperado pelo navegador
 */
export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
};

/**
 * Verifica se o navegador suporta push
 */
export const isPushSupported = () => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};