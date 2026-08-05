import React, { useState } from 'react';
import styled from 'styled-components';
import {
    OrdersContainer,
    TableWrapper,
    Table,
    Badge,
    ActionButton,
    ActionContainer,
    MobileOrderCard,
    MobileOrderRow,
    MobileItemsList,
    MobileActions
} from './AdminLayout.styled';

// ============================================================
//  FILTRO DE STATUS
// ============================================================
const StatusFilter = styled.select`
    padding: 8px 14px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    background: #fff;
    color: #2d3436;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
    min-width: 160px;

    &:focus {
        border-color: #e67e22;
    }

    @media (max-width: 768px) {
        width: 100%;
        min-width: unset;
    }
`;

// ============================================================
//  HEADER COM FILTRO
// ============================================================
const OrdersHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const HeaderTitle = styled.h3`
    margin: 0;
    font-size: 18px;
    color: #2d3436;

    @media (max-width: 768px) {
        font-size: 16px;
    }
`;

const FilterGroup = styled.div`
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;

    @media (max-width: 768px) {
        width: 100%;
        flex-direction: column;
    }
`;

const Orders = ({
    orders: allOrders,
    unreadOrders,
    onUpdateStatus,
    onOpenTracking,
    onRefresh
}) => {
    // ============================================================
    //  ESTADO DO FILTRO
    // ============================================================
    const [statusFilter, setStatusFilter] = useState('all');

    // ============================================================
    //  FILTRAR PEDIDOS POR STATUS
    // ============================================================
    const filteredOrders = statusFilter === 'all'
        ? allOrders
        : allOrders.filter(o => {
            const status = o.status || 'pending';
            return status === statusFilter;
        });

    // ============================================================
    //  FUNÇÃO PARA PARSE DOS ITENS
    // ============================================================
    const parseItems = (items) => {
        if (typeof items === 'string') {
            try { return JSON.parse(items); } catch (e) { return []; }
        }
        if (!Array.isArray(items)) return [];
        return items;
    };

    // ============================================================
    //  MAPEAMENTO DE STATUS
    // ============================================================
    const statusMap = {
        'pending': 'pending',
        'confirmado': 'confirmed',
        'preparando': 'preparing',
        'entregue': 'delivered',
        'cancelado': 'cancelled',
        'scheduled': 'scheduled'
    };

    const statusLabels = {
        'pending': '🟡 Pendente',
        'confirmado': '🟢 Confirmado',
        'preparando': '🟠 Em preparo',
        'entregue': '✅ Entregue',
        'cancelado': '❌ Cancelado',
        'scheduled': '📅 Agendado'
    };

    const statusOptions = [
        { value: 'all', label: '📋 Todos os pedidos' },
        { value: 'scheduled', label: '📅 Agendados' },
        { value: 'pending', label: '🟡 Pendentes' },
        { value: 'confirmado', label: '🟢 Confirmados' },
        { value: 'preparando', label: '🟠 Em preparo' },
        { value: 'entregue', label: '✅ Entregues' },
        { value: 'cancelado', label: '❌ Cancelados' }
    ];

    const getStatusForBadge = (status) => {
        return statusMap[status] || 'pending';
    };

    const getStatusLabel = (status) => {
        return statusLabels[status] || status;
    };

    return (
        <OrdersContainer>
            <OrdersHeader>
                <HeaderTitle>
                    📋 Pedidos Recebidos
                    {unreadOrders > 0 && (
                        <span style={{ 
                            fontSize: '14px', 
                            color: '#e74c3c', 
                            marginLeft: '12px',
                            fontWeight: 'normal'
                        }}>
                            ({unreadOrders} novos)
                        </span>
                    )}
                </HeaderTitle>

                <FilterGroup>
                    <StatusFilter
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </StatusFilter>
                </FilterGroup>
            </OrdersHeader>

            {filteredOrders.length === 0 ? (
                <p style={{ color: '#888', padding: '20px 0' }}>
                    {allOrders.length === 0 
                        ? 'Nenhum pedido recebido.' 
                        : 'Nenhum pedido encontrado com o filtro selecionado.'}
                </p>
            ) : (
                <>
                    {/* TABELA DESKTOP */}
                    <TableWrapper className="desktop-table">
                        <Table>
                            <thead>
                                <tr>
                                    <th>Pedido</th>
                                    <th>Cliente</th>
                                    <th>Itens</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(o => {
                                    const items = parseItems(o.items);
                                    const statusClass = o.status || 'pending';

                                    return (
                                        <tr key={o.id}>
                                            <td>
                                                <span 
                                                    style={{ 
                                                        color: '#e67e22', 
                                                        cursor: 'pointer', 
                                                        fontWeight: '600',
                                                        textDecoration: 'underline',
                                                        textDecorationStyle: 'dotted'
                                                    }}
                                                    onClick={() => onOpenTracking(o.id, o.access_token)}
                                                    title="Clique para ver detalhes do pedido"
                                                >
                                                    #{o.order_number || o.id}
                                                </span>
                                                {o.is_scheduled && (
                                                    <span style={{
                                                        background: '#e67e22',
                                                        color: '#fff',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '10px',
                                                        marginLeft: '6px',
                                                        display: 'inline-block'
                                                    }}>
                                                        📅
                                                    </span>
                                                )}
                                                {o.is_scheduled && o.scheduled_time && (
                                                    <div style={{
                                                        fontSize: '10px',
                                                        color: '#e67e22',
                                                        marginTop: '2px'
                                                    }}>
                                                        {new Date(o.scheduled_time).toLocaleString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{o.customer_name || 'Cliente'}</td>
                                            <td>
                                                {items.map((i, idx) => (
                                                    <div key={idx}>{i.qty}x {i.name}</div>
                                                ))}
                                            </td>
                                            <td><strong>R$ {parseFloat(o.total).toFixed(2)}</strong></td>
                                            <td>
                                                <Badge $status={getStatusForBadge(statusClass)}>
                                                    {getStatusLabel(statusClass)}
                                                </Badge>
                                            </td>
                                            <td>
                                                <ActionContainer>
                                                    {statusClass === 'scheduled' && (
                                                        <>
                                                            <ActionButton 
                                                                $variant="confirm" 
                                                                onClick={() => onUpdateStatus(o.id, 'confirmado')}
                                                            >
                                                                ✅ Confirmar
                                                            </ActionButton>
                                                            <ActionButton 
                                                                $variant="cancel" 
                                                                onClick={() => onUpdateStatus(o.id, 'cancelado')}
                                                            >
                                                                ❌ Cancelar
                                                            </ActionButton>
                                                        </>
                                                    )}
                                                    {statusClass === 'pending' && (
                                                        <>
                                                            <ActionButton 
                                                                $variant="confirm" 
                                                                onClick={() => onUpdateStatus(o.id, 'confirmado')}
                                                            >
                                                                ✅ Confirmar
                                                            </ActionButton>
                                                            <ActionButton 
                                                                $variant="cancel" 
                                                                onClick={() => onUpdateStatus(o.id, 'cancelado')}
                                                            >
                                                                ❌ Cancelar
                                                            </ActionButton>
                                                        </>
                                                    )}
                                                    {statusClass === 'confirmado' && (
                                                        <>
                                                            <ActionButton 
                                                                $variant="preparar" 
                                                                onClick={() => onUpdateStatus(o.id, 'preparando')}
                                                            >
                                                                👨‍🍳 Em preparo
                                                            </ActionButton>
                                                            <ActionButton 
                                                                $variant="cancel" 
                                                                onClick={() => onUpdateStatus(o.id, 'cancelado')}
                                                            >
                                                                ❌ Cancelar
                                                            </ActionButton>
                                                        </>
                                                    )}
                                                    {statusClass === 'preparando' && (
                                                        <ActionButton 
                                                            $variant="deliver" 
                                                            onClick={() => onUpdateStatus(o.id, 'entregue')}
                                                        >
                                                            📦 Entregue
                                                        </ActionButton>
                                                    )}
                                                    {statusClass === 'entregue' && (
                                                        <Badge $status="delivered">
                                                            ✅ Finalizado
                                                        </Badge>
                                                    )}
                                                    {statusClass === 'cancelado' && (
                                                        <Badge $status="cancelled">
                                                            ❌ Cancelado
                                                        </Badge>
                                                    )}
                                                </ActionContainer>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </TableWrapper>

                    {/* CARDS MOBILE */}
                    <div className="mobile-cards">
                        {filteredOrders.map(o => {
                            const items = parseItems(o.items);
                            const statusClass = o.status || 'pending';

                            return (
                                <MobileOrderCard key={o.id}>
                                    <MobileOrderRow>
                                        <span className="label">Pedido</span>
                                        <span className="value">
                                            <span 
                                                style={{ 
                                                    color: '#e67e22', 
                                                    cursor: 'pointer', 
                                                    fontWeight: '600',
                                                    textDecoration: 'underline',
                                                    textDecorationStyle: 'dotted'
                                                }}
                                                onClick={() => onOpenTracking(o.id, o.access_token)}
                                                title="Clique para ver detalhes do pedido"
                                            >
                                                #{o.order_number || o.id}
                                            </span>
                                            {o.is_scheduled && (
                                                <span style={{
                                                    background: '#e67e22',
                                                    color: '#fff',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '10px',
                                                    marginLeft: '6px',
                                                    display: 'inline-block'
                                                }}>
                                                    📅
                                                </span>
                                            )}
                                        </span>
                                    </MobileOrderRow>
                                    {o.is_scheduled && o.scheduled_time && (
                                        <MobileOrderRow>
                                            <span className="label">Agendado</span>
                                            <span className="value" style={{ fontSize: '12px', color: '#e67e22' }}>
                                                {new Date(o.scheduled_time).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </MobileOrderRow>
                                    )}
                                    <MobileOrderRow>
                                        <span className="label">Cliente</span>
                                        <span className="value">{o.customer_name || 'Cliente'}</span>
                                    </MobileOrderRow>
                                    <MobileOrderRow>
                                        <span className="label">Total</span>
                                        <span className="value"><strong>R$ {parseFloat(o.total).toFixed(2)}</strong></span>
                                    </MobileOrderRow>
                                    <MobileOrderRow>
                                        <span className="label">Status</span>
                                        <span className="value">
                                            <Badge $status={getStatusForBadge(statusClass)}>
                                                {getStatusLabel(statusClass)}
                                            </Badge>
                                        </span>
                                    </MobileOrderRow>
                                    <MobileOrderRow style={{ flexDirection: 'column', alignItems: 'stretch', borderBottom: 'none' }}>
                                        <span className="label" style={{ marginBottom: '8px' }}>Itens</span>
                                        <MobileItemsList>
                                            {items.map((item, idx) => (
                                                <div className="item" key={idx}>
                                                    <span className="item-name">{item.name}</span>
                                                    <span className="item-qty">{item.qty}x</span>
                                                    <span className="item-price">R$ {(item.price * item.qty).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </MobileItemsList>
                                    </MobileOrderRow>
                                    <MobileActions>
                                        {statusClass === 'scheduled' && (
                                            <>
                                                <ActionButton 
                                                    $variant="confirm" 
                                                    onClick={() => onUpdateStatus(o.id, 'confirmado')}
                                                    style={{ flex: 1 }}
                                                >
                                                    ✅ Confirmar
                                                </ActionButton>
                                                <ActionButton 
                                                    $variant="cancel" 
                                                    onClick={() => onUpdateStatus(o.id, 'cancelado')}
                                                    style={{ flex: 1 }}
                                                >
                                                    ❌ Cancelar
                                                </ActionButton>
                                            </>
                                        )}
                                        {statusClass === 'pending' && (
                                            <>
                                                <ActionButton 
                                                    $variant="confirm" 
                                                    onClick={() => onUpdateStatus(o.id, 'confirmado')}
                                                    style={{ flex: 1 }}
                                                >
                                                    ✅ Confirmar
                                                </ActionButton>
                                                <ActionButton 
                                                    $variant="cancel" 
                                                    onClick={() => onUpdateStatus(o.id, 'cancelado')}
                                                    style={{ flex: 1 }}
                                                >
                                                    ❌ Cancelar
                                                </ActionButton>
                                            </>
                                        )}
                                        {statusClass === 'confirmado' && (
                                            <>
                                                <ActionButton 
                                                    $variant="preparar" 
                                                    onClick={() => onUpdateStatus(o.id, 'preparando')}
                                                    style={{ flex: 1 }}
                                                >
                                                    👨‍🍳 Em preparo
                                                </ActionButton>
                                                <ActionButton 
                                                    $variant="cancel" 
                                                    onClick={() => onUpdateStatus(o.id, 'cancelado')}
                                                    style={{ flex: 1 }}
                                                >
                                                    ❌ Cancelar
                                                </ActionButton>
                                            </>
                                        )}
                                        {statusClass === 'preparando' && (
                                            <ActionButton 
                                                $variant="deliver" 
                                                onClick={() => onUpdateStatus(o.id, 'entregue')}
                                                style={{ flex: 1 }}
                                            >
                                                📦 Entregue
                                            </ActionButton>
                                        )}
                                        {statusClass === 'entregue' && (
                                            <Badge $status="delivered" style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
                                                ✅ Finalizado
                                            </Badge>
                                        )}
                                        {statusClass === 'cancelado' && (
                                            <Badge $status="cancelled" style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
                                                ❌ Cancelado
                                            </Badge>
                                        )}
                                    </MobileActions>
                                </MobileOrderCard>
                            );
                        })}
                    </div>
                </>
            )}
        </OrdersContainer>
    );
};

export default Orders;
