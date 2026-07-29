import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCart } from '../../contexts/CartContext';
import { useTenant } from '../../contexts/TenantContext';
import { api } from '../../services/api';
import { Container, Button, Card, Input, Flex } from '../Shared/Container';

const CheckoutContainer = styled(Container)`
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
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 20px;
    color: ${props => props.theme.colors.text};
`;

const SummaryCard = styled(Card)`
    background: ${props => props.theme.colors.background};
    margin-bottom: 20px;
`;

const SummaryItem = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 14px;
    color: ${props => props.theme.colors.textLight};

    .name {
        color: ${props => props.theme.colors.text};
    }
`;

const TotalRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 12px 0 0 0;
    margin-top: 8px;
    border-top: 2px solid ${props => props.theme.colors.border};
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
        font-weight: 600;
        font-size: 14px;
        color: ${props => props.theme.colors.textLight};
    }

    small {
        color: ${props => props.theme.colors.textMuted};
        font-size: 12px;
    }
`;

const SubmitButton = styled(Button)`
    padding: 14px;
    font-size: 18px;
    margin-top: 8px;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

// ============================================================
//  CHIPS DE PAGAMENTO (FORA DO FORMULÁRIO)
// ============================================================
const ChipGroup = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 8px;
    margin-bottom: 16px;
`;

const Chip = styled.button`
    padding: 10px 18px;
    border: 2px solid ${props => props.selected ? '#e67e22' : '#dfe6e9'};
    border-radius: 30px;
    background: ${props => props.selected ? '#fef9e7' : '#fff'};
    color: ${props => props.selected ? '#e67e22' : '#2d3436'};
    font-size: 14px;
    font-weight: ${props => props.selected ? '600' : '500'};
    cursor: pointer;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    touch-action: manipulation;
    
    .chip-icon {
        margin-right: 6px;
    }
    
    &:hover {
        border-color: #e67e22;
        background: ${props => props.selected ? '#fef9e7' : '#fef9e7'};
    }
    
    &:active {
        transform: scale(0.96);
    }
`;

const PaymentSection = styled.div`
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    margin-bottom: 16px;
`;

const PaymentTitle = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #555;
    margin-bottom: 8px;
