import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useTenant } from '../../contexts/TenantContext';
import { api } from '../../services/api';
import './Checkout.css';

const Checkout = () => {
    const navigate = useNavigate();
    const { tenant } = useTenant();
    const { cart, subtotal, clearCart } = useCart();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'Dinheiro'
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

        // Carregar dados salvos do localStorage
        const savedName = localStorage.getItem('user_name');
        const savedPhone = localStorage.getItem('user_phone');
        const savedAddress = localStorage.getItem('user_address');
        
        if (savedName) setFormData(prev => ({ ...prev, name: savedName }));
        if (savedPhone) setFormData(prev => ({ ...prev, phone: savedPhone }));
        if (savedAddress) setFormData(prev => ({ ...prev, address: savedAddress }));
    }, [tenant]);

    // Salvar dados no localStorage quando mudar
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        localStorage.setItem(`user_${name}`, value);
    };

    if (cart.length === 0) {
        return (
            <div className="checkout-empty">
                <h2>🛒 Sacola vazia</h2>
                <p>Adicione itens ao carrinho antes de finalizar o pedido.</p>
                <button className="btn-back" onClick={() => navigate('/')}>
                    Voltar para o cardápio
                </button>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.phone || !formData.address) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Validar telefone
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
                payment_method: formData.paymentMethod,
                delivery_type: 'delivery'
            };

            console.log('📦 Enviando pedido:', orderData);

            const response = await api.post('/orders', orderData);
            console.log('✅ Pedido criado:', response.data);

            // WhatsApp
            const phone = config?.store_phone || '5511999999999';
            const cleanPhone = phone.replace(/\D/g, '');
            const message = `🍽️ *NOVO PEDIDO*\nCliente: ${formData.name}\nTelefone: ${formData.phone}\nEndereço: ${formData.address}\n\n*Itens:*\n${cart.map(i => `- ${i.qty}x ${i.name} = R$ ${(i.price * i.qty).toFixed(2)}`).join('\n')}\n\nSubtotal: R$ ${subtotal.toFixed(2)}\nTaxa entrega: R$ ${deliveryFee.toFixed(2)}\n*Total: R$ ${total.toFixed(2)}*\nPagamento: ${formData.paymentMethod}`;
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

    const deliveryFee = parseFloat(config?.delivery_fee) || 0;
    const total = subtotal + deliveryFee;

    return (
        <div className="checkout-container">
            <button className="btn-back" onClick={() => navigate('/')}>
                ← Voltar
            </button>

            <h2>📋 Finalizar Pedido</h2>

            <div className="checkout-summary">
                <h3>Resumo do pedido</h3>
                {cart.map(item => (
                    <div key={item.id} className="checkout-item">
                        <span>{item.qty}x {item.name}</span>
                        <span>R$ {(item.price * item.qty).toFixed(2)}</span>
                    </div>
                ))}
                <div className="checkout-total">
                    <div><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                    <div><span>Taxa de entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
                    <div className="total"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="checkout-form">
                <div className="form-group">
                    <label>Nome completo *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Seu nome"
                    />
                </div>

                <div className="form-group">
                    <label>Telefone *</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="(85) 99999-9999"
                    />
                </div>

                <div className="form-group">
                    <label>Endereço de entrega *</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        placeholder="Rua, número, bairro, cidade - UF"
                    />
                </div>

                <div className="form-group">
                    <label>Forma de pagamento</label>
                    <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                    >
                        <option value="Dinheiro">💰 Dinheiro</option>
                        <option value="Pix">📲 Pix</option>
                        <option value="Crédito">💳 Cartão de Crédito</option>
                        <option value="Débito">💳 Cartão de Débito</option>
                    </select>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Enviando...' : `✅ Confirmar Pedido - R$ ${total.toFixed(2)}`}
                </button>
            </form>
        </div>
    );
};

export default Checkout;