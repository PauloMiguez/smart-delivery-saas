import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useCart } from '../../contexts/CartContext';
import { api } from '../../services/api';
import { Badge } from '../Shared/Container';
import ProductCard from './ProductCard';
import CartDrawer from './CartDrawer';

// ============================================================
//  FORÇAR CARREGAMENTO DOS COMPONENTES DE PEDIDOS
// ============================================================
import OrdersHistory from './OrdersHistory';
import TrackOrder from './TrackOrder';

// ============================================================
//  CONTAINER PRINCIPAL
// ============================================================
const AppContainer = styled.div`
    max-width: 100vw;
    overflow-x: hidden;
    padding: 0 16px 80px 16px;
    box-sizing: border-box;
`;

// ============================================================
//  BANNER
// ============================================================
const BannerWrapper = styled.div`
    margin: -16px -16px 0 -16px;
    overflow: hidden;
    
    @media (min-width: 600px) {
        margin: 0 -16px 0 -16px;
        border-radius: 0 0 24px 24px;
    }
`;

const BannerImage = styled.div`
    width: 100%;
    height: 200px;
    background: url(${props => props.$image}) center/cover no-repeat;
    background-color: #f0f0f0;
    
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
//  STORE INFO
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
//  LINK DE MEUS PEDIDOS
// ============================================================
const OrdersLinkWrapper = styled.div`
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: flex-start;
    align-items: center;
`;

const OrdersLink = styled(Link)`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #e67e22;
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
    
    &:hover {
        background: #fef9e7;
        color: #d35400;
    }
    
    .icon {
        font-size: 18px;
    }
`;

// ============================================================
//  CATEGORY TABS
// ============================================================
const CategoryTabsWrapper = styled.div`
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px 0 16px 0;
    margin: 0 -16px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-left: 16px;
    padding-right: 16px;
    
    &::-webkit-scrollbar {
        display: none;
    }
`;

const CategoryTabsContainer = styled.div`
    display: flex;
    gap: 8px;
    width: max-content;
`;

const CategoryTab = styled.button`
    padding: 8px 18px;
    border: 2px solid ${props => props.active ? '#e67e22' : '#dfe6e9'};
    border-radius: 30px;
    background: ${props => props.active ? '#fef9e7' : '#fff'};
    color: ${props => props.active ? '#e67e22' : '#2d3436'};
    font-size: 14px;
    font-weight: ${props => props.active ? '600' : '500'};
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
    flex-shrink: 0;
    
    &:hover {
        border-color: #e67e22;
        background: ${props => props.active ? '#fef9e7' : '#fef9e7'};
    }
    
    &:active {
        transform: scale(0.96);
    }
`;

// ============================================================
//  PRODUCT GRID
// ============================================================
const ProductGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    padding-bottom: 80px;
    
    @media (min-width: 420px) {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
`;

// ============================================================
//  HEADER DO CARDÁPIO
// ============================================================
const MenuHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 2px solid #dfe6e9;
    margin-bottom: 16px;
`;

const MenuTitle = styled.h2`
    font-size: 20px;
    font-weight: 700;
    color: #2d3436;
    margin: 0;
