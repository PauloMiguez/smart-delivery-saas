import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCart } from '../../contexts/CartContext';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { Container, Button, Card, Input } from '../Shared/Container';
import AddressModal from './AddressModal';

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

const ErrorText = styled.span`
    color: #e74c3c;
    font-size: 12px;
    margin-top: 4px;
`;

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

// ============================================================
//  FUNÇÕES DE VALIDAÇÃO
// ============================================================
const validateName = (name) => {
    if (!name || name.trim().length < 2) {
        return 'Digite seu nome completo (mínimo 2 caracteres)';
    }
    if (name.trim().length > 100) {
        return 'Nome muito longo (máximo 100 caracteres)';
    }
    return null;
};

const validatePhone = (phone) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10 || clean.length > 11) {
        return 'Digite um telefone válido com DDD (ex: 85 99999-9999)';
    }
    if (![10, 11].includes(clean.length)) {
        return 'Telefone deve ter 10 ou 11 dígitos (com DDD)';
    }
    return null;
};

const validateAddress = (address) => {
    if (!address || address.trim().length < 5) {
        return 'Digite um endereço completo (mínimo 5 caracteres)';
    }
    const parts = address.split(',');
    if (parts.length < 2) {
        return 'Inclua rua e número separados por vírgula (ex: Rua Exemplo, 123)';
    }
    return null;
};

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const Checkout = () => {
    const navigate = useNavigate();
    const { tenant } = useTenant();
    const { cart, subtotal, clearCart } = useCart();
    const { showToast } = useToast();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [errors, setErrors] = useState({});
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
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleAddressSave = (address) => {
        setFormData(prev => ({ ...prev, address }));
        localStorage.setItem('user_address', address);
        if (errors.address) {
            setErrors(prev => ({ ...prev, address: null }));
        }
    };

    // ============================================================
    //  VALIDAÇÃO COMPLETA ANTES DE ENVIAR
    // ============================================================
    const validateForm = () => {
        const newErrors = {};
        
        const nameError = validateName(formData.name);
        if (nameError) newErrors.name = nameError;
        
        const phoneError = validatePhone(formData.phone);
        if (phoneError) newErrors.phone = phoneError;
        
        const addressError = validateAddress(formData.address);
        if (addressError) newErrors.address = addressError;
        
        if (cart.length === 0) {
            showToast('Adicione itens ao carrinho antes de finalizar.', 'warning');
            return false;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            const firstError = Object.values(errors)[0];
            if (firstError) {
                showToast(firstError, 'error');
            }
            return;
        }

        setLoading(true);

        try {
            const deliveryFee = parseFloat(config?.delivery_fee) || 0;
            const total = subtotal + deliveryFee;

            const invalidItems = cart.filter(item => !item.name || !item.price || !item.qty);
            if (invalidItems.length > 0) {
                showToast('Alguns itens do carrinho estão inválidos.', 'error');
                setLoading(false);
                return;
            }

            const orderData = {
                customer_name: formData.name.trim(),
                customer_phone: formData.phone.trim(),
                customer_address: formData.address.trim(),
                items: cart.map(item => ({
                    id: item.id || 0,
                    name: item.name || 'Produto',
                    price: parseFloat(item.price) || 0,
                    qty: parseInt(item.qty) || 1
                })),
                subtotal: subtotal,
                delivery_fee: deliveryFee,
                total: total,
                payment_method: paymentMethod,
                delivery_type: 'delivery'
            };

            console.log('📦 Enviando pedido:', orderData);

            const response = await api.post('/orders', orderData);
            console.log('✅ Pedido criado:', response.data);

            const orderNumber = response.data.data?.order_number || 'N/A';
            const accessToken = response.data.data?.access_token;
            const orderId = response.data.data?.id;

            console.log(`📋 Número do pedido: ${orderNumber}`);
            console.log(`🔑 Token: ${accessToken?.substring(0, 16)}...`);

            const trackLink = `${window.location.origin}/track/${orderId}?token=${accessToken}`;
            console.log(`🔗 Link de acompanhamento: ${trackLink}`);

            const phone = config?.store_phone || '5511999999999';
            const cleanPhone = phone.replace(/\D/g, '');
            let formattedPhone = cleanPhone;
            if (!formattedPhone.startsWith('55')) {
                formattedPhone = '55' + formattedPhone;
            }

            const message = 
                `🍽️ *NOVO PEDIDO #${orderNumber}*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `👤 *Cliente:* ${formData.name}\n` +
                `📱 *Telefone:* ${formData.phone}\n` +
                `📍 *Endereço:* ${formData.address}\n\n` +
                `🛒 *Itens:*\n` +
                cart.map(i => `  • ${i.qty}x ${i.name} = R$ ${(i.price * i.qty).toFixed(2)}`).join('\n') +
                `\n\n💰 *Resumo:*\n` +
                `  Subtotal: R$ ${subtotal.toFixed(2)}\n` +
                `  Taxa entrega: R$ ${deliveryFee.toFixed(2)}\n` +
                `  ─────────────────────\n` +
                `  *TOTAL: R$ ${total.toFixed(2)}*\n\n` +
                `💳 *Pagamento:* ${paymentMethod}\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `🔗 *Acompanhe seu pedido:*\n` +
                `${trackLink}`;

            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');

            clearCart();
            navigate('/');
            showToast(`Pedido #${orderNumber} enviado com sucesso!`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao criar pedido:', error);
            
            let errorMessage = 'Erro ao criar pedido. Tente novamente.';
            
            if (error.response) {
                const serverError = error.response.data?.error;
                if (serverError) {
                    errorMessage = serverError;
                } else if (error.response.status === 400) {
                    errorMessage = 'Verifique os dados do pedido e tente novamente.';
                } else if (error.response.status === 404) {
                    errorMessage = 'Restaurante não encontrado.';
                } else if (error.response.status === 500) {
                    errorMessage = 'Erro interno no servidor. Tente novamente em alguns instantes.';
                }
            } else if (error.request) {
                errorMessage = 'Não foi possível conectar ao servidor. Verifique sua internet.';
            }
            
            showToast(errorMessage, 'error');
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

            <Form onSubmit={handleSubmit}>
                <FormGroup>
                    <label>Nome completo *</label>
                    <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Seu nome completo"
                        required
                        style={{ borderColor: errors.name ? '#e74c3c' : undefined }}
                    />
                    {errors.name && <ErrorText>{errors.name}</ErrorText>}
                </FormGroup>

                <FormGroup>
                    <label>Telefone *</label>
                    <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(85) 99999-9999"
                        required
                        style={{ borderColor: errors.phone ? '#e74c3c' : undefined }}
                    />
                    <small>Digite com DDD (ex: 85 99999-9999)</small>
                    {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
                </FormGroup>

                <FormGroup>
                    <label>Endereço de entrega *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Rua, número, bairro, cidade - UF"
                            required
                            style={{ flex: 1, borderColor: errors.address ? '#e74c3c' : undefined }}
                        />
                        <Button 
                            secondary 
                            type="button"
                            onClick={() => setIsAddressModalOpen(true)}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            📍 Editar
                        </Button>
                    </div>
                    <small>Ex: Rua Exemplo, 123, Centro, Fortaleza - CE</small>
                    {errors.address && <ErrorText>{errors.address}</ErrorText>}
                </FormGroup>

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

            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={() => setIsAddressModalOpen(false)}
                onSave={handleAddressSave}
                initialAddress={formData.address}
            />
        </CheckoutContainer>
    );
};

export default Checkout;
