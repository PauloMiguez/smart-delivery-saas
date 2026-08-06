import React, { useState } from 'react';
import styled from 'styled-components';
import { tokens } from '../../styles/tokens';
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
//  STYLED COMPONENTS
// ============================================================
const StatusFilter = styled.select`
    padding: ${tokens.spacing.sm} ${tokens.spacing.md};
    border: 1.5px solid ${tokens.colors.border};
    border-radius: ${tokens.radius.md};
    font-size: ${tokens.typography.fontSize.sm};
    background: ${tokens.colors.surface};
    color: ${tokens.colors.text};
    cursor: pointer;
    outline: none;
    transition: all 0.2s ease-in-out;
    min-width: 160px;
    font-family: ${tokens.typography.fontFamily};

    &:hover {
        border-color: ${tokens.colors.borderHover};
    }

    &:focus {
        border-color: ${tokens.colors.accent};
        box-shadow: 0 0 0 3px ${tokens.colors.accentLight};
    }

    @media (max-width: ${tokens.breakpoints.md}) {
        width: 100%;
        min-width: unset;
    }
`;

const OrdersHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${tokens.spacing.md};
    flex-wrap: wrap;
    gap: ${tokens.spacing.sm};

    @media (max-width: ${tokens.breakpoints.md}) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const HeaderTitle = styled.h3`
    margin: 0;
    font-size: ${tokens.typography.fontSize.lg};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.text};
    letter-spacing: -0.02em;

    @media (max-width: ${tokens.breakpoints.md}) {
        font-size: ${tokens.typography.fontSize.base};
    }
`;

const FilterGroup = styled.div`
    display: flex;
    gap: ${tokens.spacing.sm};
    align-items: center;
    flex-wrap: wrap;

    @media (max-width: ${tokens.breakpoints.md}) {
        width: 100%;
        flex-direction: column;
    }
`;

const OrderNumber = styled.span`
    color: ${tokens.colors.accent};
    cursor: pointer;
    font-weight: ${tokens.typography.fontWeight.semibold};
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 2px;

    &:hover {
        color: ${tokens.colors.accentHover};
    }
`;

const ScheduledBadge = styled.span`
    background: ${tokens.colors.accent};
    color: ${tokens.colors.surface};
    padding: 2px 8px;
    border-radius: ${tokens.radius.full};
    font-size: ${tokens.typography.fontSize.xs};
    margin-left: ${tokens.spacing.xs};
    display: inline-block;
`;

const ScheduledTime = styled.div`
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.accent};
    margin-top: 2px;
`;

const EmptyState = styled.p`
    color: ${tokens.colors.textMuted};
    padding: ${tokens.spacing.xl} 0;
    text-align: center;
    font-size: ${tokens.typography.fontSize.sm};
`;

const StatusBadge = styled(Badge)`
    font-weight: ${tokens.typography.fontWeight.medium};
    padding: 4px 12px;
    border-radius: ${tokens.radius.full};
    font-size: ${tokens.typography.fontSize.xs};

    ${props => {
        switch(props.$status) {
            case 'pending':
                return `
                    background: ${tokens.colors.warningLight};
                    color: ${tokens.colors.warning};
                `;
            case 'confirmed':
                return `
                    background: ${tokens.colors.successLight};
                    color: ${tokens.colors.success};
                `;
            case 'preparing':
                return `
                    background: ${tokens.colors.accentLight};
                    color: ${tokens.colors.accent};
                `;
            case 'delivered':
                return `
                    background: ${tokens.colors.successLight};
                    color: ${tokens.colors.success};
                `;
            case 'cancelled':
                return `
                    background: ${tokens.colors.errorLight};
                    color: ${tokens.colors.error};
                `;
            case 'scheduled':
                return `
                    background: ${tokens.colors.accentLight};
                    color: ${tokens.colors.accent};
                `;
            default:
                return `
                    background: ${tokens.colors.background};
                    color: ${tokens.colors.textSecondary};
                `;
        }
    }}
`;

const TotalValue = styled.strong`
    color: ${tokens.colors.text};
    font-weight: ${tokens.typography.fontWeight.semibold};
`;

