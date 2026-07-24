import React, { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { api } from '../../services/api';
import ProductList from './ProductList';
import Cart from './Cart';
import './ClientLayout.css';

const ClientLayout = () => {
    const { tenant, loading } = useTenant();
    const [config, setConfig] = useState(null);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);

    useEffect(() => {
        if (!tenant) return;

        const loadData = async () => {
            try {
                const [configRes, productsRes] = await Promise.all([
                    api.get('/config'),
                    api.get('/products?active_only=true')
                ]);
                setConfig(configRes.data.data);
                setProducts(productsRes.data.data);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            }
        };

        loadData();
    }, [tenant]);

    if (loading) {
        return <div className="loader">Carregando...</div>;
    }

    if (!tenant) {
        return <div>Tenant não encontrado</div>;
    }

    return (
        <div className="client-app">
            <header className="store-header">
                <h1>{config?.store_name || 'Smart Delivery'}</h1>
                <span className="status">
                    {config?.is_open === 'true' ? '🟢 Aberto' : '🔴 Fechado'}
                </span>
            </header>
            
            <ProductList products={products} cart={cart} setCart={setCart} />
            
            <Cart cart={cart} setCart={setCart} config={config} />
        </div>
    );
};

export default ClientLayout;