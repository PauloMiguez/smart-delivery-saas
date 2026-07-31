import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
    min-height: 60vh;
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

const ErrorContainer = styled.div`
    text-align: center;
    padding: 40px 20px;
    color: #e74c3c;
`;

// ============================================================
//  BOTÕES DE NAVEGAÇÃO - APENAS PARA ACESSO VIA MEUS PEDIDOS
// ============================================================
const NavigationButtons = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
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

const statusOrder = ['pending', 'confirmado', 'preparando', 'entregue'];

const TrackOrder = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { tenant: urlTenant } = useTenant();
    const { showToast } = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);
    const [orderTenant, setOrderTenant] = useState(null);
    const [isFromOrders, setIsFromOrders] = useState(false);

    const token = searchParams.get('token');

    // ============================================================
    //  DETECTAR ORIGEM DO ACESSO
    // ============================================================
    useEffect(() => {
        // Verificar se veio de /orders (Meus Pedidos)
        const referrer = document.referrer || '';
        const isFromOrdersPage = referrer.includes('/orders') && referrer.includes('tenant=');
        
        // Verificar se há parâmetros de nome e telefone na URL
        const hasNameParam = searchParams.has('name');
        const hasPhoneParam = searchParams.has('phone');
        
        // Se veio de /orders ou tem dados do cliente, é do Meus Pedidos
        const fromOrders = isFromOrdersPage || (hasNameParam && hasPhoneParam);
        
        setIsFromOrders(fromOrders);
        console.log('📱 Origem do acesso:', fromOrders ? 'Meus Pedidos' : 'Link Direto');
    }, []);

    const loadOrder = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('📦 Buscando pedido:', orderId);
            console.log('🔑 Token presente:', !!token);
            
            if (!token) {
                setError('Link inválido. Token de acesso não encontrado.');
                showToast('Link inválido. Token de acesso não encontrado.', 'error');
                setLoading(false);
                return;
            }

            if (token.length < 10) {
                setError('Token inválido. Verifique o link.');
                showToast('Token inválido. Verifique o link.', 'error');
                setLoading(false);
                return;
            }

            const response = await api.get(`/orders/${orderId}?token=${token}`);
            
            console.log('📦 Resposta completa:', response.data);
            
            if (response.data.success) {
                setOrder(response.data.data);
                
                // Extrair tenant do pedido
                let tenantFromOrder = null;
                if (response.data.tenant) {
                    tenantFromOrder = response.data.tenant;
                } else if (response.data.data && response.data.data.tenant_id) {
                    tenantFromOrder = response.data.data.tenant_id;
                } else if (response.data.data && response.data.data.tenantId) {
                    tenantFromOrder = response.data.data.tenantId;
                }
                
                if (tenantFromOrder) {
                    setOrderTenant(tenantFromOrder);
                    console.log('🏷️ Tenant do pedido:', tenantFromOrder);
                } else {
                    console.warn('⚠️ Nenhum tenant encontrado no pedido');
                }
                
                console.log('✅ Pedido carregado:', response.data.data.order_number);
            } else {
                setError('Pedido não encontrado');
                showToast('Pedido não encontrado', 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar pedido:', error);
            
            let errorMessage = 'Erro ao carregar pedido. Verifique o link.';
            
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = 'Token inválido ou expirado.';
                } else if (error.response.status === 404) {
                    errorMessage = 'Pedido não encontrado. Verifique se o link está correto.';
                } else if (error.response.status === 500) {
                    errorMessage = 'Erro interno no servidor. Tente novamente.';
                }
                console.log('📦 Erro do servidor:', error.response.data);
            } else if (error.request) {
                errorMessage = 'Não foi possível conectar ao servidor. Verifique sua internet.';
            }
            
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            loadOrder();
        } else {
            setError('ID do pedido não encontrado na URL.');
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (!orderTenant || !orderId || !token || !order) return;

        const tokenAuth = localStorage.getItem('token');
        const socketInstance = connectSocket(tokenAuth);
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
    }, [orderTenant, orderId, token, order]);

    const getStatusIndex = (status) => statusOrder.indexOf(status);

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

    // ============================================================
    //  FUNÇÕES DE NAVEGAÇÃO (APENAS PARA MEUS PEDIDOS)
    // ============================================================
    const getTenantToUse = () => {
        const tenant = orderTenant || urlTenant;
        console.log('🔍 Tenant a ser usado:', tenant);
        return tenant;
    };

    const goBack = () => {
        const tenant = getTenantToUse();
        console.log('🔙 Voltar com tenant:', tenant);
        
        if (tenant) {
            const isFromOrdersPage = document.referrer && document.referrer.includes('/orders');
            if (isFromOrdersPage) {
                navigate(`/orders?tenant=${tenant}`);
            } else {
                navigate(`/?tenant=${tenant}`);
            }
        } else {
            navigate('/');
        }
    };

    const goToMenu = () => {
        const tenant = getTenantToUse();
        console.log('🍽️ Voltar ao cardápio com tenant:', tenant);
        
        if (tenant) {
            navigate(`/?tenant=${tenant}`);
        } else {
            navigate('/');
        }
    };

    // ============================================================
    //  RENDERIZAÇÃO
    // ============================================================
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

    if (error || !order) {
        return (
            <TrackContainer>
                <ErrorContainer>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
                    <h2 style={{ color: '#e74c3c' }}>Erro ao carregar pedido</h2>
                    <p style={{ color: '#888', marginBottom: 8 }}>{error || 'Pedido não encontrado'}</p>
                    <div style={{ 
                        background: '#f8f9fa', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        marginTop: '16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        color: '#555'
                    }}>
                        <p><strong>🔍 Diagnóstico:</strong></p>
                        <p>• Order ID: {orderId || 'N/A'}</p>
                        <p>• Token presente: {token ? '✅ Sim' : '❌ Não'}</p>
                        <p>• Tamanho do token: {token?.length || 0} caracteres</p>
                        {token && <p>• Token (início): {token.substring(0, 15)}...</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
                        <Button 
                            primary 
                            onClick={() => window.location.reload()} 
                            style={{ minWidth: '120px' }}
                        >
                            🔄 Tentar novamente
                        </Button>
                        <Button 
                            secondary 
                            onClick={goBack}
                            style={{ minWidth: '120px' }}
                        >
                            Voltar
                        </Button>
                    </div>
                </ErrorContainer>
            </TrackContainer>
        );
    }

    const isCancelled = order.status === 'cancelado';
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    return (
        <TrackContainer>
            {/* ============================================================
                BOTÃO VOLTAR - APENAS PARA MEUS PEDIDOS
                ============================================================ */}
            {isFromOrders && (
                <BackButton onClick={goBack}>
                    ← Voltar
                </BackButton>
            )}

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

            {/* ============================================================
                BOTÃO VOLTAR AO CARDÁPIO - APENAS PARA MEUS PEDIDOS
                ============================================================ */}
            {isFromOrders && (
                <Button primary onClick={goToMenu} style={{ width: '100%' }}>
                    Voltar ao cardápio
                </Button>
            )}
        </TrackContainer>
    );
};

export default TrackOrder;