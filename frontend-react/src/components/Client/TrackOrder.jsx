import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { Container, Button, Card } from '../Shared/Container';

const TrackContainer = styled(Container)`
    padding-top: 16px;
    padding-bottom: 40px;
    max-width: 480px;
    margin: 0 auto;
`;

const BackButton = styled.button`
    background: none;
    border: none;
    color: ${props => props.theme.colors.textLight};
    font-size: 14px;
    cursor: pointer;
    padding: 8px 0;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
        color: ${props => props.theme.colors.text};
    }
`;

const Title = styled.h2`
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 20px;
    color: ${props => props.theme.colors.text};
`;

const OrderCard = styled(Card)`
    margin-bottom: 20px;
    padding: 20px;
`;

const OrderNumber = styled.div`
    font-size: 20px;
    font-weight: 700;
    color: #e67e22;
    margin-bottom: 8px;
`;

const StatusBadge = styled.div`
    display: inline-block;
    padding: 8px 16px;
    border-radius: 30px;
    font-weight: 600;
    font-size: 14px;
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

const StatusLabel = styled.div`
    font-size: 14px;
    color: #888;
    margin-top: 4px;
`;

const StatusTimeline = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 20px 0;
`;

const StatusStep = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-radius: 8px;
    background: ${props => props.active ? '#fef9e7' : '#f8f9fa'};
    border-left: 4px solid ${props => props.active ? '#e67e22' : '#ddd'};
    opacity: ${props => props.active ? 1 : 0.5};
    transition: all 0.3s ease;
`;

const StepIcon = styled.div`
    font-size: 24px;
    width: 40px;
    text-align: center;
`;

const StepContent = styled.div`
    flex: 1;
`;

const StepTitle = styled.div`
    font-weight: 600;
    color: ${props => props.active ? '#2d3436' : '#888'};
`;

const StepSubtitle = styled.div`
    font-size: 12px;
    color: ${props => props.active ? '#e67e22' : '#bbb'};
    margin-top: 2px;
`;

const OrderDetails = styled.div`
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 14px;
    color: #555;
`;

const DetailLabel = styled.span`
    color: #888;
`;

const LoadingContainer = styled.div`
    text-align: center;
    padding: 60px 0;
    color: #888;
