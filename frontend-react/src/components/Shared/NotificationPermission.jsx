import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const NotificationPermission = () => {
  const [permission, setPermission] = useState('default');
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      const perm = Notification.permission;
      setPermission(perm);
      
      // Se a permissão não foi definida e ainda não solicitamos, mostrar banner
      if (perm === 'default' && !requested) {
        setShowBanner(true);
        // Aguardar 2 segundos antes de solicitar automaticamente
        const timer = setTimeout(() => {
          requestPermission();
        }, 3000);
        return () => clearTimeout(timer);
      } else if (perm === 'granted') {
        // Se já tem permissão, verificar inscrição
        subscribeIfNeeded();
      }
    }
  }, []);

  const subscribeIfNeeded = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        // Se tem permissão mas não está inscrito, inscrever
        await subscribeToPush();
      }
    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const response = await fetch('/api/notifications/vapid-public-key');
      const data = await response.json();
      
      if (!data.publicKey) {
        console.error('VAPID key não disponível');
        return;
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: data.publicKey
      });
      
      const tenant = new URLSearchParams(window.location.search).get('tenant') || 'fireburger';
      
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription,
          tenant: tenant
        })
      });
      
      console.log('✅ Inscrição push salva com sucesso!');
      
      // Enviar notificação de boas-vindas
      registration.showNotification('🔔 Notificações ativadas!', {
        body: 'Você receberá atualizações sobre seus pedidos em tempo real.',
        icon: '/favicon.png',
        tag: 'welcome'
      });
      
    } catch (error) {
      console.error('❌ Erro ao inscrever:', error);
    }
  };

  const requestPermission = async () => {
    if (loading || requested) return;
    setLoading(true);
    setRequested(true);
    
    try {
      // Solicitar permissão diretamente
      const result = await Notification.requestPermission();
      console.log('📌 Resultado da permissão:', result);
      setPermission(result);
      setShowBanner(false);
      
      if (result === 'granted') {
        console.log('✅ Permissão concedida!');
        await subscribeIfNeeded();
      } else if (result === 'denied') {
        console.log('❌ Permissão negada pelo usuário');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    } finally {
      setLoading(false);
    }
  };

  // Se a permissão já foi concedida ou negada, não mostra nada
  if (permission !== 'default' || !showBanner) {
    return null;
  }

  // Banner de solicitação automática
  return (
    <Banner>
      <Icon>🔔</Icon>
      <Content>
        <Title>Receba notificações</Title>
        <Description>Fique sabendo em tempo real sobre o status do seu pedido!</Description>
      </Content>
      <Button onClick={requestPermission} disabled={loading}>
        {loading ? '⏳...' : 'Ativar'}
      </Button>
      <CloseButton onClick={() => setShowBanner(false)}>✕</CloseButton>
    </Banner>
  );
};

// Styled Components
const Banner = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 420px;
  width: calc(100% - 40px);
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  border: 1px solid #eee;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 480px) {
    padding: 12px 16px;
    gap: 10px;
  }
`;

const Icon = styled.div`
  font-size: 28px;
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 14px;
  margin-bottom: 2px;
`;

const Description = styled.div`
  color: #666;
  font-size: 12px;
  line-height: 1.4;
`;

const Button = styled.button`
  background: #D2691E;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
  min-width: 60px;

  &:hover {
    background: #b85e1a;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;

  &:hover {
    color: #666;
  }
`;

export default NotificationPermission;