`;

const MenuCount = styled.span`
    font-size: 14px;
    color: #b2bec3;
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
    border: 2px solid rgba(255,255,255,0.3);
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    color: #fff;
    font-size: 28px;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    text-shadow: 0 1px 4px rgba(0,0,0,0.3);
    
    .cart-icon {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        line-height: 1;
    }
    
    &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(230,126,34,0.5);
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
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    border: 2px solid #fff;
    animation: pulse 2s infinite;
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
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
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    // Forçar referência aos componentes (evita tree-shaking)
    const _forceComponents = [OrdersHistory, TrackOrder];

    // ============================================================
    //  SE NÃO TIVER TENANT, MOSTRAR PÁGINA DE BOAS-VINDAS
    //  (DENTRO DO COMPONENTE PARA TER ACESSO AOS PROVIDERS)
    // ============================================================
    if (!tenant && !tenantLoading) {
        return (
            <div style={{ 
                maxWidth: 480, 
                margin: '0 auto', 
                padding: '60px 20px', 
                textAlign: 'center',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>🏠</div>
                <h1 style={{ color: '#2d3436', fontSize: 28, marginBottom: 12 }}>Smart Delivery</h1>
                <p style={{ color: '#888', marginBottom: 24, fontSize: 16 }}>
                    Sistema de delivery para restaurantes
                </p>
                <div style={{ 
                    background: '#f8f9fa', 
                    padding: '20px', 
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: 380
                }}>
                    <p style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>
                        Para acessar um restaurante, use o link correto:
                    </p>
                    <code style={{ 
                        display: 'block',
                        background: '#fff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        wordBreak: 'break-all',
                        color: '#e67e22'
                    }}>
                        https://smart-delivery-saas.onrender.com/?tenant=fireburger
                    </code>
                    <p style={{ color: '#888', fontSize: 13, marginTop: 12 }}>
                        Ou use o painel administrativo:
                    </p>
                    <code style={{ 
                        display: 'block',
                        background: '#fff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        wordBreak: 'break-all',
                        color: '#e67e22'
                    }}>
                        https://smart-delivery-saas.onrender.com/admin?tenant=fireburger
                    </code>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (!tenant) return;

        const loadData = async () => {
            try {
                setIsLoading(true);
                const [configRes, productsRes, categoriesRes] = await Promise.all([
                    api.get('/config'),
                    api.get('/products?active_only=true'),
                    api.get('/categories')
                ]);
                const productsData = productsRes.data.data || [];
                const categoriesData = categoriesRes.data.data || [];
                
                setConfig(configRes.data.data);
                setProducts(productsData);
                
                const sortedCategories = categoriesData
                    .filter(cat => productsData.some(p => p.category === cat.name && p.active))
                    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                    .map(cat => cat.name);
                
                setCategories(sortedCategories);
                if (sortedCategories.length > 0) {
                    setActiveCategory(sortedCategories[0]);
                }
                setFilteredProducts(productsData);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [tenant]);

    useEffect(() => {
        if (activeCategory) {
            setFilteredProducts(products.filter(p => p.category === activeCategory));
        } else {
            setFilteredProducts(products);
        }
    }, [activeCategory, products]);

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

    const scrollToCategory = (category) => {
        setActiveCategory(category);
        const element = document.getElementById(`category-${category}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (tenantLoading || (isLoading && !config)) {
        return <div className="loader">Carregando...</div>;
    }

    const hasBanner = !!config?.banner_image;
    const storeName = config?.store_name || 'Carregando...';
    const logoImage = config?.logo_image;

    return (
        <>
            <AppContainer>
                <BannerWrapper>
                    {hasBanner ? (
                        <BannerImage $image={config.banner_image} />
                    ) : (
                        <BannerPlaceholder>
                            {storeName !== 'Carregando...' ? storeName : 'Smart Delivery'}
                        </BannerPlaceholder>
                    )}
                </BannerWrapper>

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

                    <OrdersLinkWrapper>
                        <OrdersLink to={`/orders?tenant=${tenant}`}>
                            <span className="icon">📋</span>
                            Meus Pedidos
                        </OrdersLink>
                    </OrdersLinkWrapper>
                </StoreInfoCard>

                {categories.length > 0 && (
                    <CategoryTabsWrapper>
                        <CategoryTabsContainer>
                            {categories.map(cat => (
                                <CategoryTab
                                    key={cat}
                                    active={activeCategory === cat}
                                    onClick={() => scrollToCategory(cat)}
                                >
                                    {cat}
                                </CategoryTab>
                            ))}
                        </CategoryTabsContainer>
                    </CategoryTabsWrapper>
                )}

                <MenuHeader>
                    <MenuTitle>🍽️ Cardápio</MenuTitle>
                    {filteredProducts.length > 0 && (
                        <MenuCount>{filteredProducts.length} itens</MenuCount>
                    )}
                </MenuHeader>

                {filteredProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#b2bec3' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
                        <p>Nenhum produto disponível nesta categoria.</p>
                    </div>
                ) : (
                    <ProductGrid>
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </ProductGrid>
                )}
            </AppContainer>

            <FloatingCart onClick={() => setIsCartOpen(true)}>
                <span className="cart-icon">🛒</span>
                {totalItems > 0 && (
                    <FloatingBadge>{totalItems}</FloatingBadge>
                )}
            </FloatingCart>

            <CartDrawer 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
            />
        </>
    );
};

export default ClientLayout;
