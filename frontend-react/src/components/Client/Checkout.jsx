import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useCart } from '../../contexts/CartContext';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { Container, Button, Card, Input } from '../Shared/Container';
import AddressModal from './AddressModal';
import DateTimePicker from './DateTimePicker';

// ============================================================
//  UTILITÁRIO: VERIFICAR SE É DOMÍNIO PERSONALIZADO
// ============================================================
const isCustomDomain = () => {
    const host = window.location.hostname;
    return host !== 'smart-delivery-saas.onrender.com' && 
           host !== 'localhost' && 
           host !== '127.0.0.1' &&
           !host.includes('render.com');
};

// ============================================================
//  FUNÇÃO PARA OBTER OU CRIAR INSCRIÇÃO PUSH (CLIENTE)
// ============================================================
const getOrCreateDeviceToken = async (tenantId) => {
    try {
        // Verificar se o Service Worker está disponível
        if (!('serviceWorker' in navigator)) {
            console.log('⚠️ Service Worker não disponível');
            return null;
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        
        // ✅ SE NÃO TIVER INSCRIÇÃO, TENTAR CRIAR (como CLIENTE)
        if (!subscription) {
            console.log('🔄 Nenhuma inscrição encontrada. Criando como CLIENTE...');
            
            try {
                const response = await fetch('/api/notifications/vapid-public-key');
                const data = await response.json();
                
                if (!data.publicKey) {
                    console.error('❌ VAPID key não disponível');
                    return null;
                }
                
                const applicationServerKey = (key) => {
                    const base64 = key.replace(/-/g, '+').replace(/_/g, '/');
                    const rawData = atob(base64);
                    const outputArray = new Uint8Array(rawData.length);
                    for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                    }
                    return outputArray;
                };
                
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey(data.publicKey)
                });
                
                console.log('✅ Nova inscrição criada!');
                
                // ✅ SALVAR COMO CLIENTE
                const tenant = tenantId || 'fireburger';
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        subscription: subscription,
                        tenant: tenant,
                        userType: 'client' // ✅ CLIENTE
                    })
                });
                
                console.log('✅ Inscrição salva no backend como CLIENTE');
                
            } catch (subscribeError) {
                console.error('❌ Erro ao criar inscrição:', subscribeError);
                return null;
            }
        }
        
        if (subscription) {
            const endpoint = subscription.endpoint;
            console.log('📱 Device token obtido:', endpoint.substring(0, 50) + '...');
            return endpoint;
        } else {
            console.log('⚠️ Nenhuma inscrição push disponível');
            return null;
        }
    } catch (error) {
        console.error('❌ Erro ao obter/criar device_token:', error);
        return null;
    }
};

// ============================================================
//  STYLED COMPONENTS
// ============================================================
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
    margin-top: 16px;
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

const DiscountBadge = styled.div`
    background: #e8f5e9;
    color: #2e7d32;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    display: inline-block;
    border: 1px solid #a5d6a7;
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
    border: 2px solid ${props => props.selected ? '#2e7d32' : '#dfe6e9'};
    border-radius: 30px;
    background: ${props => props.selected ? '#e8f5e9' : '#fff'};
    color: ${props => props.selected ? '#2e7d32' : '#2d3436'};
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
        border-color: #2e7d32;
        background: ${props => props.selected ? '#e8f5e9' : '#e8f5e9'};
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

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
        const newWindow = window.open(url, '_blank');
        if (isIOS && (!newWindow || newWindow.closed)) {
            window.location.href = url;
        }
    } else {
        window.open(url, '_blank');
    }
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

    const [isScheduled, setIsScheduled] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);
    const [isStoreOpen, setIsStoreOpen] = useState(true);

    const [deliveryFee, setDeliveryFee] = useState(0);
    const [deliveryType, setDeliveryType] = useState('fixa');
    const [isManualDelivery, setIsManualDelivery] = useState(false);
    const [deliveryMessage, setDeliveryMessage] = useState('');

    // ============================================================
    //  STATE PARA DESCONTO
    // ============================================================
    const [discount, setDiscount] = useState(0);
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [discountReason, setDiscountReason] = useState('');
    const [isDiscountApplied, setIsDiscountApplied] = useState(false);

    // ============================================================
    //  CARREGAR CONFIGURAÇÕES
    // ============================================================
    useEffect(() => {
        if (!tenant) return;

        const loadData = async () => {
            try {
                const res = await api.get('/config');
                setConfig(res.data.data);
                setDeliveryType(res.data.data.delivery_type || 'fixa');

                if (res.data.data.delivery_type === 'fixa') {
                    setDeliveryFee(parseFloat(res.data.data.delivery_fee) || 0);
                } else if (res.data.data.delivery_type === 'manual') {
                    setDeliveryFee(0);
                    setIsManualDelivery(true);
                    setDeliveryMessage('A taxa de entrega será informada pelo restaurante após a confirmação do pedido.');
                }

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
    //  CALCULAR DESCONTO
    // ============================================================
    const calculateDiscount = useCallback((paymentMethod, subtotal) => {
        if (!config) return { discount: 0, percentage: 0, reason: '' };

        if (config.discount_enabled !== 'true') {
            return { discount: 0, percentage: 0, reason: '' };
        }

        const eligibleMethods = config.discount_payment_methods || ['Dinheiro', 'Pix'];
        if (!eligibleMethods.includes(paymentMethod)) {
            return { discount: 0, percentage: 0, reason: '' };
        }

        const percentage = parseFloat(config.discount_percentage) || 4;
        const discountAmount = subtotal / (1 + (percentage / 100));
        const finalDiscount = subtotal - discountAmount;

        return {
            discount: Math.round(finalDiscount * 100) / 100,
            percentage: percentage,
            reason: `Desconto de ${percentage}% para pagamento em ${paymentMethod}`
        };
    }, [config]);

    // ============================================================
    //  ATUALIZAR DESCONTO QUANDO MUDAR PAGAMENTO
    // ============================================================
    useEffect(() => {
        if (config && subtotal > 0) {
            const result = calculateDiscount(paymentMethod, subtotal);
            setDiscount(result.discount);
            setDiscountPercentage(result.percentage);
            setDiscountReason(result.reason);
            setIsDiscountApplied(result.discount > 0);
        } else {
            setDiscount(0);
            setDiscountPercentage(0);
            setDiscountReason('');
            setIsDiscountApplied(false);
        }
    }, [paymentMethod, subtotal, config, calculateDiscount]);

    // ============================================================
    //  CALCULAR TAXA DE ENTREGA
    // ============================================================
    const calculateDeliveryFee = useCallback(async (address) => {
        if (!address || address.trim().length < 5) {
            if (deliveryType === 'fixa') {
                setDeliveryFee(parseFloat(config?.delivery_fee) || 0);
                setIsManualDelivery(false);
                setDeliveryMessage('');
            } else if (deliveryType === 'manual' || deliveryType === 'dinamica') {
                setDeliveryFee(0);
                setIsManualDelivery(true);
                setDeliveryMessage('A taxa de entrega será informada pelo restaurante após a confirmação do pedido.');
            }
            return;
        }

        if (deliveryType === 'manual') {
            setDeliveryFee(0);
            setIsManualDelivery(true);
            setDeliveryMessage('A taxa de entrega será informada pelo restaurante após a confirmação do pedido.');
            return;
        }

        try {
            const response = await api.post('/calculate-delivery', {
                address: address,
                tenant: tenant
            });

            if (response.data.success) {
                const fee = response.data.fee || 0;
                const found = response.data.found !== undefined ? response.data.found : true;
                const message = response.data.message || '';

                setDeliveryFee(fee);

                if (!found) {
                    setIsManualDelivery(true);
                    setDeliveryFee(0);
                    setDeliveryMessage('A taxa de entrega será informada pelo restaurante após a confirmação do pedido.');
                } else {
                    setIsManualDelivery(false);
                    setDeliveryMessage('');
                }

                setDeliveryType(response.data.type || 'fixa');
            }
        } catch (error) {
            console.error('Erro ao calcular taxa:', error);
            setDeliveryFee(parseFloat(config?.delivery_fee) || 0);
            setIsManualDelivery(false);
            setDeliveryMessage('');
        }
    }, [tenant, config, deliveryType]);

    useEffect(() => {
        if (formData.address && formData.address.trim().length >= 5) {
            calculateDeliveryFee(formData.address);
        }
    }, [formData.address, calculateDeliveryFee]);

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
    //  FORMATAR SCHEDULED TIME
    // ============================================================
    const formatScheduledTime = (datetime) => {
        if (!datetime) return null;

        try {
            let clean = datetime;
            clean = clean.replace('Z', '');
            clean = clean.replace(/[+-]\d{2}:\d{2}$/, '');
            clean = clean.replace(' ', 'T');

            const parts = clean.split('T');
            if (parts.length !== 2) {
                console.error('❌ Formato inválido:', datetime);
                return null;
            }

            const datePart = parts[0];
            const timePart = parts[1];

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(datePart)) {
                console.error('❌ Data inválida:', datePart);
                return null;
            }

            const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
            if (!timeRegex.test(timePart)) {
                console.error('❌ Hora inválida:', timePart);
                return null;
            }

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
    //  VALIDAÇÃO
    // ============================================================
    const validateForm = () => {
        const newErrors = {};

        const nameError = validateName(formData.name);
        if (nameError) newErrors.name = nameError;

        const phoneError = validatePhone(formData.phone);
        if (phoneError) newErrors.phone = phoneError;

        const addressError = validateAddress(formData.address);
        if (addressError) newErrors.address = addressError;

        if (!isStoreOpen && !selectedSchedule) {
            showToast('🔴 Loja fechada. Selecione um horário de agendamento.', 'warning');
            return false;
        }

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

    // ============================================================
    //  NAVEGAÇÃO - CORRIGIDA PARA DOMÍNIOS PERSONALIZADOS
    // ============================================================
    const navigateTo = (path) => {
        const custom = isCustomDomain();
        if (custom) {
            navigate(path);
        } else {
            navigate(`${path}?tenant=${tenant}`);
        }
    };

    // ============================================================
    //  CALCULAR TOTAL COM DESCONTO
    // ============================================================
    const totalWithDiscount = subtotal - discount;
    const finalTotal = totalWithDiscount + deliveryFee;

    // ============================================================
    //  SUBMIT - CORRIGIDO COM DEVICE_TOKEN E user_type: 'client'
    // ============================================================
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
            const invalidItems = cart.filter(item => !item.name || !item.price || !item.qty);
            if (invalidItems.length > 0) {
                showToast('Alguns itens do carrinho estão inválidos.', 'error');
                setLoading(false);
                return;
            }

            const scheduledTimeToSend = selectedSchedule
                ? formatScheduledTime(selectedSchedule.datetime)
                : null;

            // ✅ OBTER OU CRIAR DEVICE_TOKEN (como CLIENTE)
            const deviceToken = await getOrCreateDeviceToken(tenant);
            console.log('📱 Device token para o pedido:', deviceToken ? '✅ obtido' : '❌ não disponível');

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
                discount: discount,
                discount_percentage: discountPercentage,
                discount_reason: discountReason,
                total: finalTotal,
                payment_method: paymentMethod,
                delivery_type: 'delivery',
                is_scheduled: isScheduled || !isStoreOpen ? true : false,
                scheduled_time: scheduledTimeToSend,
                device_token: deviceToken // ✅ ADICIONAR DEVICE_TOKEN
            };

            if (!isStoreOpen && !selectedSchedule) {
                setLoading(false);
                return;
            }

            console.log('📦 Enviando pedido com desconto:', orderData);

            const response = await api.post('/orders', orderData);
            console.log('✅ Pedido criado:', response.data);

            const orderNumber = response.data.data?.order_number || 'N/A';
            const accessToken = response.data.data?.access_token;
            const orderId = response.data.data?.id;

            const custom = isCustomDomain();
            const trackLink = custom
                ? `${window.location.origin}/track/${orderId}?token=${accessToken}`
                : `${window.location.origin}/track/${orderId}?token=${accessToken}&tenant=${tenant}`;

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

            const deliveryFeeText = isManualDelivery
                ? '📝 *Taxa de entrega:* Informada após o pedido'
                : `🚚 *Taxa de entrega:* R$ ${deliveryFee.toFixed(2)}`;

            const discountText = isDiscountApplied && discount > 0
                ? `   *Desconto (${discountPercentage}%):* - R$ ${discount.toFixed(2)}\n`
                : '';

            const message =
                `🍽️ *NOVO PEDIDO #${orderNumber}*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `👤 *Cliente:* ${formData.name}\n` +
                `📱 *Telefone:* ${formData.phone}\n` +
                `📍 *Endereço:* ${formData.address}${scheduledText}\n\n` +
                `🛒 *Itens:*\n` +
                cart.map(i => `  • ${i.qty}x ${i.name} = R$ ${(i.price * i.qty).toFixed(2)}`).join('\n') +
                `\n\n *Resumo:*\n` +
                `  Subtotal: R$ ${subtotal.toFixed(2)}\n` +
                `  ${deliveryFeeText}\n` +
                `${discountText}` +
                `  ─────────────────────\n` +
                `  *TOTAL: R$ ${finalTotal.toFixed(2)}*\n\n` +
                `💳 *Pagamento:* ${paymentMethod}\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `🔗 *Acompanhe seu pedido:*\n` +
                `${trackLink}`;

            openWhatsApp(formattedPhone, message);

            clearCart();
            navigateTo('/');
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
                    <Button primary onClick={() => navigateTo('/')}>
                        Voltar para o cardápio
                    </Button>
                </div>
            </CheckoutContainer>
        );
    }

    return (
        <CheckoutContainer>
            <BackButton onClick={() => navigateTo('/')}>
                ← Voltar
            </BackButton>

            <Title>📋 Finalizar Pedido</Title>

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
                    RESUMO DO PEDIDO COM DESCONTO - SIMPLIFICADO
                    ============================================================ */}
                <SummaryCard>
                    <h3 style={{ fontSize: 16, color: '#555', marginBottom: 12 }}>📋 Resumo do pedido</h3>
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

                    {/* ✅ DESCONTO - UMA ÚNICA LINHA */}
                    {isDiscountApplied && discount > 0 && (
                        <SummaryItem style={{ color: '#2e7d32', fontWeight: '500' }}>
                            <span className="name">Desconto ({discountPercentage}% para pagamento em {paymentMethod})</span>
                            <span>- R$ {discount.toFixed(2)}</span>
                        </SummaryItem>
                    )}

                    <SummaryItem>
                        <span className="name">
                            {isManualDelivery ? '📝 Taxa de entrega (manual)' : '🚚 Taxa de entrega'}
                        </span>
                        <span>
                            {isManualDelivery 
                                ? 'Informada após o pedido' 
                                : `R$ ${deliveryFee.toFixed(2)}`}
                        </span>
                    </SummaryItem>

                    <TotalRow>
                        <span>Total {isDiscountApplied && <span style={{ fontSize: '14px', color: '#2e7d32' }}>(com desconto)</span>}</span>
                        <span>R$ {finalTotal.toFixed(2)}</span>
                    </TotalRow>

                    {/* ✅ BADGE DE DESCONTO - UMA ÚNICA VEZ */}
                    {isDiscountApplied && discount > 0 && (
                        <div style={{
                            marginTop: '10px',
                            padding: '8px 12px',
                            background: '#e8f5e9',
                            borderRadius: '6px',
                            border: '1px solid #a5d6a7',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '13px', color: '#2e7d32', fontWeight: '500' }}>
                                Economia de {discountPercentage}%
                            </span>
                            <span style={{ fontSize: '14px', color: '#2e7d32', fontWeight: '600' }}>
                                R$ {discount.toFixed(2)}
                            </span>
                        </div>
                    )}
                    
                    {isManualDelivery && (
                        <div style={{
                            fontSize: '12px',
                            color: '#888',
                            marginTop: '8px',
                            padding: '8px 12px',
                            background: '#fef9e7',
                            borderRadius: '6px',
                            border: '1px solid #f39c12'
                        }}>
                            💡 {deliveryMessage || 'A taxa de entrega será informada pelo restaurante após a confirmação do pedido.'}
                        </div>
                    )}
                </SummaryCard>

                {/* ============================================================
                    SEÇÃO DE AGENDAMENTO
                    ============================================================ */}
                <ScheduleSection>
                    {!isStoreOpen && (
                        <StoreClosedWarning>
                            <span className="title">🔴 Loja fechada no momento</span>
                            <span className="sub">
                                Para fazer um pedido, selecione um horário de agendamento abaixo.
                                Seu pedido será preparado quando a loja abrir.
                            </span>
                        </StoreClosedWarning>
                    )}

                    <ScheduleToggle>
                        <input
                            type="checkbox"
                            checked={isScheduled}
                            onChange={toggleSchedule}
                            disabled={!isStoreOpen}
                        />
                        <span>
                            {!isStoreOpen ? '📅 Agendar entrega (obrigatório)' : '📅 Agendar entrega para outro dia/horário'}
                        </span>
                    </ScheduleToggle>

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
                    {isDiscountApplied && (
                        <div style={{
                            fontSize: '12px',
                            color: '#2e7d32',
                            marginTop: '8px',
                            padding: '8px 12px',
                            background: '#e8f5e9',
                            borderRadius: '6px'
                        }}>
                            Pagamento em {paymentMethod} garante {discountPercentage}% de desconto!
                        </div>
                    )}
                </PaymentSection>

                <SubmitButton
                    primary
                    disabled={loading || (!isStoreOpen && !selectedSchedule)}
                >
                    {loading ? 'Enviando...' : `✅ Confirmar Pedido - R$ ${finalTotal.toFixed(2)}`}
                </SubmitButton>

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