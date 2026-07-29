import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useCart } from '../../contexts/CartContext';
import { api } from '../../services/api';
import { Container, PageHeader, SectionTitle, Badge } from '../Shared/Container';
import ProductCard from './ProductCard';
import CartDrawer from './CartDrawer';

// ============================================================
//  BANNER
// ============================================================
const BannerWrapper = styled.div`
    margin: -16px -16px 0 -16px;
    
    @media (min-width: 600px) {
        margin: 0 -16px 0 -16px;
        border-radius: 0 0 24px 24px;
        overflow: hidden;
    }
`;

const BannerImage = styled.div`
    width: 100%;
    height: 200px;
    background: url(${props => props.$image}) center/cover no-repeat;
    background-color: #f0f0f0;
    transition: background-image 0.5s ease;
    
    @media (min-width: 480px) {
        height: 260px;
    }
    
    @media (min-width: 768px) {
        height: 320px;
    }
`;

const BannerPlaceholder = styled.div`
    width: 100%;
    height: 200px;
    background: linear-gradient(135deg, #e67e22, #d35400);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    
    @media (min-width: 480px) {
        height: 260px;
        font-size: 32px;
    }
`;

// ============================================================
//  STORE INFO (ABAIXO DO BANNER)
// ============================================================
const StoreInfoCard = styled.div`
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    margin-top: -16px;
    position: relative;
    z-index: 2;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border: 1px solid #f0f0f0;
    margin-bottom: 16px;
    min-height: 80px;
`;

const StoreHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
`;

const StoreName = styled.h1`
    font-size: 24px;
    font-weight: 700;
    color: #2d3436;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    
    .placeholder {
        color: #b2bec3;
        font-weight: 400;
        font-size: 18px;
    }
`;

const LogoImage = styled.img`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid #f0f0f0;
    object-fit: cover;
    background: #fff;
`;

const LogoPlaceholder = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid #f0f0f0;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    color: #b2bec3;
`;

const StoreMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
    width: 100%;
`;

const MetaRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 14px;
    color: #636e72;
    
    .address {
        font-size: 13px;
        color: #888;
    }
`;

// ============================================================
//  FUNÇÃO PARA VERIFICAR SE A LOJA ESTÁ ABERTA
// ============================================================
const isStoreOpen = (openTime, closeTime) => {
    if (!openTime || !closeTime) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;
    
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMinute;
    let closeMinutes = closeHour * 60 + closeMinute;
    
    if (closeMinutes <= openMinutes) {
        closeMinutes += 24 * 60;
        if (currentMinutes < openMinutes) return false;
        if (currentMinutes >= closeMinutes) return false;
        return true;
    }
    
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};

// ============================================================
//  CARRINHO FLUTUANTE
// ============================================================
const FloatingCart = styled.button`
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #e67e22;
    border: none;
    box-shadow: 0 4px 20px rgba(230, 126, 34, 0.4);
    color: #fff;
    font-size: 28px;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(230, 126, 34, 0.5);
    }
    
    &:active {
        transform: scale(0.95);
    }
`;

const FloatingBadge = styled.span`
    position: absolute;
    top: -6px;
    right: -6px;
    background: #e74c3c;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
    animation: pulse 2s infinite;
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;

// ============================================================
//  PRODUCT GRID
// ============================================================
const ProductGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    padding-bottom: 80px;
    
    @media (min-width: 480px) {
        grid-template-columns: repeat(2, 1fr);
    }
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const ClientLayout = () => {
    const { tenant, loading: tenantLoading } = useTenant();
    const { totalItems } = useCart();
    const [config, setConfig] = useState(null);
    const [products, setProducts] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!tenant) return;

        const loadData = async () => {
            try {
                setIsLoading(true);
                const [configRes, productsRes] = await Promise.all([
                    api.get('/config'),
                    api.get('/products?active_only=true')
                ]);
                setConfig(configRes.data.data);
                setProducts(productsRes.data.data || []);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [tenant]);

    // Atualizar status a cada minuto
    useEffect(() => {
        if (!config) return;
        
        const checkStatus = () => {
            const open = isStoreOpen(config.open_time, config.close_time);
            setIsOpen(open);
        };
        
        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        
        return () => clearInterval(interval);
    }, [config]);

    // Mostrar loading apenas no primeiro carregamento
    if (tenantLoading || (isLoading && !config)) {
        return <div className="loader">Carregando...</div>;
    }

    const hasBanner = !!config?.banner_image;
    const storeName = config?.store_name || 'Carregando...';
    const logoImage = config?.logo_image;

    return (
        <>
            <Container>
                {/* BANNER */}
                <BannerWrapper>
                    {hasBanner ? (
                        <BannerImage $image={config.banner_image} />
                    ) : (
                        <BannerPlaceholder>
                            {storeName !== 'Carregando...' ? storeName : 'Smart Delivery'}
                        </BannerPlaceholder>
                    )}
                </BannerWrapper>

                {/* STORE INFO - ABAIXO DO BANNER */}
                <StoreInfoCard>
                    <StoreHeader>
                        <StoreName>
                            {logoImage ? (
                                <LogoImage src={logoImage} alt="Logo" />
                            ) : (
                                <LogoPlaceholder>🍔</LogoPlaceholder>
                            )}
                            {storeName}
                        </StoreName>
                    </StoreHeader>

                    <StoreMeta>
                        <MetaRow>
                            <Badge status={isOpen ? 'open' : 'closed'}>
                                {isOpen ? '🟢 Aberto' : '🔴 Fechado'}
                            </Badge>
                            <span>{config?.open_time || '09:00'} – {config?.close_time || '22:00'}</span>
                            {config?.store_address && (
                                <span className="address">📍 {config.store_address}</span>
                            )}
                        </MetaRow>
                    </StoreMeta>
                </StoreInfoCard>

                {/* CARDÁPIO */}
                <PageHeader>
                    <SectionTitle>🍽️ Cardápio</SectionTitle>
                    {products.length > 0 && (
                        <span style={{ fontSize: 14, color: '#b2bec3' }}>
                            {products.length} itens
                        </span>
                    )}
                </PageHeader>

                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#b2bec3' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
                        <p>Nenhum produto disponível no momento.</p>
                    </div>
                ) : (
                    <ProductGrid>
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </ProductGrid>
                )}
            </Container>

            {/* CARRINHO FLUTUANTE */}
            <FloatingCart onClick={() => setIsCartOpen(true)}>
                🛒
                {totalItems > 0 && (
                    <FloatingBadge>{totalItems}</FloatingBadge>
                )}
            </FloatingCart>

            {/* CARRINHO DRAWER */}
            <CartDrawer 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
            />
        </>
    );
};

export default ClientLayout;