`;

// ============================================================
//  STATUS DO PEDIDO - MAPEAMENTO COMPLETO
// ============================================================
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
//  ORDEM DOS STATUS PARA TIMELINE
// ============================================================
const statusOrder = ['pending', 'confirmado', 'preparando', 'entregue'];

// ============================================================
//  CORES DOS STATUS
// ============================================================
const statusColors = {
    'pending': '#f39c12',
    'confirmado': '#27ae60',
    'preparando': '#e67e22',
    'entregue': '#2ecc71',
    'cancelado': '#e74c3c'
};

const TrackOrder = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    const loadOrder = async () => {
        try {
            console.log('📦 Buscando pedido:', orderId);
            const response = await api.get(`/orders/${orderId}`);
            console.log('📦 Resposta:', response.data);
            if (response.data.success) {
                setOrder(response.data.data);
                console.log('✅ Pedido carregado:', response.data.data.order_number);
                console.log('📊 Status atual:', response.data.data.status);
            } else {
                showToast('Pedido não encontrado', 'error');
                navigate('/');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar pedido:', error);
            showToast('Erro ao carregar pedido', 'error');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    //  WEBSOCKET - ATUALIZAÇÕES EM TEMPO REAL
    // ============================================================
    useEffect(() => {
        if (!tenant || !orderId) return;

        const token = localStorage.getItem('token');
        const socketInstance = connectSocket(token);
        setSocket(socketInstance);

        if (socketInstance) {
            socketInstance.on('order-updated', (data) => {
                if (data.order && data.order.id === parseInt(orderId)) {
                    console.log('📦 Status atualizado:', data.order.status);
                    setOrder(prev => ({
                        ...prev,
                        status: data.order.status,
                        updated_at: new Date().toISOString()
                    }));
                    showToast(
                        `Status do pedido: ${statusEmojis[data.order.status]} ${statusLabels[data.order.status]}`,
                        'info'
                    );
                }
            });
        }

        return () => {
            disconnectSocket();
            setSocket(null);
        };
    }, [tenant, orderId]);

    useEffect(() => {
        if (orderId) {
            loadOrder();
        } else {
            navigate('/');
        }
    }, [orderId]);

    const getStatusIndex = (status) => {
        return statusOrder.indexOf(status);
    };

    const isStatusActive = (status) => {
        if (!order) return false;
        if (order.status === 'cancelado') return false;
        const currentIndex = getStatusIndex(order.status);
        const statusIndex = getStatusIndex(status);
        return currentIndex >= statusIndex;
    };

    const isStatusCompleted = (status) => {
        if (!order) return false;
        if (order.status === 'cancelado') return false;
        const currentIndex = getStatusIndex(order.status);
        const statusIndex = getStatusIndex(status);
        return currentIndex > statusIndex;
    };

    if (loading) {
        return (
            <TrackContainer>
                <LoadingContainer>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                    <p>Carregando seu pedido...</p>
                </LoadingContainer>
            </TrackContainer>
        );
    }

    if (!order) {
        return (
            <TrackContainer>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                    <h2>Pedido não encontrado</h2>
                    <p style={{ color: '#888' }}>O pedido que você está procurando não existe.</p>
                    <Button primary onClick={() => navigate('/')} style={{ marginTop: 16 }}>
                        Voltar ao cardápio
                    </Button>
                </div>
            </TrackContainer>
        );
    }

    const isCancelled = order.status === 'cancelado';
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    return (
        <TrackContainer>
            <BackButton onClick={() => navigate('/')}>
                ← Voltar
            </BackButton>

            <Title>📦 Acompanhar Pedido</Title>

            <OrderCard>
                <OrderNumber>#{order.order_number}</OrderNumber>
                <StatusBadge status={order.status}>
                    {statusEmojis[order.status]} {statusLabels[order.status] || order.status}
                </StatusBadge>
                <StatusLabel>
                    {order.status === 'pending' && 'Aguardando confirmação do restaurante'}
                    {order.status === 'confirmado' && 'Pedido confirmado! Estamos preparando seu pedido'}
                    {order.status === 'preparando' && 'Seu pedido está sendo preparado!'}
                    {order.status === 'entregue' && 'Pedido entregue! Aproveite!'}
                    {order.status === 'cancelado' && 'Pedido cancelado'}
                </StatusLabel>

                <StatusTimeline>
                    {statusOrder.map((status) => {
                        const active = !isCancelled && isStatusActive(status);
                        const completed = !isCancelled && isStatusCompleted(status);
                        const icon = isCancelled ? '❌' : 
                                   completed ? '✅' : 
                                   active ? statusEmojis[status] : '⏳';
                        
                        return (
                            <StatusStep key={status} active={active}>
                                <StepIcon>{icon}</StepIcon>
                                <StepContent>
                                    <StepTitle active={active}>
                                        {statusEmojis[status]} {statusLabels[status]}
                                    </StepTitle>
                                    {completed && !isCancelled && (
                                        <StepSubtitle active={active}>✓ Concluído</StepSubtitle>
                                    )}
                                    {active && !isCancelled && !completed && (
                                        <StepSubtitle active={active}>⏳ Em andamento</StepSubtitle>
                                    )}
                                    {status === 'preparando' && active && !completed && (
                                        <StepSubtitle active={active}>👨‍🍳 Cozinha preparando seu pedido</StepSubtitle>
                                    )}
                                </StepContent>
                            </StatusStep>
                        );
                    })}
                    
                    {isCancelled && (
                        <StatusStep active={true}>
                            <StepIcon>❌</StepIcon>
                            <StepContent>
                                <StepTitle active={true} style={{ color: '#e74c3c' }}>
                                    Pedido Cancelado
                                </StepTitle>
                                <StepSubtitle active={true}>Pedido foi cancelado</StepSubtitle>
                            </StepContent>
                        </StatusStep>
                    )}
                </StatusTimeline>

                <OrderDetails>
                    <div style={{ marginBottom: 12 }}>
                        <strong style={{ color: '#555' }}>Itens:</strong>
                        {items.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>
                                <span>{item.qty}x {item.name}</span>
                                <span>R$ {(item.price * item.qty).toFixed(2)}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0 0', fontWeight: 'bold', borderTop: '2px solid #f0f0f0', marginTop: '4px' }}>
                            <span>Total</span>
                            <span>R$ {parseFloat(order.total).toFixed(2)}</span>
                        </div>
                    </div>

                    <DetailRow>
                        <DetailLabel>Data do pedido</DetailLabel>
                        <span>{new Date(order.created_at).toLocaleString('pt-BR')}</span>
                    </DetailRow>
                    <DetailRow>
                        <DetailLabel>Pagamento</DetailLabel>
                        <span>{order.payment_method}</span>
                    </DetailRow>
                    <DetailRow>
                        <DetailLabel>Endereço</DetailLabel>
                        <span style={{ textAlign: 'right', maxWidth: '60%' }}>
                            {order.customer_address}
                        </span>
                    </DetailRow>
                </OrderDetails>
            </OrderCard>

            <Button primary onClick={() => navigate('/')} style={{ width: '100%' }}>
                Voltar ao cardápio
            </Button>
        </TrackContainer>
    );
};

export default TrackOrder;
