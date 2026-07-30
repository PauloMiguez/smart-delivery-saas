import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { Container, Button, Card } from '../Shared/Container';

const HistoryContainer = styled(Container)`
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
    margin-bottom: 16px;
    padding: 16px;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        transform: translateY(-2px);
    }
`;

const OrderHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
`;

const OrderNumber = styled.span`
    font-weight: 700;
    color: #e67e22;
    font-size: 16px;
`;

const OrderDate = styled.span`
    font-size: 13px;
    color: #888;
`;

const OrderStatus = styled.span`
    display: inline-block;
    padding: 4px 12px;
    border-radius: 30px;
    font-size: 12px;
    font-weight: 600;
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

const OrderItems = styled.div`
    font-size: 14px;
    color: #555;
    margin: 8px 0;
`;

const OrderTotal = styled.div`
    font-weight: 700;
    font-size: 16px;
    color: #2d3436;
`;

const TrackLink = styled(Link)`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #e67e22;
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;
    margin-top: 8px;
    
    &:hover {
        text-decoration: underline;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 60px 0;
    color: #888;
    
    .icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    
    h3 {
        color: #2d3436;
        margin-bottom: 8px;
    }
`;

const LoadingContainer = styled.div`
    text-align: center;
    padding: 60px 0;
    color: #888;
`;

const OrdersHistory = () => {
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const statusLabels = {
        'pending': '🟡 Pendente',
        'confirmado': '🟢 Confirmado',
        'preparando': '🟠 Em preparo',
        'entregue': '✅ Entregue',
        'cancelado': '❌ Cancelado'
    };

    useEffect(() => {
        if (!tenant) return;

        const loadOrders = async () => {
            try {
                setLoading(true);
                const response = await api.get('/orders');
                if (response.data.success) {
                    setOrders(response.data.data || []);
                }
            } catch (error) {
                console.error('Erro ao carregar pedidos:', error);
                showToast('Erro ao carregar pedidos', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, [tenant]);

    if (loading) {
        return (
            <HistoryContainer>
                <LoadingContainer>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                    <p>Carregando seus pedidos...</p>
                </LoadingContainer>
            </HistoryContainer>
        );
    }

    return (
        <HistoryContainer>
            <BackButton onClick={() => navigate('/')}>
                ← Voltar
            </BackButton>

            <Title>📋 Meus Pedidos</Title>

            {orders.length === 0 ? (
                <EmptyState>
                    <div className="icon">📭</div>
                    <h3>Nenhum pedido encontrado</h3>
                    <p>Você ainda não realizou pedidos.</p>
                    <Button primary onClick={() => navigate('/')} style={{ marginTop: 16 }}>
                        Ver cardápio
                    </Button>
                </EmptyState>
            ) : (
                orders.map(order => {
                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    return (
                        <OrderCard key={order.id}>
                            <OrderHeader>
                                <OrderNumber>#{order.order_number || order.id}</OrderNumber>
                                <OrderDate>
                                    {new Date(order.created_at).toLocaleString('pt-BR')}
                                </OrderDate>
                            </OrderHeader>
                            <OrderStatus status={order.status}>
                                {statusLabels[order.status] || order.status}
                            </OrderStatus>
                            <OrderItems>
                                {items.slice(0, 3).map((item, idx) => (
                                    <span key={idx}>
                                        {idx > 0 && ', '}
                                        {item.qty}x {item.name}
                                    </span>
                                ))}
                                {items.length > 3 && ` +${items.length - 3} outros`}
                            </OrderItems>
                            <OrderTotal>Total: R$ {parseFloat(order.total).toFixed(2)}</OrderTotal>
                            <TrackLink to={`/track/${order.id}`}>
                                🔍 Acompanhar pedido
                            </TrackLink>
                        </OrderCard>
                    );
                })
            )}
        </HistoryContainer>
    );
};

export default OrdersHistory;
