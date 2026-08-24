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

const DiscountBadge = styled.span`
    background: ${tokens.colors.successLight};
    color: ${tokens.colors.success};
    padding: 2px 8px;
    border-radius: ${tokens.radius.full};
    font-size: ${tokens.typography.fontSize.xs};
    margin-left: ${tokens.spacing.xs};
    display: inline-block;
    font-weight: ${tokens.typography.fontWeight.medium};
`;

const DispatchedBadge = styled.span`
    background: ${tokens.colors.accentLight};
    color: ${tokens.colors.accent};
    padding: 2px 8px;
    border-radius: ${tokens.radius.full};
    font-size: ${tokens.typography.fontSize.xs};
    margin-left: ${tokens.spacing.xs};
    display: inline-block;
    font-weight: ${tokens.typography.fontWeight.medium};
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
        switch (props.$status) {
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
            case 'dispatched':
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

const DiscountRow = styled.div`
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.success};
    margin-top: 2px;
    font-weight: ${tokens.typography.fontWeight.medium};
`;

// ============================================================
//  FUNÇÃO PARA FORMATAR DATA
// ============================================================
const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
};

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
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
    //  MAPEAMENTO DE STATUS - COMPLETO COM DESPACHADO
    // ============================================================
    const statusMap = {
        'pending': 'pending',
        'confirmado': 'confirmed',
        'preparando': 'preparing',
        'despachado': 'dispatched',
        'entregue': 'delivered',
        'cancelado': 'cancelled',
        'scheduled': 'scheduled'
    };

    const statusLabels = {
        'pending': '🟡 Pendente',
        'confirmado': '🟢 Confirmado',
        'preparando': '🟠 Em preparo',
        'despachado': '🏍️ Despachado',
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
        { value: 'despachado', label: '🏍️ Despachados' },
        { value: 'entregue', label: '✅ Entregues' },
        { value: 'cancelado', label: '❌ Cancelados' }
    ];

    const getStatusForBadge = (status) => {
        return statusMap[status] || 'pending';
    };

    const getStatusLabel = (status) => {
        return statusLabels[status] || status;
    };

    // ============================================================
    //  FORMATAR VALOR
    // ============================================================
    const formatMoney = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
    };

    // ============================================================
    //  VERIFICAR SE TEM DESCONTO
    // ============================================================
    const hasDiscount = (order) => {
        return order.discount > 0 || (order.discount_percentage > 0);
    };

    // ============================================================
    //  OBTER TEXTO DO DESCONTO
    // ============================================================
    const getDiscountText = (order) => {
        if (order.discount_reason) {
            return order.discount_reason;
        }
        if (order.discount_percentage > 0) {
            return `💰 ${order.discount_percentage}% de desconto`;
        }
        return '💰 Desconto';
    };

    // ============================================================
    //  VERIFICAR SE É AGENDADO
    // ============================================================
    const isOrderScheduled = (order) => {
        return Number(order.is_scheduled) === 1;
    };

    const hasOrderScheduledTime = (order) => {
        return order.scheduled_time &&
            order.scheduled_time !== '0' &&
            order.scheduled_time !== 'null' &&
            order.scheduled_time !== '' &&
            order.scheduled_time !== 0;
    };

    // ============================================================
    //  RENDERIZAR AÇÕES POR STATUS - COMPLETO COM DESPACHADO
    // ============================================================
    const renderActions = (statusClass, order) => {
        switch (statusClass) {
            case 'scheduled':
                return (
                    <>
                        <ActionButton
                            $variant="confirm"
                            onClick={() => onUpdateStatus(order.id, 'confirmado')}
                        >
                            ✅ Confirmar
                        </ActionButton>
                        <ActionButton
                            $variant="cancel"
                            onClick={() => onUpdateStatus(order.id, 'cancelado')}
                        >
                            ❌ Cancelar
                        </ActionButton>
                    </>
                );
            case 'pending':
                return (
                    <>
                        <ActionButton
                            $variant="confirm"
                            onClick={() => onUpdateStatus(order.id, 'confirmado')}
                        >
                            ✅ Confirmar
                        </ActionButton>
                        <ActionButton
                            $variant="cancel"
                            onClick={() => onUpdateStatus(order.id, 'cancelado')}
                        >
                            ❌ Cancelar
                        </ActionButton>
                    </>
                );
            case 'confirmado':
                return (
                    <>
                        <ActionButton
                            $variant="preparar"
                            onClick={() => onUpdateStatus(order.id, 'preparando')}
                        >
                            👨‍🍳 Em preparo
                        </ActionButton>
                        <ActionButton
                            $variant="cancel"
                            onClick={() => onUpdateStatus(order.id, 'cancelado')}
                        >
                            ❌ Cancelar
                        </ActionButton>
                    </>
                );
            case 'preparando':
                return (
                    <>
                        <ActionButton
                            $variant="despachar"
                            onClick={() => onUpdateStatus(order.id, 'despachado')}
                        >
                            🏍️ Despachar
                        </ActionButton>
                        <ActionButton
                            $variant="cancel"
                            onClick={() => onUpdateStatus(order.id, 'cancelado')}
                        >
                            ❌ Cancelar
                        </ActionButton>
                    </>
                );
            case 'despachado':
                return (
                    <ActionButton
                        $variant="deliver"
                        onClick={() => onUpdateStatus(order.id, 'entregue')}
                    >
                        📦 Entregue
                    </ActionButton>
                );
            case 'entregue':
                return (
                    <StatusBadge $status="delivered" style={{ textAlign: 'center', padding: '8px 16px' }}>
                        ✅ Finalizado
                    </StatusBadge>
                );
            case 'cancelado':
                return (
                    <StatusBadge $status="cancelled" style={{ textAlign: 'center', padding: '8px 16px' }}>
                        ❌ Cancelado
                    </StatusBadge>
                );
            default:
                return null;
        }
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
                                    <th>Data/Hora</th>
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
                                    const hasDisc = hasDiscount(o);
                                    const discountText = getDiscountText(o);
                                    const isDispatched = statusClass === 'dispatched';

                                    // ✅ CORREÇÃO: Verificar se é agendado corretamente
                                    const isScheduled = isOrderScheduled(o);
                                    const hasScheduledTime = hasOrderScheduledTime(o);

                                    return (
                                        <tr key={o.id}>
                                            <td>
                                                <OrderNumber
                                                    onClick={() => onOpenTracking(o.id, o.access_token)}
                                                    title="Clique para ver detalhes do pedido"
                                                >
                                                    #{o.order_number || o.id}
                                                </OrderNumber>

                                                {/* ✅ Só exibir se for agendado */}
                                                {isScheduled && (
                                                    <ScheduledBadge>📅</ScheduledBadge>
                                                )}

                                                {hasDisc && (
                                                    <DiscountBadge>💰</DiscountBadge>
                                                )}

                                                {isDispatched && (
                                                    <DispatchedBadge>🏍️</DispatchedBadge>
                                                )}

                                                {/* ✅ Só exibir o horário agendado se realmente tiver */}
                                                {isScheduled && hasScheduledTime && (
                                                    <ScheduledTime>
                                                        {formatDate(o.scheduled_time)}
                                                    </ScheduledTime>
                                                )}
                                            </td>
                                            <td>
                                                {formatDate(o.created_at)}
                                            </td>
                                            <td>{o.customer_name || 'Cliente'}</td>
                                            <td>
                                                {items.map((i, idx) => {
                                                    const hasAddons = i.addons && i.addons.length > 0;
                                                    return (
                                                        <div key={idx}>
                                                            <div>{i.qty}x {i.name}</div>
                                                            {hasAddons && (
                                                                <div style={{ paddingLeft: '12px', fontSize: '11px', color: '#888', borderLeft: '2px solid #e74c3c' }}>
                                                                    {i.addons.map((addon, aidx) => (
                                                                        <div key={aidx}>+ {addon.quantity}x {addon.name}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </td>
                                            <td>
                                                <div>
                                                    <TotalValue>R$ {formatMoney(o.total)}</TotalValue>
                                                    {hasDisc && (
                                                        <DiscountRow>
                                                            💰 {discountText}: -R$ {formatMoney(o.discount)}
                                                        </DiscountRow>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <StatusBadge $status={getStatusForBadge(statusClass)}>
                                                    {getStatusLabel(statusClass)}
                                                </StatusBadge>
                                            </td>
                                            <td>
                                                <ActionContainer>
                                                    {renderActions(statusClass, o)}
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
                            const hasDisc = hasDiscount(o);
                            const discountText = getDiscountText(o);
                            const isDispatched = statusClass === 'dispatched';

                            // ✅ CORREÇÃO: Verificar se é agendado corretamente
                            const isScheduled = isOrderScheduled(o);
                            const hasScheduledTime = hasOrderScheduledTime(o);

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

                                            {/* ✅ Só exibir se for agendado */}
                                            {isScheduled && (
                                                <ScheduledBadge>📅</ScheduledBadge>
                                            )}

                                            {hasDisc && (
                                                <DiscountBadge>💰</DiscountBadge>
                                            )}

                                            {isDispatched && (
                                                <DispatchedBadge>🏍️</DispatchedBadge>
                                            )}
                                        </span>
                                    </MobileOrderRow>

                                    <MobileOrderRow>
                                        <span className="label">Data/Hora</span>
                                        <span className="value" style={{ fontSize: '13px' }}>
                                            {formatDate(o.created_at)}
                                        </span>
                                    </MobileOrderRow>

                                    {/* ✅ Só exibir agendamento se for agendado */}
                                    {isScheduled && hasScheduledTime && (
                                        <MobileOrderRow>
                                            <span className="label">Agendado</span>
                                            <span className="value" style={{ fontSize: '12px', color: tokens.colors.accent }}>
                                                {formatDate(o.scheduled_time)}
                                            </span>
                                        </MobileOrderRow>
                                    )}

                                    <MobileOrderRow>
                                        <span className="label">Cliente</span>
                                        <span className="value">{o.customer_name || 'Cliente'}</span>
                                    </MobileOrderRow>

                                    <MobileOrderRow>
                                        <span className="label">Total</span>
                                        <span className="value">
                                            <TotalValue>R$ {formatMoney(o.total)}</TotalValue>
                                            {hasDisc && (
                                                <div style={{ fontSize: '11px', color: tokens.colors.success, marginTop: '2px' }}>
                                                    💰 {discountText}: -R$ {formatMoney(o.discount)}
                                                </div>
                                            )}
                                        </span>
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
                                            {items.map((item, idx) => {
                                                const hasAddons = item.addons && item.addons.length > 0;
                                                return (
                                                    <div key={idx}>
                                                        <div className="item">
                                                            <span className="item-name">{item.name}</span>
                                                            <span className="item-qty">{item.qty}x</span>
                                                            <span className="item-price">R$ {formatMoney(item.price * item.qty)}</span>
                                                        </div>
                                                        {hasAddons && (
                                                            <div style={{ paddingLeft: '16px', fontSize: '11px', color: '#888', borderLeft: '2px solid #e74c3c', marginBottom: '4px' }}>
                                                                {item.addons.map((addon, aidx) => (
                                                                    <div key={aidx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span>+ {addon.quantity}x {addon.name}</span>
                                                                        <span>R$ {formatMoney(addon.price * addon.quantity)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
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
                                            <>
                                                <ActionButton
                                                    $variant="despachar"
                                                    onClick={() => onUpdateStatus(o.id, 'despachado')}
                                                    style={{ flex: 1 }}
                                                >
                                                    🏍️ Despachar
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
                                        {statusClass === 'despachado' && (
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