import React from 'react';
import styled from 'styled-components';
import { Badge } from '../AdminLayout.styled';

const Container = styled.div`
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    margin-bottom: 20px;
`;

const Title = styled.h3`
    margin: 0 0 16px 0;
    color: #2d3436;
    font-size: 18px;
`;

const OrderItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
        border-bottom: none;
    }
`;

const OrderInfo = styled.div`
    flex: 1;
`;

const OrderNumber = styled.div`
    font-weight: 600;
    font-size: 14px;
    color: #2d3436;
`;

const OrderCustomer = styled.div`
    font-size: 13px;
    color: #888;
`;

const OrderTotal = styled.div`
    font-weight: 700;
    color: #e67e22;
    margin-right: 16px;
`;

const RecentOrders = ({ orders }) => {
    if (!orders || orders.length === 0) {
        return (
            <Container>
                <Title>📋 Últimos Pedidos</Title>
                <div style={{ textAlign: 'center', padding: '20px', color: '#b2bec3' }}>
                    Nenhum pedido recente
                </div>
            </Container>
        );
    }

    const statusMap = {
        'pending': { label: '🟡 Pendente', status: 'pending' },
        'confirmado': { label: '🟢 Confirmado', status: 'confirmed' },
        'entregue': { label: '✅ Entregue', status: 'delivered' },
        'cancelado': { label: '❌ Cancelado', status: 'cancelled' }
    };

    return (
        <Container>
            <Title>📋 Últimos Pedidos</Title>
            {orders.slice(0, 5).map(order => {
                const status = statusMap[order.status] || statusMap['pending'];
                return (
                    <OrderItem key={order.id}>
                        <OrderInfo>
                            <OrderNumber>#{order.order_number || order.id}</OrderNumber>
                            <OrderCustomer>{order.customer_name || 'Cliente'}</OrderCustomer>
                        </OrderInfo>
                        <OrderTotal>R$ {parseFloat(order.total).toFixed(2)}</OrderTotal>
                        <Badge $status={status.status}>
                            {status.label}
                        </Badge>
                    </OrderItem>
                );
            })}
        </Container>
    );
};

export default RecentOrders;
