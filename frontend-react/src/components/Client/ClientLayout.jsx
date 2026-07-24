import React, { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { api } from '../../services/api';
import './ClientLayout.css';

const ClientLayout = () => {
    const { tenant, loading } = useTenant();
    const [config, setConfig] = useState(null);
    const [products, setProducts] = useState([]);

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
            
            <div className="products-container">
                {products.map(product => (
                    <div key={product.id} className="product-item">
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <p>R$ {parseFloat(product.price).toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientLayout;