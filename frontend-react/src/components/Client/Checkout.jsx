import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCart } from '../../contexts/CartContext';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { Container, Button, Card, Input } from '../Shared/Container';
import AddressModal from './AddressModal';
import DateTimePicker from './DateTimePicker';

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
//  SEÇÃO DE AGENDAMENTO
// ============================================================
const ScheduleSection = styled.div`
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    margin-bottom: 16px;
`;

const StoreClosedWarning = styled.div`
    padding: 12px 16px;
    background: #fef9e7;
    border: 2px solid #f39c12;
    border-radius: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    color: #856404;

    .title {
        font-weight: 600;
        display: block;
        margin-bottom: 4px;
    }

    .sub {
        display: block;
        margin-top: 4px;
        font-size: 13px;
    }
`;

const ScheduleToggle = styled.label`
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    color: #2d3436;
    
    input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #e67e22;
    }
`;

const ScheduleInfo = styled.div`
    margin-top: 12px;
    padding: 12px 16px;
    background: #f0faf4;
    border-radius: 8px;
    border: 2px solid #2ecc71;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const SelectScheduleButton = styled.button`
    padding: 10px 20px;
    background: #e67e22;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;

    &:hover {
        background: #d35400;
        transform: translateY(-1px);
    }
`;

const ChangeScheduleButton = styled.button`
    padding: 4px 12px;
    background: #e74c3c;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;

    &:hover {
        background: #c0392b;
    }
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
//  FUNÇÃO PARA ABRIR WHATSAPP
// ============================================================
const openWhatsApp = (phoneNumber, message) => {
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    console.log('📱 Abrindo WhatsApp:', url);

    const newWindow = window.open(url, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.log('📱 Fallback: usando location.href para iOS');
        window.location.href = url;
    }

    setTimeout(() => {
        if (newWindow && !newWindow.closed) return;
        console.log('📱 Segundo fallback: forçando location.href');
        window.location.href = url;
    }, 500);
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

    // ============================================================
    //  STATE PARA AGENDAMENTO E STATUS DA LOJA
    // ============================================================
    const [isScheduled, setIsScheduled] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);
    const [isStoreOpen, setIsStoreOpen] = useState(true);

    useEffect(() => {
        if (!tenant) return;

        const loadData = async () => {
            try {
                // Carregar config
                const res = await api.get('/config');
                setConfig(res.data.data);

                // Carregar status da loja
                const statusRes = await api.get('/store/status');
                if (statusRes.data.success) {
                    setIsStoreOpen(statusRes.data.data.is_open);
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            }
        };
        loadData();

        const savedName = localStorage.getItem('user_name');
        const savedPhone = localStorage.getItem('user_phone');
        const savedAddress = localStorage.getItem('user_address');

        if (savedName) setFormData(prev => ({ ...prev, name: savedName }));
        if (savedPhone) setFormData(prev => ({ ...prev, phone: savedPhone }));
        if (savedAddress) setFormData(prev => ({ ...prev, address: savedAddress }));
    }, [tenant]);

    // ============================================================
    //  FUNÇÕES DE AGENDAMENTO
    // ============================================================
    const toggleSchedule = () => {
        setIsScheduled(!isScheduled);
        if (isScheduled) {
            setSelectedSchedule(null);
            setShowSchedulePicker(false);
        }
    };

    const handleScheduleSelect = (schedule) => {
        setSelectedSchedule(schedule);
        if (schedule) {
            setShowSchedulePicker(false);
        }
    };

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
    //  ✅ CORREÇÃO: Função para formatar scheduled_time
    // ============================================================
    const formatScheduledTime = (datetime) => {
        if (!datetime) return null;
        
        try {
            // Se for uma string, remover qualquer timezone
            let clean = datetime;
            
            // Remover 'Z' (UTC) e qualquer offset (+03:00, -03:00, etc)
            clean = clean.replace('Z', '');
            clean = clean.replace(/[+-]\d{2}:\d{2}$/, '');
            
            // Se tiver espaço, converter para T
            clean = clean.replace(' ', 'T');
            
            // Garantir formato YYYY-MM-DDTHH:MM:SS
            const parts = clean.split('T');
            if (parts.length !== 2) {
                console.error('❌ Formato inválido:', datetime);
                return null;
            }
            
            const datePart = parts[0];
            const timePart = parts[1];
            
            // Validar data
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(datePart)) {
                console.error('❌ Data inválida:', datePart);
                return null;
            }
            
            // Validar hora
            const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
            if (!timeRegex.test(timePart)) {
                console.error('❌ Hora inválida:', timePart);
                return null;
            }
            
            // Garantir segundos
            const timeWithSeconds = timePart.split(':').length === 2 ? `${timePart}:00` : timePart;
            
            const formatted = `${datePart}T${timeWithSeconds}`;
            console.log('📅 Data formatada:', datetime, '->', formatted);
            
            return formatted;
        } catch (error) {
            console.error('❌ Erro ao formatar data:', error);
            return null;
        }
    };

    // ============================================================
    //  ✅ CORREÇÃO: VALIDAÇÃO COM LÓGICA DE LOJA FECHADA
    // ============================================================
    const validateForm = () => {
        const newErrors = {};

        const nameError = validateName(formData.name);
        if (nameError) newErrors.name = nameError;

        const phoneError = validatePhone(formData.phone);
        if (phoneError) newErrors.phone = phoneError;

        const addressError = validateAddress(formData.address);
        if (addressError) newErrors.address = addressError;

        // ============================================================
        //  ✅ CORREÇÃO: Agendamento é OBRIGATÓRIO quando loja fechada
        // ============================================================
        if (!isStoreOpen && !selectedSchedule) {
            showToast('🔴 Loja fechada. Selecione um horário de agendamento para continuar.', 'warning');
            return false;
        }

        // Se o agendamento está ativo mas não selecionou horário
        if (isScheduled && !selectedSchedule) {
            showToast('Selecione uma data e horário para o agendamento.', 'warning');
            return false;
        }

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

            // ============================================================
            //  ✅ CORREÇÃO: Formatar scheduled_time antes de enviar
            // ============================================================
            const scheduledTimeToSend = selectedSchedule 
                ? formatScheduledTime(selectedSchedule.datetime) 
                : null;

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
                delivery_type: 'delivery',
                is_scheduled: isScheduled || !isStoreOpen ? true : false,
                scheduled_time: scheduledTimeToSend
            };

            // Se a loja está fechada, força o agendamento
            if (!isStoreOpen && !selectedSchedule) {
                showToast('Loja fechada. Selecione um horário de agendamento.', 'warning');
                setLoading(false);
                return;
            }

            console.log('📦 Enviando pedido:', orderData);
            console.log('📅 Data agendada (enviada):', orderData.scheduled_time);

            const response = await api.post('/orders', orderData);
            console.log('✅ Pedido criado:', response.data);

            const orderNumber = response.data.data?.order_number || 'N/A';
            const accessToken = response.data.data?.access_token;
            const orderId = response.data.data?.id;

            console.log(`📋 Número do pedido: ${orderNumber}`);
            console.log(`🔑 Token: ${accessToken?.substring(0, 16)}...`);

            const trackLink = `${window.location.origin}/track/${orderId}?token=${accessToken}`;
            console.log(`🔗 Link de acompanhamento: ${trackLink}`);

            // ============================================================
            //  WHATSAPP
            // ============================================================
            const phone = config?.store_phone || '5511999999999';
            const cleanPhone = phone.replace(/\D/g, '');

            let formattedPhone = cleanPhone;
            if (!formattedPhone.startsWith('55')) {
                formattedPhone = '55' + formattedPhone;
            }

            const scheduledText = (isScheduled || !isStoreOpen) && selectedSchedule
                ? `\n📅 *Agendado para:* ${new Date(selectedSchedule.datetime).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}`
                : '';

            const message =
                `🍽️ *NOVO PEDIDO #${orderNumber}*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `👤 *Cliente:* ${formData.name}\n` +
                `📱 *Telefone:* ${formData.phone}\n` +
                `📍 *Endereço:* ${formData.address}${scheduledText}\n\n` +
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

            openWhatsApp(formattedPhone, message);

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

                {/* ============================================================
                    SEÇÃO DE AGENDAMENTO - CORRIGIDA
                    ============================================================ */}
                <ScheduleSection>
                    {/* ============================================================
                        AVISO QUANDO LOJA FECHADA
                        ============================================================ */}
                    {!isStoreOpen && (
                        <StoreClosedWarning>
                            <span className="title">🔴 Loja fechada no momento</span>
                            <span className="sub">
                                Para fazer um pedido, selecione um horário de agendamento abaixo.
                                Seu pedido será preparado quando a loja abrir.
                            </span>
                        </StoreClosedWarning>
                    )}

                    {/* ============================================================
                        CHECKBOX DE AGENDAMENTO
                        ============================================================ */}
                    <ScheduleToggle>
                        <input
                            type="checkbox"
                            checked={isScheduled}
                            onChange={toggleSchedule}
                            disabled={!isStoreOpen} // Se loja fechada, agendamento é obrigatório
                        />
                        <span>
                            {!isStoreOpen ? '📅 Agendar entrega (obrigatório)' : '📅 Agendar entrega para outro dia/horário'}
                        </span>
                    </ScheduleToggle>

                    {/* ============================================================
                        SELEÇÃO DE DATA/HORÁRIO
                        ============================================================ */}
                    {(isScheduled || !isStoreOpen) && (
                        <div style={{ marginTop: '12px' }}>
                            {!showSchedulePicker && !selectedSchedule && (
                                <SelectScheduleButton
                                    type="button"
                                    onClick={() => setShowSchedulePicker(true)}
                                >
                                    Selecionar data e horário
                                </SelectScheduleButton>
                            )}

                            {showSchedulePicker && (
                                <DateTimePicker
                                    isOpen={true}
                                    onSelect={handleScheduleSelect}
                                    selectedDateTime={selectedSchedule}
                                />
                            )}

                            {selectedSchedule && !showSchedulePicker && (
                                <ScheduleInfo>
                                    <span>
                                        📅 {selectedSchedule.date} às {selectedSchedule.time}
                                    </span>
                                    <ChangeScheduleButton
                                        type="button"
                                        onClick={() => {
                                            setSelectedSchedule(null);
                                            setShowSchedulePicker(true);
                                        }}
                                    >
                                        Alterar
                                    </ChangeScheduleButton>
                                </ScheduleInfo>
                            )}
                        </div>
                    )}
                </ScheduleSection>

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

                <SubmitButton
                    primary
                    disabled={loading || (!isStoreOpen && !selectedSchedule)}
                >
                    {loading ? 'Enviando...' : `✅ Confirmar Pedido - R$ ${total.toFixed(2)}`}
                </SubmitButton>

                {/* ============================================================
                    MENSAGEM QUANDO BOTÃO DESABILITADO
                    ============================================================ */}
                {!isStoreOpen && !selectedSchedule && !loading && (
                    <div style={{
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#e74c3c',
                        marginTop: '-8px'
                    }}>
                        ⚠️ Selecione um horário de agendamento para finalizar o pedido
                    </div>
                )}
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