const NewOrdersBadge = styled.span`
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.error};
    margin-left: ${tokens.spacing.sm};
    font-weight: ${tokens.typography.fontWeight.normal};
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

    // Formatar valor
    const formatMoney = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
    };

    return (
        <OrdersContainer>
            <OrdersHeader>
                <HeaderTitle>
                    📋 Pedidos Recebidos
                    {unreadOrders > 0 && (
                        <NewOrdersBadge>({unreadOrders} novos)</NewOrdersBadge>
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
                <EmptyState>
                    {allOrders.length === 0
                        ? 'Nenhum pedido recebido.'
                        : 'Nenhum pedido encontrado com o filtro selecionado.'}
                </EmptyState>
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
                                                <OrderNumber
                                                    onClick={() => onOpenTracking(o.id, o.access_token)}
                                                    title="Clique para ver detalhes do pedido"
                                                >
                                                    #{o.order_number || o.id}
                                                </OrderNumber>
                                                {o.is_scheduled && (
                                                    <ScheduledBadge>📅</ScheduledBadge>
                                                )}
                                                {o.is_scheduled && o.scheduled_time && (
                                                    <ScheduledTime>
                                                        {new Date(o.scheduled_time).toLocaleString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </ScheduledTime>
                                                )}
                                            </td>
                                            <td>{o.customer_name || 'Cliente'}</td>
                                            <td>
                                                {items.map((i, idx) => (
                                                    <div key={idx}>{i.qty}x {i.name}</div>
                                                ))}
                                            </td>
                                            <td><TotalValue>R$ {formatMoney(o.total)}</TotalValue></td>
                                            <td>
                                                <StatusBadge $status={getStatusForBadge(statusClass)}>
                                                    {getStatusLabel(statusClass)}
                                                </StatusBadge>
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
                                                        <StatusBadge $status="delivered">
                                                            ✅ Finalizado
                                                        </StatusBadge>
                                                    )}
                                                    {statusClass === 'cancelado' && (
                                                        <StatusBadge $status="cancelled">
                                                            ❌ Cancelado
                                                        </StatusBadge>
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
                                            <OrderNumber
                                                onClick={() => onOpenTracking(o.id, o.access_token)}
                                                title="Clique para ver detalhes do pedido"
                                            >
                                                #{o.order_number || o.id}
                                            </OrderNumber>
                                            {o.is_scheduled && (
                                                <ScheduledBadge>📅</ScheduledBadge>
                                            )}
                                        </span>
                                    </MobileOrderRow>
                                    {o.is_scheduled && o.scheduled_time && (
                                        <MobileOrderRow>
                                            <span className="label">Agendado</span>
                                            <span className="value" style={{ fontSize: '12px', color: tokens.colors.accent }}>
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
                                        <span className="value"><TotalValue>R$ {formatMoney(o.total)}</TotalValue></span>
                                    </MobileOrderRow>
                                    <MobileOrderRow>
                                        <span className="label">Status</span>
                                        <span className="value">
                                            <StatusBadge $status={getStatusForBadge(statusClass)}>
                                                {getStatusLabel(statusClass)}
                                            </StatusBadge>
                                        </span>
                                    </MobileOrderRow>
                                    <MobileOrderRow style={{ flexDirection: 'column', alignItems: 'stretch', borderBottom: 'none' }}>
                                        <span className="label" style={{ marginBottom: '8px' }}>Itens</span>
                                        <MobileItemsList>
                                            {items.map((item, idx) => (
                                                <div className="item" key={idx}>
                                                    <span className="item-name">{item.name}</span>
                                                    <span className="item-qty">{item.qty}x</span>
                                                    <span className="item-price">R$ {formatMoney(item.price * item.qty)}</span>
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
                                            <StatusBadge $status="delivered" style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
                                                ✅ Finalizado
                                            </StatusBadge>
                                        )}
                                        {statusClass === 'cancelado' && (
                                            <StatusBadge $status="cancelled" style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
                                                ❌ Cancelado
                                            </StatusBadge>
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