`;

const Checkout = () => {
    const navigate = useNavigate();
    const { tenant } = useTenant();
    const { cart, subtotal, clearCart } = useCart();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (!tenant) return;
        
        const loadConfig = async () => {
            try {
                const res = await api.get('/config');
                setConfig(res.data.data);
            } catch (error) {
                console.error('Erro ao carregar config:', error);
            }
        };
        loadConfig();

        const savedName = localStorage.getItem('user_name');
        const savedPhone = localStorage.getItem('user_phone');
        const savedAddress = localStorage.getItem('user_address');
        
        if (savedName) setFormData(prev => ({ ...prev, name: savedName }));
        if (savedPhone) setFormData(prev => ({ ...prev, phone: savedPhone }));
        if (savedAddress) setFormData(prev => ({ ...prev, address: savedAddress }));
    }, [tenant]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        localStorage.setItem(`user_${name}`, value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.phone || !formData.address) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const phoneClean = formData.phone.replace(/\D/g, '');
        if (phoneClean.length < 10) {
            alert('Por favor, insira um telefone válido (DDD + número).');
            return;
        }

        setLoading(true);

        try {
            const deliveryFee = parseFloat(config?.delivery_fee) || 0;
            const total = subtotal + deliveryFee;

            const orderData = {
                customer_name: formData.name,
                customer_phone: formData.phone,
                customer_address: formData.address,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: parseFloat(item.price),
                    qty: item.qty
                })),
                subtotal: subtotal,
                delivery_fee: deliveryFee,
                total: total,
                payment_method: paymentMethod,
                delivery_type: 'delivery'
            };

            const response = await api.post('/orders', orderData);
            console.log('✅ Pedido criado:', response.data);

            // WhatsApp
            const phone = config?.store_phone || '5511999999999';
            const cleanPhone = phone.replace(/\D/g, '');
            const message = `🍽️ *NOVO PEDIDO*\nCliente: ${formData.name}\nTelefone: ${formData.phone}\nEndereço: ${formData.address}\n\n*Itens:*\n${cart.map(i => `- ${i.qty}x ${i.name} = R$ ${(i.price * i.qty).toFixed(2)}`).join('\n')}\n\nSubtotal: R$ ${subtotal.toFixed(2)}\nTaxa entrega: R$ ${deliveryFee.toFixed(2)}\n*Total: R$ ${total.toFixed(2)}*\nPagamento: ${paymentMethod}`;
            window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');

            clearCart();
            navigate('/');
            
        } catch (error) {
            console.error('❌ Erro ao criar pedido:', error);
            alert('Erro ao criar pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <CheckoutContainer>
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                    <h2 style={{ color: '#555' }}>Sacola vazia</h2>
                    <p style={{ color: '#888', marginBottom: 20 }}>
                        Adicione itens ao carrinho antes de finalizar o pedido.
                    </p>
                    <Button primary onClick={() => navigate('/')}>
                        Voltar para o cardápio
                    </Button>
                </div>
            </CheckoutContainer>
        );
    }

    const deliveryFee = parseFloat(config?.delivery_fee) || 0;
    const total = subtotal + deliveryFee;

    return (
        <CheckoutContainer>
            <BackButton onClick={() => navigate('/')}>
                ← Voltar
            </BackButton>

            <Title>📋 Finalizar Pedido</Title>

            <SummaryCard>
                <h3 style={{ fontSize: 16, color: '#555', marginBottom: 12 }}>Resumo do pedido</h3>
                {cart.map(item => (
                    <SummaryItem key={item.id}>
                        <span className="name">{item.qty}x {item.name}</span>
                        <span>R$ {(item.price * item.qty).toFixed(2)}</span>
                    </SummaryItem>
                ))}
                <SummaryItem>
                    <span className="name">Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                </SummaryItem>
                <SummaryItem>
                    <span className="name">Taxa de entrega</span>
                    <span>R$ {deliveryFee.toFixed(2)}</span>
                </SummaryItem>
                <TotalRow>
                    <span>Total</span>
                    <span>R$ {total.toFixed(2)}</span>
                </TotalRow>
            </SummaryCard>

            {/* ============================================================
                FORMULÁRIO COM DADOS DO CLIENTE
                ============================================================ */}
            <Form onSubmit={handleSubmit}>
                <FormGroup>
                    <label>Nome completo *</label>
                    <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Seu nome"
                        required
                    />
                </FormGroup>

                <FormGroup>
                    <label>Telefone *</label>
                    <Input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(85) 99999-9999"
                        required
                    />
                </FormGroup>

                <FormGroup>
                    <label>Endereço de entrega *</label>
                    <Input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Rua, número, bairro, cidade - UF"
                        required
                    />
                </FormGroup>

                {/* ============================================================
                    PAGAMENTO - FORA DO SUBMIT AUTOMÁTICO
                    ============================================================ */}
                <PaymentSection>
                    <PaymentTitle>💳 Pagamento na entrega</PaymentTitle>
                    <ChipGroup>
                        <Chip 
                            selected={paymentMethod === 'Dinheiro'}
                            onClick={() => setPaymentMethod('Dinheiro')}
                            type="button"
                        >
                            <span className="chip-icon">💰</span> Dinheiro
                        </Chip>
                        <Chip 
                            selected={paymentMethod === 'Pix'}
                            onClick={() => setPaymentMethod('Pix')}
                            type="button"
                        >
                            <span className="chip-icon">📲</span> Pix
                        </Chip>
                        <Chip 
                            selected={paymentMethod === 'Crédito'}
                            onClick={() => setPaymentMethod('Crédito')}
                            type="button"
                        >
                            <span className="chip-icon">💳</span> Crédito
                        </Chip>
                        <Chip 
                            selected={paymentMethod === 'Débito'}
                            onClick={() => setPaymentMethod('Débito')}
                            type="button"
                        >
                            <span className="chip-icon">💳</span> Débito
                        </Chip>
                    </ChipGroup>
                </PaymentSection>

                <SubmitButton primary disabled={loading}>
                    {loading ? 'Enviando...' : `✅ Confirmar Pedido - R$ ${total.toFixed(2)}`}
                </SubmitButton>
            </Form>
        </CheckoutContainer>
    );
};

export default Checkout;