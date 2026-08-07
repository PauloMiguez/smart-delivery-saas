import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { Container, Button, Card } from '../Shared/Container';

// ============================================================
//  STYLED COMPONENTS
// ============================================================

const HistoryContainer = styled(Container)`
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
    margin-bottom: 16px;
    padding: 16px;
    transition: all 0.2s ease;

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
`;

const CustomerInfo = styled.div`
    background: #f8f9fa;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 14px;
    color: #555;
`;

// ============================================================
//  FUNÇÕES DE FORMATAÇÃO DE DATA - CORRIGIDAS
// ============================================================

/**
 * Formata a data de criação do pedido (created_at)
 * Converte de UTC para UTC-3 (Brasil) subtraindo 3 horas
 */
const formatCreatedAt = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        // ✅ CORREÇÃO: Subtrair 3 horas para converter UTC → UTC-3 (Brasil)
        const localDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
        
        return localDate.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return '-';
    }
};

/**
 * Formata a data agendada (scheduled_time)
 * Mantém o horário exato, sem conversão
 */
const formatScheduledTime = (dateString) => {
    if (!dateString) return '-';
    try {
        // Tenta extrair do formato ISO (YYYY-MM-DDTHH:MM:SS)
        const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (isoMatch) {
            const [, year, month, day, hour, minute] = isoMatch;
            return `${day}/${month}/${year}, ${hour}:${minute}`;
        }
        
        // Tenta extrair do formato MySQL (YYYY-MM-DD HH:MM:SS)
        const mysqlMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (mysqlMatch) {
            const [, year, month, day, hour, minute] = mysqlMatch;
            return `${day}/${month}/${year}, ${hour}:${minute}`;
        }
        
        return '-';
    } catch {
        return '-';
    }
};

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================

const OrdersHistory = () => {
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const statusLabels = {
        'pending': '🟡 Pendente',
        'confirmado': '🟢 Confirmado',
        'preparando': '🟠 Em preparo',
        'entregue': '✅ Entregue',
        'cancelado': '❌ Cancelado',
        'scheduled': '📅 Agendado'
    };

    useEffect(() => {
        if (!tenant) {
            showToast('Tenant não encontrado', 'error');
            navigate('/');
            return;
        }

        // Pegar dados da URL (passados pela verificação)
        const params = new URLSearchParams(location.search);
        const nameFromUrl = params.get('name');
        const phoneFromUrl = params.get('phone');

        // Se não tiver dados na URL, tentar do localStorage
        const savedName = localStorage.getItem('user_name');
        const savedPhone = localStorage.getItem('user_phone');

        const finalName = nameFromUrl || savedName;
        const finalPhone = phoneFromUrl || savedPhone;

        // Se não tiver dados do cliente, redirecionar para verificação
        if (!finalName || !finalPhone) {
            showToast('Por favor, verifique seus dados primeiro.', 'warning');
            navigate(`/verify-orders?tenant=${tenant}`);
            return;
        }

        setCustomerName(finalName);
        setCustomerPhone(finalPhone);

        const loadOrders = async () => {
            try {
                setLoading(true);
                console.log('📋 Buscando pedidos para:', finalName, finalPhone);
                
                // Buscar todos os pedidos do tenant
                const response = await api.get('/orders');
                
                if (response.data.success) {
                    // Filtrar pedidos do cliente
                    const allOrders = response.data.data || [];
                    const cleanPhone = finalPhone.replace(/\D/g, '');
                    
                    const customerOrders = allOrders.filter(order => {
                        const orderPhone = order.customer_phone?.replace(/\D/g, '') || '';
                        const orderName = order.customer_name?.toLowerCase() || '';
                        const searchName = finalName.toLowerCase();
                        
                        // Verificar se o nome e telefone correspondem
                        const nameMatch = orderName === searchName || orderName.includes(searchName);
                        const phoneMatch = orderPhone === cleanPhone;
                        
                        return nameMatch && phoneMatch;
                    });
                    
                    console.log(`✅ Encontrados ${customerOrders.length} pedidos para ${finalName}`);
                    setOrders(customerOrders);
                }
            } catch (error) {
                console.error('❌ Erro ao carregar pedidos:', error);
                showToast('Erro ao carregar pedidos', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, [tenant, location.search]);

    const handleBack = () => {
        navigate(`/?tenant=${tenant}`);
    };

    const handleVerifyAgain = () => {
        navigate(`/verify-orders?tenant=${tenant}`);
    };

    if (loading) {
        return (
            <HistoryContainer>
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                    <p>Carregando seus pedidos...</p>
                </div>
            </HistoryContainer>
        );
    }

    return (
        <HistoryContainer>
            <BackButton onClick={handleBack}>
                ← Voltar
            </BackButton>

            <Title>📋 Meus Pedidos</Title>

            <CustomerInfo>
                <span>👤 <strong>{customerName}</strong></span>
                <span>📱 {customerPhone}</span>
                <button 
                    onClick={handleVerifyAgain}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#e67e22',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}
                >
                    🔄 Trocar usuário
                </button>
            </CustomerInfo>

            {orders.length === 0 ? (
                <EmptyState>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                    <h3 style={{ color: '#2d3436' }}>Nenhum pedido encontrado</h3>
                    <p>Você ainda não realizou pedidos com este nome e telefone.</p>
                    <Button primary onClick={() => navigate(`/?tenant=${tenant}`)} style={{ marginTop: 16 }}>
                        Ver cardápio
                    </Button>
                </EmptyState>
            ) : (
                orders.map(order => {
                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    const hasToken = !!order.access_token;
                    
                    return (
                        <OrderCard key={order.id}>
                            <OrderHeader>
                                <OrderNumber>#{order.order_number || order.id}</OrderNumber>
                                {/* ✅ CORREÇÃO: Data de criação com UTC-3 */}
                                <OrderDate>
                                    {formatCreatedAt(order.created_at)}
                                </OrderDate>
                            </OrderHeader>
                            
                            <OrderStatus status={order.status}>
                                {statusLabels[order.status] || order.status}
                            </OrderStatus>
                            
                            {/* Se for agendado, mostrar a data agendada como informação adicional */}
                            {order.is_scheduled && order.scheduled_time && (
                                <div style={{ 
                                    fontSize: '12px', 
                                    color: '#e67e22',
                                    marginTop: '4px',
                                    fontWeight: '600'
                                }}>
                                    📅 Agendado para: {formatScheduledTime(order.scheduled_time)}
                                </div>
                            )}
                            
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
                            
                            {hasToken ? (
                                <TrackLink to={`/track/${order.id}?token=${order.access_token}&from=orders`}>
                                    🔍 Acompanhar pedido
                                </TrackLink>
                            ) : (
                                <span style={{ fontSize: '13px', color: '#888' }}>
                                    ⚠️ Link de acompanhamento indisponível
                                </span>
                            )}
                        </OrderCard>
                    );
                })
            )}
        </HistoryContainer>
    );
};

export default OrdersHistory;