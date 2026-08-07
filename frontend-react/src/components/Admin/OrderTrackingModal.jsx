import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { tokens } from '../../styles/tokens';
import { printOrderPDF } from '../../utils/printOrder';

// ============================================================
//  STYLED COMPONENTS
// ============================================================
const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: ${props => props.isOpen ? 'flex' : 'none'};
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: 20px;
    backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
    background: ${tokens.colors.surface};
    border-radius: ${tokens.radius.lg};
    padding: ${tokens.spacing.xl};
    max-width: 560px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease;
    position: relative;
    border: 1px solid ${tokens.colors.border};
    box-shadow: ${tokens.shadows.lg};

    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    &::-webkit-scrollbar {
        width: 6px;
    }
    &::-webkit-scrollbar-track {
        background: ${tokens.colors.background};
        border-radius: ${tokens.radius.sm};
    }
    &::-webkit-scrollbar-thumb {
        background: ${tokens.colors.border};
        border-radius: ${tokens.radius.sm};
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${tokens.spacing.md};
    padding-bottom: ${tokens.spacing.sm};
    border-bottom: 2px solid ${tokens.colors.accent};
`;

const ModalTitle = styled.h3`
    margin: 0;
    color: ${tokens.colors.text};
    font-size: ${tokens.typography.fontSize.lg};
    font-weight: ${tokens.typography.fontWeight.semibold};
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: ${tokens.typography.fontSize['2xl']};
    cursor: pointer;
    color: ${tokens.colors.textMuted};
    padding: ${tokens.spacing.xs};
    transition: all 0.2s ease-in-out;

    &:hover {
        color: ${tokens.colors.text};
        transform: rotate(90deg);
    }
`;

const LoadingContainer = styled.div`
    text-align: center;
    padding: ${tokens.spacing.xl} 0;
    color: ${tokens.colors.textMuted};
`;

const ErrorContainer = styled.div`
    text-align: center;
    padding: ${tokens.spacing.xl} 0;
    color: ${tokens.colors.error};
`;

const OrderCard = styled.div`
    padding: ${tokens.spacing.md};
    background: ${tokens.colors.background};
    border-radius: ${tokens.radius.md};
    margin-bottom: ${tokens.spacing.sm};
`;

const OrderNumber = styled.div`
    font-size: ${tokens.typography.fontSize.lg};
    font-weight: ${tokens.typography.fontWeight.bold};
    color: ${tokens.colors.accent};
    margin-bottom: ${tokens.spacing.xs};
`;

const StatusBadge = styled.div`
    display: inline-block;
    padding: ${tokens.spacing.xs} ${tokens.spacing.md};
    border-radius: ${tokens.radius.full};
    font-weight: ${tokens.typography.fontWeight.semibold};
    font-size: ${tokens.typography.fontSize.sm};

    ${props => {
        switch (props.status) {
            case 'pending':
                return `
                    background: ${tokens.colors.warningLight};
                    color: ${tokens.colors.warning};
                `;
            case 'confirmado':
                return `
                    background: ${tokens.colors.successLight};
                    color: ${tokens.colors.success};
                `;
            case 'preparando':
                return `
                    background: ${tokens.colors.accentLight};
                    color: ${tokens.colors.accent};
                `;
            case 'entregue':
                return `
                    background: ${tokens.colors.successLight};
                    color: ${tokens.colors.success};
                `;
            case 'cancelado':
                return `
                    background: ${tokens.colors.errorLight};
                    color: ${tokens.colors.error};
                `;
            default:
                return `
                    background: ${tokens.colors.background};
                    color: ${tokens.colors.textSecondary};
                `;
        }
    }}
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: ${tokens.spacing.xs} 0;
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.textSecondary};
    border-bottom: 1px solid ${tokens.colors.border};

    &:last-child {
        border-bottom: none;
    }
`;

const DetailLabel = styled.span`
    color: ${tokens.colors.textMuted};
`;

const DetailTotal = styled.div`
    display: flex;
    justify-content: space-between;
    padding: ${tokens.spacing.sm} 0 0 0;
    font-weight: ${tokens.typography.fontWeight.bold};
    border-top: 2px solid ${tokens.colors.border};
    margin-top: ${tokens.spacing.xs};
    font-size: ${tokens.typography.fontSize.base};
    color: ${tokens.colors.text};
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: ${tokens.spacing.sm};
    margin-top: ${tokens.spacing.md};
    flex-wrap: wrap;
