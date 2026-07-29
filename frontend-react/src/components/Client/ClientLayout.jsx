import React, { useEffect, useState, useRef } from 'react';
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
//  CATEGORIAS - MENU DE NAVEGAÇÃO
// ============================================================
const CategoryNav = styled.div`
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 8px 0 16px 0;
    margin-bottom: 8px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    
    &::-webkit-scrollbar {
        display: none;
    }
    
    button {
        flex-shrink: 0;
        padding: 6px 16px;
        border: 1.5px solid ${props => props.active ? '#e67e22' : '#dfe6e9'};
        border-radius: 20px;
        background: ${props => props.active ? '#fef9e7' : '#fff'};
        color: ${props => props.active ? '#e67e22' : '#636e72'};
        font-size: 13px;
        font-weight: ${props => props.active ? '600' : '400'};
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        
        &:hover {
            border-color: #e67e22;
            background: #fef9e7;
        }
        
        &:active {
            transform: scale(0.95);
        }
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
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: #e67e22;
    border: 3px solid #fff;
    box-shadow: 
        0 4px 20px rgba(0, 0, 0, 0.5),
        0 0 0 4px rgba(230, 126, 34, 0.3);
    color: #fff;
    font-size: 30px;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    
    .cart-icon {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        line-height: 1;
    }
    
    &:hover {
        transform: scale(1.1) rotate(-8deg);
        box-shadow: 
            0 6px 30px rgba(230, 126, 34, 0.6),
            0 0 0 6px rgba(230, 126, 34, 0.2);
    }
    
    &:active {
        transform: scale(0.92);
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    border: 2px solid #fff;
    animation: pulse 2s infinite;
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;

// ============================================================
//  PRODUCT GRID COM IDENTIFICADOR DE CATEGORIA
// ============================================================
const CategorySection = styled.div`
    margin-bottom: 24px;
    scroll-margin-top: 16px;
`;

const CategoryTitle = styled.h3`
    font-size: 18px;
    font-weight: 600;
    color: #2d3436;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e67e22;
    display: inline-block;
`;

const ProductGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    padding-bottom: 40px;
    
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
    const [categories, setCategories] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('');
    const categoryRefs = useRef({});

    // ============================================================
    //  CARREGAR DADOS - COM ORDENAÇÃO POR DISPLAY_ORDER
    // ============================================================
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
                setConfig(configRes.data.data);
                setProducts(productsRes.data.data || []);
                
                // Buscar categorias com display_order
                const allCategories = categoriesRes.data.data || [];
                
                // Filtrar apenas categorias que têm produtos ativos
                const activeProducts = productsRes.data.data || [];
                const categoryNames = [...new Set(activeProducts.map(p => p.category).filter(Boolean))];
                
                // Filtrar e ORDENAR por display_order
                const filteredCategories = allCategories
                    .filter(c => categoryNames.includes(c.name))
                    .sort((a, b) => (a.display_order || 999) - (b.display_order || 999));
                
                setCategories(filteredCategories);
                
                if (filteredCategories.length > 0) {
                    setActiveCategory(filteredCategories[0].name);
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [tenant]);

    // ============================================================
    //  FUNÇÃO PARA AGRUPAR PRODUTOS POR CATEGORIA (ORDENADO)
    // ============================================================
    const getProductsByCategory = () => {
        const grouped = {};
        const activeProducts = products.filter(p => p.active);
        
        // Primeiro, criar grupos
        activeProducts.forEach(p => {
            const cat = p.category || 'Sem categoria';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(p);
        });
        
        // Ordenar as categorias baseado no display_order do banco
        const sortedCategories = categories
            .filter(c => grouped[c.name])
            .sort((a, b) => (a.display_order || 999) - (b.display_order || 999));
        
        // Criar objeto ordenado
        const orderedGrouped = {};
        sortedCategories.forEach(c => {
            orderedGrouped[c.name] = grouped[c.name];
        });
        
        // Adicionar categorias que não estão na lista do banco (fallback)
        const extraCategories = Object.keys(grouped).filter(
            cat => !categories.some(c => c.name === cat)
        );
        extraCategories.sort();
        extraCategories.forEach(cat => {
            orderedGrouped[cat] = grouped[cat];
        });
        
        return orderedGrouped;
    };

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

    // ============================================================
    //  FUNÇÃO PARA SCROLL ATÉ A CATEGORIA
    // ============================================================
    const scrollToCategory = (categoryName) => {
        setActiveCategory(categoryName);
        const ref = categoryRefs.current[categoryName];
        if (ref) {
            ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const groupedProducts = getProductsByCategory();
    const categoryNames = Object.keys(groupedProducts);

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

                {/* MENU DE CATEGORIAS */}
                {categoryNames.length > 1 && (
                    <CategoryNav>
                        {categoryNames.map(cat => (
                            <button
                                key={cat}
                                active={activeCategory === cat}
                                onClick={() => scrollToCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </CategoryNav>
                )}

                {/* CARDÁPIO POR CATEGORIA */}
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
                    categoryNames.map(cat => (
                        <CategorySection 
                            key={cat} 
                            ref={el => categoryRefs.current[cat] = el}
                        >
                            <CategoryTitle>{cat}</CategoryTitle>
                            <ProductGrid>
                                {groupedProducts[cat].map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </ProductGrid>
                        </CategorySection>
                    ))
                )}
            </Container>

            {/* CARRINHO FLUTUANTE */}
            <FloatingCart onClick={() => setIsCartOpen(true)}>
                <span className="cart-icon">🛒</span>
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