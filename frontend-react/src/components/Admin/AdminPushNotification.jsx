// ============================================================
// ADMIN PUSH NOTIFICATION - REGISTRAR ADMIN PARA RECEBER PEDIDOS
// ============================================================

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: ${props => props.$active ? '#e8f5e9' : '#f5f5f5'};
  border-radius: 30px;
  border: 1px solid ${props => props.$active ? '#4caf50' : '#ddd'};
  transition: all 0.3s ease;
`;

const StatusDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.$active ? '#4caf50' : '#e74c3c'};
  display: inline-block;
  animation: ${props => props.$active ? 'pulse 1.5s ease-in-out infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
`;

const StatusText = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.$active ? '#2e7d32' : '#888'};
`;

const ToggleButton = styled.button`
  background: ${props => props.$active ? '#4caf50' : '#e0e0e0'};
  border: none;
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$active ? '#fff' : '#666'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    background: ${props => props.$active ? '#43a047' : '#d0d0d0'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// ============================================================
// FUNÇÃO PARA OBTER ID DO USUÁRIO (DO TOKEN JWT)
// ============================================================
const getUserId = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || null;
    } catch (error) {
        console.error('Erro ao obter userId:', error);
        return null;
    }
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const AdminPushNotification = () => {
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState('default');

    // Verificar status ao carregar
    useEffect(() => {
        if (!tenant) return;

        const checkStatus = async () => {
            if (!('Notification' in window)) {
                console.log('⚠️ Notificações não suportadas');
                return;
            }

            setPermission(Notification.permission);

            if (Notification.permission === 'granted') {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    setIsSubscribed(!!subscription);
                    console.log('📱 Admin inscrito:', !!subscription);
                } catch (error) {
                    console.error('Erro ao verificar inscrição:', error);
                }
            }
        };

        checkStatus();
    }, [tenant]);

    // Inscrever para notificações
    const subscribe = async () => {
        if (loading) return;
        setLoading(true);

        try {
            // 1. Verificar permissão
            if (Notification.permission === 'denied') {
                showToast('🔕 Notificações bloqueadas. Permita nas configurações do navegador.', 'warning');
                setLoading(false);
                return;
            }

            // 2. Solicitar permissão se necessário
            if (Notification.permission === 'default') {
                const result = await Notification.requestPermission();
                setPermission(result);
                if (result !== 'granted') {
                    showToast('⚠️ Permissão negada. Não será possível receber notificações.', 'warning');
                    setLoading(false);
                    return;
                }
            }

            // 3. Obter inscrição
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();

            // 4. Criar inscrição se não existir
            if (!subscription) {
                const response = await fetch('/api/notifications/vapid-public-key');
                const data = await response.json();

                if (!data.publicKey) {
                    showToast('❌ Erro ao configurar notificações.', 'error');
                    setLoading(false);
                    return;
                }

                const applicationServerKey = (key) => {
                    const base64 = key.replace(/-/g, '+').replace(/_/g, '/');
                    const rawData = atob(base64);
                    const outputArray = new Uint8Array(rawData.length);
                    for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                    }
                    return outputArray;
                };

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey(data.publicKey)
                });
            }

            // ✅ 5. Salvar no backend como ADMIN
            const userId = getUserId();
            console.log('📱 Salvando inscrição como ADMIN. User ID:', userId);

            const saveResponse = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription,
                    tenant: tenant,
                    userType: 'admin',
                    userId: userId
                })
            });

            if (saveResponse.ok) {
                setIsSubscribed(true);
                showToast('🔔 Notificações de novos pedidos ativadas para este dispositivo!', 'success');
                
                // Notificação de boas-vindas
                registration.showNotification('🔔 Smart Delivery - Admin', {
                    body: 'Você receberá notificações de novos pedidos neste dispositivo.',
                    icon: '/favicon.png',
                    tag: 'admin-welcome'
                });
            } else {
                const error = await saveResponse.json();
                showToast('❌ ' + (error.error || 'Erro ao salvar inscrição.'), 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao inscrever:', error);
            showToast('❌ Erro ao ativar notificações.', 'error');
        }

        setLoading(false);
    };

    // Desinscrever
    const unsubscribe = async () => {
        setLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                setIsSubscribed(false);
                showToast('🔕 Notificações desativadas para este dispositivo.', 'info');
            }
        } catch (error) {
            console.error('❌ Erro ao desinscrever:', error);
            showToast('❌ Erro ao desativar notificações.', 'error');
        }

        setLoading(false);
    };

    // Se não suportar, não mostrar
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        return null;
    }

    return (
        <Container $active={isSubscribed}>
            <StatusDot $active={isSubscribed} />
            <StatusText $active={isSubscribed}>
                {isSubscribed ? '🔔 Notificações ativas' : '🔕 Notificações desativadas'}
            </StatusText>
            <ToggleButton
                $active={isSubscribed}
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={loading}
            >
                {loading ? '⏳' : (isSubscribed ? 'Desativar' : 'Ativar')}
            </ToggleButton>
        </Container>
    );
};

export default AdminPushNotification;