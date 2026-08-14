import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const NotificationPermission = () => {
  const [permission, setPermission] = useState('default');
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        setShowBanner(true);
      }
    }
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    try {
      const result = await window.__PWA?.requestNotificationPermission();
      if (result) {
        setPermission('granted');
        setShowBanner(false);
      } else {
        setPermission('denied');
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    } finally {
      setLoading(false);
    }
  };

  if (permission !== 'default' || !showBanner) {
    return null;
  }

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
