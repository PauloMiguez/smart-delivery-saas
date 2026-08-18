// ============================================================
// NOTIFICATION PERMISSION - MULTI-PLATAFORMA COMPLETO
// ============================================================

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// ============================================================
// UTILITÁRIOS DE DETECÇÃO
// ============================================================
const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isPWA = () => {
  return window.navigator.standalone || 
         window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches;
};

// ============================================================
// CHAVE PARA localStorage
// ============================================================
const BANNER_CLOSED_KEY = 'smart_delivery_notification_banner_closed';
const BANNER_VERSION = 'v2'; // Para invalidar banners antigos

// ============================================================
// ESTILOS
// ============================================================
const Container = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  max-width: 420px;
  width: 90%;
  border: 1px solid #e8ebeb;
  animation: slideUp 0.5s ease;

  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }

  @media (max-width: 480px) {
    bottom: 10px;
    padding: 14px 16px;
    max-width: 95%;
  }
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #1f2421;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Message = styled.p`
  font-size: 14px;
  color: #60696b;
  margin: 4px 0 12px;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
  min-width: 80px;

  &:hover {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ButtonPrimary = styled(Button)`
  background: #e67e22;
  color: #fff;

  &:hover:not(:disabled) {
    background: #d35400;
    box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
  }
`;

const ButtonSecondary = styled(Button)`
  background: #f0ede8;
  color: #555;

  &:hover:not(:disabled) {
    background: #e0dcd5;
  }
`;

const ButtonSuccess = styled(Button)`
  background: #27ae60;
  color: #fff;

  &:hover:not(:disabled) {
    background: #1e8449;
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
  }
`;

const IconWrapper = styled.span`
  font-size: 20px;
`;

const StepsList = styled.ol`
  margin: 8px 0 12px;
  padding-left: 20px;
  font-size: 13px;
  color: #555;
  line-height: 1.8;

  li {
    margin-bottom: 4px;
  }

  strong {
    color: #1f2421;
  }
`;

const HighlightBox = styled.div`
  background: #fef9e7;
  border-left: 3px solid #f39c12;
  padding: 8px 12px;
  border-radius: 4px;
  margin: 8px 0 12px;
  font-size: 13px;
  color: #555;
`;

const Badge = styled.span`
  display: inline-block;
  background: #27ae60;
  color: #fff;
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 600;
  margin-left: 8px;
`;

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const NotificationPermission = () => {
  const [permission, setPermission] = useState('default');
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const [browserInfo, setBrowserInfo] = useState({
    isSafari: false,
    isIOS: false,
    isPWA: false
  });

  // ============================================================
  // 1. DETECTAR PLATAFORMA
  // ============================================================
  useEffect(() => {
    const info = {
      isSafari: isSafari(),
      isIOS: isIOS(),
      isPWA: isPWA()
    };
    setBrowserInfo(info);
    
    console.log('📱 [Notification] Detecção:', info);
  }, []);

  // ============================================================
  // 2. VERIFICAR SE O BANNER DEVE SER MOSTRADO
  // ============================================================
  const shouldShowBanner = () => {
    // Se a permissão já foi concedida ou negada, não mostrar
    if (permission !== 'default') return false;
    
    // Se já está inscrito, não mostrar
    if (isSubscribed) return false;
    
    // Verificar se o usuário já fechou o banner
    const closed = localStorage.getItem(BANNER_CLOSED_KEY);
    if (closed === 'true') {
      console.log('📱 [Notification] Banner já foi fechado pelo usuário');
      return false;
    }
    
    return true;
  };

  // ============================================================
  // 3. VERIFICAR PERMISSÃO E INSCRIÇÃO
  // ============================================================
  useEffect(() => {
    const checkPermission = async () => {
      if (!('Notification' in window)) {
        console.log('📱 [Notification] Notification não suportado');
        return;
      }
      
      const perm = Notification.permission;
      setPermission(perm);
      console.log('📱 [Notification] Permissão atual:', perm);
      
      if (perm === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
          console.log('📱 [Notification] Inscrito:', !!subscription);
        } catch (error) {
          console.error('Erro ao verificar inscrição:', error);
        }
      }
      
      // Atualizar visibilidade do banner
      const show = shouldShowBanner();
      setShowBanner(show);
      console.log('📱 [Notification] Mostrar banner:', show);
    };

    checkPermission();
  }, [permission, isSubscribed]);

  // ============================================================
  // 4. FECHAR BANNER (PERSISTENTE)
  // ============================================================
  const closeBanner = () => {
    console.log('📱 [Notification] Fechando banner...');
    
    // Salvar no localStorage
    try {
      localStorage.setItem(BANNER_CLOSED_KEY, 'true');
      console.log('📱 [Notification] Banner salvo como fechado no localStorage');
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
    
    // Esconder o banner
    setShowBanner(false);
    setIsVisible(false);
  };

  // ============================================================
  // 5. INSCREVER NO PUSH
  // ============================================================
  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const response = await fetch('/api/notifications/vapid-public-key');
      const data = await response.json();
      
      if (!data.publicKey) {
        console.error('VAPID key não disponível');
        return false;
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: data.publicKey
      });
      
      const tenant = new URLSearchParams(window.location.search).get('tenant') || 
                     localStorage.getItem('tenant') || 
                     'fireburger';
      
      const saveResponse = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription,
          tenant: tenant
        })
      });
      
      if (saveResponse.ok) {
        console.log('✅ Inscrição push salva com sucesso!');
        setIsSubscribed(true);
        setShowBanner(false);
        localStorage.setItem(BANNER_CLOSED_KEY, 'true');
        
        registration.showNotification('🔔 Notificações ativadas!', {
          body: 'Você receberá atualizações sobre seus pedidos em tempo real.',
          icon: '/favicon.png',
          tag: 'welcome'
        });
        
        return true;
      } else {
        console.error('❌ Erro ao salvar inscrição');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erro ao inscrever:', error);
      return false;
    }
  };

  // ============================================================
  // 6. SOLICITAR PERMISSÃO
  // ============================================================
  const requestPermission = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const result = await Notification.requestPermission();
      console.log('📌 Resultado da permissão:', result);
      setPermission(result);
      
      if (result === 'granted') {
        console.log('✅ Permissão concedida!');
        await subscribeToPush();
      } else if (result === 'denied') {
        console.log('❌ Permissão negada pelo usuário');
        closeBanner();
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 7. SE NÃO DEVE MOSTRAR, RETORNAR NULL
  // ============================================================
  if (!isVisible || !showBanner) {
    return null;
  }

  // ============================================================
  // 8. RENDER - JÁ INSCRITO (NÃO DEVE APARECER AQUI, MAS POR SEGURANÇA)
  // ============================================================
  if (isSubscribed) {
    return null;
  }

  // ============================================================
  // 9. RENDER - PERMISSÃO NEGADA
  // ============================================================
  if (permission === 'denied') {
    return (
      <Container style={{ borderLeft: '4px solid #e74c3c' }}>
        <Title>
          <IconWrapper>🔕</IconWrapper>
          Notificações bloqueadas
        </Title>
        <Message>
          Você bloqueou as notificações. Para reativar, vá nas configurações do navegador e permita o site.
        </Message>
        <ButtonGroup>
          <ButtonSecondary onClick={closeBanner}>
            ✕ Fechar
          </ButtonSecondary>
        </ButtonGroup>
      </Container>
    );
  }

  // ============================================================
  // 10. RENDER - SAFARI / iOS
  // ============================================================
  if (browserInfo.isSafari || browserInfo.isIOS) {
    // 10A: Já está rodando como PWA
    if (browserInfo.isPWA) {
      return (
        <Container>
          <Title>
            <IconWrapper>🔔</IconWrapper>
            Ativar Notificações no Safari
          </Title>
          <Message>
            Toque em <strong>"Permitir"</strong> para receber notificações de pedidos em tempo real.
          </Message>
          <ButtonGroup>
            <ButtonPrimary 
              onClick={requestPermission}
              disabled={loading}
            >
              {loading ? '⏳ Solicitando...' : '🔔 Permitir Notificações'}
            </ButtonPrimary>
            <ButtonSecondary onClick={closeBanner}>
              ✕ Fechar
            </ButtonSecondary>
          </ButtonGroup>
        </Container>
      );
    }

    // 10B: Safari normal - precisa instalar o PWA
    return (
      <Container>
        <Title>
          <IconWrapper>📱</IconWrapper>
          Ative as Notificações no Safari
        </Title>
        <Message>
          Para receber notificações, você precisa instalar o app na tela de início:
        </Message>
        <StepsList>
          <li>Toque no ícone <strong>"Compartilhar"</strong> <span style={{ fontSize: 18 }}>📤</span></li>
          <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></li>
          <li>Abra o app pela <strong>tela de início</strong> do iPhone</li>
          <li>Toque em <strong>"Permitir"</strong> quando o Safari solicitar</li>
        </StepsList>
        <HighlightBox>
          💡 <strong>Dica:</strong> O Safari só permite notificações em apps instalados na tela de início.
          Após instalar, abra o app e ative as notificações.
        </HighlightBox>
        <ButtonGroup>
          <ButtonPrimary 
            onClick={() => {
              window.open('https://support.apple.com/pt-br/HT210599', '_blank');
            }}
          >
            📖 Ver Tutorial no Site da Apple
          </ButtonPrimary>
          <ButtonSecondary onClick={closeBanner}>
            ✕ Fechar
          </ButtonSecondary>
        </ButtonGroup>
      </Container>
    );
  }

  // ============================================================
  // 11. RENDER - CHROME/ANDROID
  // ============================================================
  return (
    <Container>
      <Title>
        <IconWrapper>🔔</IconWrapper>
        Receba notificações em tempo real
      </Title>
      <Message>
        Ative as notificações para acompanhar seus pedidos e receber novidades.
      </Message>
      <ButtonGroup>
        <ButtonPrimary 
          onClick={requestPermission}
          disabled={loading}
        >
          {loading ? '⏳ Solicitando...' : '🔔 Ativar Notificações'}
        </ButtonPrimary>
        <ButtonSecondary onClick={closeBanner}>
          ✕ Fechar
        </ButtonSecondary>
      </ButtonGroup>
    </Container>
  );
};

export default NotificationPermission;