`;

const PrintButton = styled.button`
    padding: ${tokens.spacing.sm} ${tokens.spacing.lg};
    background: ${tokens.colors.accent};
    color: ${tokens.colors.surface};
    border: none;
    border-radius: ${tokens.radius.md};
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.medium};
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    font-family: ${tokens.typography.fontFamily};
    display: flex;
    align-items: center;
    gap: ${tokens.spacing.xs};

    &:hover {
        background: ${tokens.colors.accentHover};
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }

    &:focus-visible {
        outline: 2px solid ${tokens.colors.accent};
        outline-offset: 2px;
    }
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const OrderTrackingModal = ({ isOpen, onClose, orderId, token, storeName }) => {
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
                console.log('📊 delivery_status:', response.data.data.delivery_status);
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
                        `Status atualizado: ${getStatusEmoji(data.order.status)} ${getStatusLabel(data.order.status)}`,
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

    // ============================================================
    //  FUNÇÕES AUXILIARES
    // ============================================================
    const getStatusLabel = (status) => {
        const labels = {
            'pending': 'Pendente',
            'confirmado': 'Confirmado',
            'preparando': 'Em preparo',
            'entregue': 'Entregue',
            'cancelado': 'Cancelado',
            'scheduled': 'Agendado'  
        };
        return labels[status] || status;
    };

    const getStatusEmoji = (status) => {
        const emojis = {
            'pending': '📋',
            'confirmado': '✅',
            'preparando': '👨‍🍳',
            'entregue': '📦',
            'cancelado': '❌',
            'scheduled': '📅'
        };
        return emojis[status] || '📋';
    };

    const formatLocalDate = (dateString, isScheduled = false) => {
        if (!dateString) return '-';
        try {
            if (isScheduled) {
                const clean = dateString.replace(' ', 'T');
                const parts = clean.split('T');
                if (parts.length !== 2) return dateString;
                const datePart = parts[0];
                const timePart = parts[1];
                const dateComponents = datePart.split('-');
                const timeComponents = timePart.split(':');
                return `${dateComponents[2]}/${dateComponents[1]}/${dateComponents[0]}, ${timeComponents[0]}:${timeComponents[1]}`;
            } else {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return '-';
                const localDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
                return localDate.toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch {
            return '-';
        }
    };

    const formatMoney = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? 'R$ 0,00' : `R$ ${num.toFixed(2).replace('.', ',')}`;
    };

    const handlePrint = () => {
        if (order) {
            printOrderPDF(order, storeName || 'Smart Delivery');
        }
    };

    const getDeliveryFeeDisplay = () => {
        const fee = parseFloat(order?.delivery_fee) || 0;
        const status = order?.delivery_status || 'calculated';
        const deliveryType = order?.delivery_type || 'fixa';

        console.log('🔍 Debug taxa de entrega (modal):', {
            fee,
            status,
            deliveryType,
            order_delivery_type: order?.delivery_type,
            order_complete: order
        });

        // ✅ Caso 1: Taxa pendente (bairro não cadastrado)
        if (status === 'pending') {
            return {
                text: 'Informada após o pedido',
                style: { color: tokens.colors.warning, fontWeight: tokens.typography.fontWeight.medium }
            };
        }

        // ✅ Caso 2: Taxa manual (verifica se delivery_type é 'manual')
        if (deliveryType === 'manual' || order?.delivery_type === 'manual') {
            return {
                text: 'Informada após o pedido',
                style: { color: tokens.colors.warning, fontWeight: tokens.typography.fontWeight.medium }
            };
        }

        // ✅ Caso 3: Taxa calculada - exibir o valor SEMPRE (mesmo que seja 0)
        return {
            text: formatMoney(fee),
            style: { color: tokens.colors.accent, fontWeight: tokens.typography.fontWeight.semibold }
        };
    };

    if (!isOpen) return null;

    const items = order?.items ? (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) : [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = parseFloat(order?.total) || 0;
    const isScheduled = Number(order?.is_scheduled) === 1;
    const hasScheduledTime = order?.scheduled_time &&
        order.scheduled_time !== '0' &&
        order.scheduled_time !== 'null' &&
        order.scheduled_time !== '';

    const deliveryDisplay = getDeliveryFeeDisplay();

    return (
        <ModalOverlay isOpen={isOpen} onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>📦 Acompanhar Pedido</ModalTitle>
                    <CloseButton onClick={onClose}>✕</CloseButton>
                </ModalHeader>

                {loading && (
                    <LoadingContainer>⏳ Carregando pedido...</LoadingContainer>
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
                                {getStatusEmoji(order.status)} {getStatusLabel(order.status)}
                            </StatusBadge>
                            {isScheduled && hasScheduledTime && (
                                <span style={{
                                    marginLeft: tokens.spacing.sm,
                                    fontSize: tokens.typography.fontSize.sm,
                                    color: tokens.colors.accent,
                                    fontWeight: tokens.typography.fontWeight.medium
                                }}>
                                    📅 {formatLocalDate(order.scheduled_time, true)}
                                </span>
                            )}
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
                                <DetailLabel>Data</DetailLabel>
                                <span>{formatLocalDate(order.created_at)}</span>
                            </DetailRow>
                        </div>

                        <div style={{ marginTop: tokens.spacing.md, paddingTop: tokens.spacing.sm, borderTop: `1px solid ${tokens.colors.border}` }}>
                            <strong style={{ color: tokens.colors.text, display: 'block', marginBottom: tokens.spacing.xs, fontSize: tokens.typography.fontSize.sm }}>
                                🛒 Itens:
                            </strong>
                            {items.map((item, index) => (
                                <DetailRow key={index} style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                                    <span>{item.qty}x {item.name}</span>
                                    <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
                                        {formatMoney(item.price * item.qty)}
                                    </span>
                                </DetailRow>
                            ))}

                            <DetailRow style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                                <span>Subtotal</span>
                                <span>{formatMoney(subtotal)}</span>
                            </DetailRow>

                            {/* ✅ CORREÇÃO: Exibir taxa de entrega SEMPRE como valor ou "Informada após o pedido" */}
                            <DetailRow style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                                <span>🚚 Taxa de entrega</span>
                                <span style={deliveryDisplay.style}>
                                    {deliveryDisplay.text}
                                </span>
                            </DetailRow>

                            <DetailTotal>
                                <span>Total</span>
                                <span>{formatMoney(total)}</span>
                            </DetailTotal>
                        </div>

                        <ButtonGroup>
                            <PrintButton onClick={handlePrint}>
                                🖨️ Imprimir / PDF
                            </PrintButton>
                        </ButtonGroup>
                    </>
                )}
            </ModalContent>
        </ModalOverlay>
    );
};

export default OrderTrackingModal;