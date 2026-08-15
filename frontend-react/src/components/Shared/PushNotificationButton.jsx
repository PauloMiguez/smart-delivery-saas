import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const PushNotificationButton = () => {
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if (!('Notification' in window)) {
      setShowButton(false);
      return;
    }

    const perm = Notification.permission;
    setPermission(perm);
    setShowButton(true);

    if (perm === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setSubscribed(!!subscription);
      } catch (error) {
        console.error('Erro ao verificar inscrição:', error);
      }
    }
  };

  const handleClick = async () => {
    setLoading(true);
    try {
      // Se a permissão não foi definida, solicitar
      if (permission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);
        
        if (result === 'granted') {
          await subscribeToPush();
        } else {
          alert('❌ Permissão negada. Ative as notificações nas configurações do navegador.');
        }
      } 
      // Se já tem permissão mas não está inscrito
      else if (permission === 'granted' && !subscribed) {
        await subscribeToPush();
      }
      // Se já está inscrito
      else if (permission === 'granted' && subscribed) {
        alert('✅ Você já está inscrito para receber notificações!');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      alert('Erro ao ativar notificações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Buscar VAPID key
      const response = await fetch('/api/notifications/vapid-public-key');
      const data = await response.json();
      
      if (!data.publicKey) {
        throw new Error('VAPID key não disponível');
      }
      
      // Inscrever
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: data.publicKey
      });
      
      // Salvar no servidor
      const saveResponse = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription,
          tenant: 'fireburger'
        })
      });
      
      const result = await saveResponse.json();
      
      if (result.success) {
        setSubscribed(true);
        alert('✅ Notificações ativadas com sucesso!');
        
        // Testar notificação
        registration.showNotification('🔔 Notificações ativadas!', {
          body: 'Você receberá notificações de pedidos neste dispositivo.',
          icon: '/favicon.png',
          tag: 'ativado'
        });
        
        console.log('✅ Inscrição salva com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao salvar inscrição');
      }
    } catch (error) {
      console.error('❌ Erro ao inscrever:', error);
      throw error;
    }
  };

  if (!showButton) {
    return null;
  }

  // Já está inscrito e com permissão
  if (permission === 'granted' && subscribed) {
    return (
      <Container>
        <StatusButton disabled>
          ✅ Notificações ativas
        </StatusButton>
        <HelperText>Você receberá alertas sobre seus pedidos</HelperText>
      </Container>
    );
  }

  // Permissão negada
  if (permission === 'denied') {
    return (
      <Container>
        <StatusButton disabled style={{ background: '#e74c3c' }}>
          ❌ Notificações bloqueadas
        </StatusButton>
        <HelperText>Ative nas configurações do seu navegador</HelperText>
      </Container>
    );
  }

  // Botão para ativar (default ou granted sem subscription)
  return (
    <Container>
      <ActionButton onClick={handleClick} disabled={loading}>
        {loading ? '⏳ Ativando...' : '🔔 Ativar notificações'}
      </ActionButton>
      <HelperText>Receba alertas em tempo real sobre seus pedidos</HelperText>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  margin: 8px 0;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  width: 100%;
  max-width: 400px;
`;

const ActionButton = styled.button`
  background: #D2691E;
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
  width: 100%;

  &:hover:not(:disabled) {
    background: #b85e1a;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(210, 105, 30, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusButton = styled.button`
  background: #2ecc71;
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  cursor: default;
  opacity: 0.8;
`;

const HelperText = styled.p`
  color: #888;
  font-size: 12px;
  margin: 0;
  text-align: center;
`;

export default PushNotificationButton;
