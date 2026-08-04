import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: ${props => props.isOpen ? 'flex' : 'none'};
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: 20px;
`;

const ModalContent = styled.div`
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideIn 0.3s ease;
    position: relative;

    @keyframes slideIn {
        from {
            transform: translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e67e22;
`;

const ModalTitle = styled.h3`
    margin: 0;
    color: #2d3436;
    font-size: 18px;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #888;
    padding: 0 8px;

    &:hover {
        color: #2d3436;
    }
`;

const LoadingContainer = styled.div`
    text-align: center;
    padding: 40px 0;
    color: #888;
`;

const ErrorContainer = styled.div`
    text-align: center;
    padding: 40px 0;
    color: #e74c3c;
`;

const OrderCard = styled.div`
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 12px;
`;

const OrderNumber = styled.div`
    font-size: 18px;
    font-weight: 700;
    color: #e67e22;
    margin-bottom: 8px;
`;

const StatusBadge = styled.div`
    display: inline-block;
    padding: 6px 14px;
    border-radius: 30px;
    font-weight: 600;
    font-size: 13px;
    background: ${props => {
        switch(props.status) {
            case 'pending': return '#fef9e7';
            case 'confirmado': return '#d5f5e3';
            case 'preparando': return '#fdebd0';
            case 'entregue': return '#d5f5e3';
            case 'cancelado': return '#fdedec';
            default: return '#f5f5f5';
        }
    }};
    color: ${props => {
        switch(props.status) {
            case 'pending': return '#f39c12';
            case 'confirmado': return '#27ae60';
            case 'preparando': return '#e67e22';
            case 'entregue': return '#27ae60';
            case 'cancelado': return '#e74c3c';
            default: return '#888';
        }
    }};
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 14px;
    color: #555;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
        border-bottom: none;
    }
`;

const DetailLabel = styled.span`
    color: #888;
`;

const statusLabels = {
    'pending': 'Aguardando confirmação',
    'confirmado': 'Confirmado',
    'preparando': 'Em preparação',
    'entregue': 'Entregue',
    'cancelado': 'Cancelado'
};

const statusEmojis = {
    'pending': '📋',
    'confirmado': '✅',
    'preparando': '👨‍🍳',
    'entregue': '📦',
    'cancelado': '❌'
};

// ============================================================
//  FUNÇÃO CORRIGIDA - created_at em UTC, scheduled_time em string
// ============================================================
const formatLocalDate = (dateString, isScheduled = false) => {
    if (!dateString) return '-';
    try {
        if (isScheduled) {
            // ✅ scheduled_time: string pura YYYY-MM-DDTHH:MM:SS
            // Extrair manualmente sem conversão
            const clean = dateString.replace(' ', 'T');
            const parts = clean.split('T');
            if (parts.length !== 2) return dateString;
            
            const datePart = parts[0];
            const timePart = parts[1];
            
            const dateComponents = datePart.split('-');
            if (dateComponents.length !== 3) return dateString;
            
            const year = dateComponents[0];
            const month = dateComponents[1];
            const day = dateComponents[2];
            
            const timeComponents = timePart.split(':');
            if (timeComponents.length < 2) return dateString;
            
            const hours = timeComponents[0];
            const minutes = timeComponents[1];
            
            return `${day}/${month}/${year}, ${hours}:${minutes}`;
        } else {
            // ✅ created_at: está em UTC (salvo com -3h)
            // Converter para local subtraindo 3 horas
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            
            // Subtrair 3 horas (UTC-3)
            const localDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
            
            return localDate.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } catch (error) {
        console.error('❌ Erro ao formatar data:', error);
        return dateString || '-';
    }
};

const OrderTrackingModal = ({ isOpen, onClose, orderId, token }) => {
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);

    const loadOrder = async () => {
        setLoading(true);
        setError(null);
        
        try {
            if (!token) {
                setError('Token de acesso não encontrado.');
                setLoading(false);
                return;
            }

            const response = await api.get(`/orders/${orderId}?token=${token}`);
            
            if (response.data.success) {
                setOrder(response.data.data);
                console.log('✅ Pedido carregado no modal:', response.data.data.order_number);
                console.log('📅 scheduled_time (raw):', response.data.data.scheduled_time);
            } else {
                setError('Pedido não encontrado');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar pedido:', error);
            setError('Erro ao carregar pedido.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && orderId && token) {
            loadOrder();
        }
    }, [isOpen, orderId, token]);

    // Socket para atualizações em tempo real
    useEffect(() => {
        if (!isOpen || !order || !tenant) return;

        const tokenAuth = localStorage.getItem('token');
        const socketInstance = connectSocket(tokenAuth);
        setSocket(socketInstance);

        if (socketInstance) {
            socketInstance.on('order-updated', (data) => {
                if (data.order && data.order.id === parseInt(orderId)) {
                    console.log('📦 Status atualizado no modal:', data.order.status);
                    setOrder(prev => ({
                        ...prev,
                        status: data.order.status,
                        updated_at: new Date().toISOString()
                    }));
                    showToast(
                        `Status atualizado: ${statusEmojis[data.order.status]} ${statusLabels[data.order.status]}`,
                        'info'
                    );
                }
            });
        }

        return () => {
            disconnectSocket();
            setSocket(null);
        };
    }, [isOpen, order, tenant]);

    if (!isOpen) return null;

    return (
        <ModalOverlay isOpen={isOpen} onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>📦 Acompanhar Pedido</ModalTitle>
                    <CloseButton onClick={onClose}>✕</CloseButton>
                </ModalHeader>

                {loading && (
                    <LoadingContainer>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                        <p>Carregando pedido...</p>
                    </LoadingContainer>
                )}

                {error && !loading && (
                    <ErrorContainer>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
                        <p>{error}</p>
                    </ErrorContainer>
                )}

                {order && !loading && (
                    <>
                        <OrderCard>
                            <OrderNumber>#{order.order_number}</OrderNumber>
                            <StatusBadge status={order.status}>
                                {statusEmojis[order.status]} {statusLabels[order.status] || order.status}
                            </StatusBadge>
                        </OrderCard>

                        <div>
                            <DetailRow>
                                <DetailLabel>Cliente</DetailLabel>
                                <span>{order.customer_name || 'N/A'}</span>
                            </DetailRow>
                            <DetailRow>
                                <DetailLabel>Telefone</DetailLabel>
                                <span>{order.customer_phone || 'N/A'}</span>
                            </DetailRow>
                            <DetailRow>
                                <DetailLabel>Endereço</DetailLabel>
                                <span style={{ textAlign: 'right', maxWidth: '60%' }}>
                                    {order.customer_address || 'N/A'}
                                </span>
                            </DetailRow>
                            <DetailRow>
                                <DetailLabel>Pagamento</DetailLabel>
                                <span>{order.payment_method || 'N/A'}</span>
                            </DetailRow>
                            <DetailRow>
                                <DetailLabel>Total</DetailLabel>
                                <strong>R$ {parseFloat(order.total).toFixed(2)}</strong>
                            </DetailRow>
                            
                            <DetailRow>
                                <DetailLabel>Data do Pedido</DetailLabel>
                                <span>{formatLocalDate(order.created_at, false)}</span>
                            </DetailRow>
                            
                            {order.is_scheduled && order.scheduled_time && (
                                <DetailRow style={{ 
                                    backgroundColor: '#fef9e7', 
                                    borderLeft: '3px solid #f39c12',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    marginTop: '4px'
                                }}>
                                    <DetailLabel style={{ fontWeight: '600' }}>
                                        📅 Agendado para
                                    </DetailLabel>
                                    <span style={{ color: '#e67e22', fontWeight: '700' }}>
                                        {formatLocalDate(order.scheduled_time, true)}
                                    </span>
                                </DetailRow>
                            )}
                        </div>

                        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                            <strong style={{ color: '#555', display: 'block', marginBottom: 8 }}>Itens:</strong>
                            {(() => {
                                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                return items.map((item, index) => (
                                    <DetailRow key={index} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <span>{item.qty}x {item.name}</span>
                                        <span>R$ {(item.price * item.qty).toFixed(2)}</span>
                                    </DetailRow>
                                ));
                            })()}
                        </div>
                    </>
                )}
            </ModalContent>
        </ModalOverlay>
    );
};

export default OrderTrackingModal;
