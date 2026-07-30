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
    padding: 12px;
    border-radius: 8px;
    background: ${props => props.active ? '#fef9e7' : '#f8f9fa'};
    border-left: 4px solid ${props => props.active ? '#e67e22' : '#ddd'};
    opacity: ${props => props.active ? 1 : 0.6};
    transition: all 0.3s ease;
`;

const StepIcon = styled.div`
    font-size: 24px;
`;

const StepContent = styled.div`
    flex: 1;
`;

const StepTitle = styled.div`
    font-weight: 600;
    color: ${props => props.active ? '#e67e22' : '#888'};
`;

const StepTime = styled.div`
    font-size: 12px;
    color: #888;
`;

const OrderDetails = styled.div`
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
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

const TrackOrder = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    // Status em português
    const statusLabels = {
        'pending': '🟡 Aguardando confirmação',
        'confirmado': '🟢 Confirmado',
        'preparando': '🟠 Em preparo',
        'entregue': '✅ Entregue',
        'cancelado': '❌ Cancelado'
    };

    const statusIcons = {
        'pending': '📋',
        'confirmado': '✅',
        'preparando': '👨‍🍳',
        'entregue': '📦',
        'cancelado': '❌'
    };

    const statusOrder = ['pending', 'confirmado', 'preparando', 'entregue'];

    // Carregar dados do pedido
    const loadOrder = async () => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            if (response.data.success) {
                setOrder(response.data.data);
            } else {
                showToast('Pedido não encontrado', 'error');
                navigate('/');
            }
        } catch (error) {
            console.error('Erro ao carregar pedido:', error);
            showToast('Erro ao carregar pedido', 'error');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    // Conectar socket para atualizações em tempo real
    useEffect(() => {
        if (!tenant || !orderId) return;

        const token = localStorage.getItem('token');
        const socketInstance = connectSocket(token);
        setSocket(socketInstance);

        if (socketInstance) {
            // Ouvir atualizações do pedido
            socketInstance.on('order-updated', (data) => {
                if (data.order && data.order.id === parseInt(orderId)) {
                    console.log('📦 Status atualizado:', data.order.status);
                    setOrder(prev => ({
                        ...prev,
                        status: data.order.status,
                        updated_at: new Date().toISOString()
                    }));
                    showToast(
                        `Status do pedido atualizado: ${statusLabels[data.order.status]}`,
                        'info'
                    );
                }
            });

            // Ouvir notificações de novo pedido (para o caso de ser o próprio pedido)
            socketInstance.on('new-order-notification', (data) => {
                if (data.order && data.order.id === parseInt(orderId)) {
                    loadOrder();
                }
            });
        }

        return () => {
            disconnectSocket();
            setSocket(null);
        };
    }, [tenant, orderId]);

    // Carregar pedido inicial
    useEffect(() => {
        loadOrder();
    }, [orderId]);

    // Função para verificar se um status está ativo ou já passou
    const isStatusActive = (status) => {
        if (!order) return false;
        const currentIndex = statusOrder.indexOf(order.status);
        const statusIndex = statusOrder.indexOf(status);
        return currentIndex >= statusIndex && order.status !== 'cancelado';
    };

    const isStatusCompleted = (status) => {
        if (!order) return false;
        const currentIndex = statusOrder.indexOf(order.status);
        const statusIndex = statusOrder.indexOf(status);
        return currentIndex > statusIndex && order.status !== 'cancelado';
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

    return (
        <TrackContainer>
            <BackButton onClick={() => navigate('/')}>
                ← Voltar
            </BackButton>

            <Title>📦 Acompanhar Pedido</Title>

            <OrderCard>
                <OrderNumber>#{order.order_number}</OrderNumber>
                <StatusBadge status={order.status}>
                    {statusLabels[order.status] || order.status}
                </StatusBadge>
                <StatusLabel>
                    {order.status === 'pending' && 'Aguardando confirmação do restaurante'}
                    {order.status === 'confirmado' && 'Pedido confirmado! Estamos preparando seu pedido'}
                    {order.status === 'preparando' && 'Seu pedido está sendo preparado!'}
                    {order.status === 'entregue' && 'Pedido entregue! Aproveite!'}
                    {order.status === 'cancelado' && 'Pedido cancelado'}
                </StatusLabel>

                <StatusTimeline>
                    {statusOrder.map((status) => (
                        <StatusStep 
                            key={status}
                            active={!isCancelled && isStatusActive(status)}
                        >
                            <StepIcon>
                                {isCancelled ? '❌' : (
                                    isStatusCompleted(status) ? '✅' : 
                                    isStatusActive(status) ? '⏳' : 
                                    statusIcons[status]
                                )}
                            </StepIcon>
                            <StepContent>
                                <StepTitle active={!isCancelled && isStatusActive(status)}>
                                    {statusLabels[status]}
                                </StepTitle>
                                {isStatusCompleted(status) && !isCancelled && (
                                    <StepTime>✓ Concluído</StepTime>
                                )}
                                {isStatusActive(status) && !isCancelled && (
                                    <StepTime>⏳ Em andamento</StepTime>
                                )}
                            </StepContent>
                        </StatusStep>
                    ))}
                    
                    {/* Status cancelado */}
                    {isCancelled && (
                        <StatusStep active={true}>
                            <StepIcon>❌</StepIcon>
                            <StepContent>
                                <StepTitle active={true} style={{ color: '#e74c3c' }}>
                                    Pedido Cancelado
                                </StepTitle>
                            </StepContent>
                        </StatusStep>
                    )}
                </StatusTimeline>

                <OrderDetails>
                    <DetailRow>
                        <DetailLabel>Data do pedido</DetailLabel>
                        <span>{new Date(order.created_at).toLocaleString('pt-BR')}</span>
                    </DetailRow>
                    <DetailRow>
                        <DetailLabel>Total</DetailLabel>
                        <strong>R$ {parseFloat(order.total).toFixed(2)}</strong>
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
