import React, { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useCart } from '../../contexts/CartContext';
import { api } from '../../services/api';
import ProductCard from './ProductCard';
import CartDrawer from './CartDrawer';
import './ClientLayout.css';

const ClientLayout = () => {
    const { tenant, loading } = useTenant();
    const { totalItems } = useCart();
    const [config, setConfig] = useState(null);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        if (!tenant) return;

        const loadData = async () => {
            try {
                const [configRes, productsRes] = await Promise.all([
                    api.get('/config'),
                    api.get('/products?active_only=true')
                ]);
                setConfig(configRes.data.data);
                setProducts(productsRes.data.data || []);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                setError(error.message);
            }
        };

        loadData();
    }, [tenant]);

    if (loading) return <div className="loader">Carregando...</div>;
    if (!tenant) return <div>Tenant não encontrado</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="client-app">
            <header className="store-header">
                <h1>{config?.store_name || 'Smart Delivery'}</h1>
                <div className="header-actions">
                    <span className="status">
                        {config?.is_open === 'true' ? '🟢 Aberto' : '🔴 Fechado'}
                    </span>
                    <button className="cart-icon" onClick={() => setIsCartOpen(true)}>
                        🛒
                        {totalItems > 0 && (
                            <span className="cart-badge">{totalItems}</span>
                        )}
                    </button>
                </div>
            </header>
            
            <div className="products-container">
                {products.length === 0 ? (
                    <p>Nenhum produto disponível.</p>
                ) : (
                    products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                )}
            </div>

            <CartDrawer 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onCheckout={() => {
                    setIsCartOpen(false);
                    // Navegar para checkout
                }}
            />
        </div>
    );
};

export default ClientLayout;