// ============================================================
//  HOOK USE PUSH NOTIFICATIONS
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed
} from '../services/pushService';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribedState, setIsSubscribedState] = useState(false);
  const [permission, setPermission] = useState(Notification.permission || 'default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registration, setRegistration] = useState(null);

  // Verificar suporte
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission || 'default');
      checkSubscription();
    }
    
    setLoading(false);
  }, []);

  // Verificar inscrição
  const checkSubscription = useCallback(async () => {
    try {
      const subscribed = await isSubscribed();
      setIsSubscribedState(subscribed);
      return subscribed;
    } catch (err) {
      console.error('[usePush] Erro ao verificar inscrição:', err);
      return false;
    }
  }, []);

  // Inicializar e solicitar permissão
  const initializePush = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Registrar SW
      const reg = await registerServiceWorker();
      setRegistration(reg);

      // 2. Solicitar permissão
      const granted = await requestNotificationPermission();
      setPermission(Notification.permission || 'default');

      if (!granted) {
        setLoading(false);
        return false;
      }

      // 3. Inscrever
      await subscribeToPush(reg);
      setIsSubscribedState(true);
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error('[usePush] Erro ao inicializar:', err);
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, []);

  // Desinscrever
  const unsubscribe = useCallback(async () => {
    try {
      const result = await unsubscribeFromPush();
      if (result) {
        setIsSubscribedState(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[usePush] Erro ao desinscrever:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // Verificar permissão periodicamente (se mudar)
  useEffect(() => {
    const handlePermissionChange = () => {
      setPermission(Notification.permission || 'default');
    };

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'notifications' })
        .then((result) => {
          result.addEventListener('change', handlePermissionChange);
        });
    }

    return () => {
      // Cleanup
    };
  }, []);

  return {
    isSupported,
    isSubscribed: isSubscribedState,
    permission,
    loading,
    error,
    initializePush,
    unsubscribe,
    checkSubscription,
    canRequest: !isSubscribedState && permission === 'default'
  };
};

export default usePushNotifications;