// frontend-react/src/components/Client/ClientLayout.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useCart } from '../../contexts/CartContext';
import { api } from '../../services/api';
import { Badge } from '../Shared/Container';
import ProductCard from './ProductCard';
import CartDrawer from './CartDrawer';

import OrdersHistory from './OrdersHistory';
import TrackOrder from './TrackOrder';

// ============================================================
//  DESIGN SYSTEM / THEME (Delivery & Automation Warm Theme)
// ============================================================
const theme = {
  colors: {
    primary: '#D9531E', // Terracotta/Warm Warm Red (Apetite, moderno)
    primaryHover: '#C04313',
    primaryLight: '#FDF3EF',
    textMain: '#1F2421',
    textMuted: '#60696B',
    textSubtle: '#8C9699',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#E8EBEB',
    borderDark: '#D1D8D8',
    success: '#2E7D32',
    successBg: '#E8F5E9',
    danger: '#D32F2F',
    dangerBg: '#FFEBEE',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    full: '9999px',
  },
  shadows: {
    card: '0px 2px 8px rgba(0, 0, 0, 0.04)',
    floating: '0px 8px 24px rgba(217, 83, 30, 0.25)',
  }
};

// ============================================================
//  STYLED COMPONENTS - MOBILE FIRST
// ============================================================

const AppContainer = styled.div`
  width: 100%;
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 16px 100px 16px;
  box-sizing: border-box;
  background-color: ${props => props.theme.colors.background};
  min-height: 100vh;
`;

const BannerWrapper = styled.div`
  margin: 0 -16px;
  overflow: hidden;
  background-color: ${props => props.theme.colors.border};

  @media (min-width: 768px) {
    margin: 16px 0 0 0;
    border-radius: ${props => props.theme.radius.lg};
  }
`;

const BannerImage = styled.div`
  width: 100%;
  height: 160px;
  background: url(${props => props.$image}) center/cover no-repeat;
  
  @media (min-width: 480px) {
    height: 220px;
  }
  
  @media (min-width: 768px) {
    height: 280px;
  }
`;

const BannerPlaceholder = styled.div`
  width: 100%;
  height: 160px;
  background-color: ${props => props.theme.colors.primaryLight};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: ${props => props.theme.colors.primary};

  @media (min-width: 480px) {
    height: 220px;
    font-size: 26px;
  }
`;

const StoreInfoCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.md};
  padding: 20px;
  margin-top: -24px;
  position: relative;
  z-index: 2;
  box-shadow: ${props => props.theme.shadows.card};
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: 24px;
`;

const StoreHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StoreLogoWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${props => props.theme.radius.md};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  flex-shrink: 0;
  background: ${props => props.theme.colors.surface};
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const LogoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.theme.colors.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
`;

const StoreTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StoreName = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.textMain};
  margin: 0;
  letter-spacing: -0.02em;

  @media (min-width: 480px) {
    font-size: 24px;
  }
`;

const StoreMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const StatusNotice = styled.span`
  font-size: 13px;
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
`;

const StoreHoursInfo = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textMuted};
  padding: 10px 14px;
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.radius.sm};
  border: 1px solid ${props => props.theme.colors.border};
`;

const HighlightTime = styled.strong`
  color: ${props => props.theme.colors.textMain};
  font-weight: 600;
`;

const AddressText = styled.p`
  font-size: 13px;
  color: ${props => props.theme.colors.textMuted};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const OrdersLinkWrapper = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const OrdersLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.textMain};
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  padding: 8px 14px;
  border-radius: ${props => props.theme.radius.sm};
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.primaryLight};
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }
`;

const CategoryTabsWrapper = styled.nav`
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${props => props.theme.colors.background};
  padding: 12px 0;
  margin: 0 -16px 20px -16px;
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryTabsContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 16px;
  width: max-content;
`;

const CategoryTab = styled.button`
  padding: 8px 16px;
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.radius.full};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.$active ? '#FFFFFF' : props.theme.colors.textMuted};
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease-in-out;

  &:hover {
    color: ${props => props.$active ? '#FFFFFF' : props.theme.colors.textMain};
    border-color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.borderDark};
  }
`;

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
`;

const MenuTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.theme.colors.textMain};
  margin: 0;
  letter-spacing: -0.01em;
`;

const MenuCount = styled.span`
  font-size: 13px;
  color: ${props => props.theme.colors.textSubtle};
  font-weight: 500;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  
  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const EmptyStateContainer = styled.div`
  text-align: center;
  padding: 48px 16px;
  color: ${props => props.theme.colors.textSubtle};
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.radius.md};
  border: 1px dashed ${props => props.theme.colors.borderDark};
`;

const FloatingCart = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  height: 52px;
  padding: 0 20px;
  border-radius: ${props => props.theme.radius.full};
  background: ${props => props.theme.colors.primary};
  border: none;
  box-shadow: ${props => props.theme.shadows.floating};
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    transform: translateY(-2px);
    background-color: ${props => props.theme.colors.primaryHover};
  }

  &:active {
    transform: translateY(0);
  }
`;

const FloatingBadge = styled.span`
  background: #FFFFFF;
  color: ${props => props.theme.colors.primary};
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: ${props => props.theme.radius.full};
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
    const [storeStatus, setStoreStatus] = useState(null);
    const [operatingHours, setOperatingHours] = useState([]);

    const _forceComponents = [OrdersHistory, TrackOrder];

    if (!tenant && !tenantLoading) {
        return (
            <ThemeProvider theme={theme}>
                <AppContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EmptyStateContainer style={{ maxWidth: 400 }}>
                        <h1 style={{ fontSize: 22, color: theme.colors.textMain, marginBottom: 8 }}>Smart Delivery</h1>
                        <p style={{ fontSize: 14, margin: 0 }}>Para acessar um restaurante, informe o subdomínio correto na URL.</p>
                    </EmptyStateContainer>
                </AppContainer>
            </ThemeProvider>
        );
    }

    useEffect(() => {
        if (!tenant) return;

        const loadData = async () => {
            try {
                setIsLoading(true);
                const [configRes, productsRes, categoriesRes, statusRes, hoursRes] = await Promise.all([
                    api.get('/config'),
                    api.get('/products?active_only=true'),
                    api.get('/categories'),
                    api.get('/store/status'),
                    api.get('/operating-hours')
                ]);

                const productsData = productsRes.data.data || [];
                const categoriesData = categoriesRes.data.data || [];

                setConfig(configRes.data.data);
                setProducts(productsData);
                setStoreStatus(statusRes.data.data);
                setOperatingHours(hoursRes.data.data || []);

                if (statusRes.data.success) {
                    setIsOpen(statusRes.data.data.is_open);
                }

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
        if (!tenant) return;

        const checkStatus = async () => {
            try {
                const response = await api.get('/store/status');
                if (response.data.success) {
                    setIsOpen(response.data.data.is_open);
                    setStoreStatus(response.data.data);
                }
            } catch (error) {
                console.error('Erro ao verificar status:', error);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, [tenant]);

    useEffect(() => {
        if (activeCategory) {
            setFilteredProducts(products.filter(p => p.category === activeCategory));
        } else {
            setFilteredProducts(products);
        }
    }, [activeCategory, products]);

    const scrollToCategory = (category) => {
        setActiveCategory(category);
        const element = document.getElementById(`category-${category}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const getTodayHours = () => {
        const today = new Date().getDay();
        return operatingHours.find(h => h.day_of_week === today);
    };

    const todayHours = getTodayHours();

    if (tenantLoading || (isLoading && !config)) {
        return <div style={{ padding: 40, textAlign: 'center', color: '#8C9699' }}>Carregando cardápio...</div>;
    }

    const hasBanner = !!config?.banner_image;
    const storeName = config?.store_name || 'Restaurante';
    const logoImage = config?.logo_image;

    return (
        <ThemeProvider theme={theme}>
            <AppContainer>
                <BannerWrapper>
                    {hasBanner ? (
                        <BannerImage $image={config.banner_image} />
                    ) : (
                        <BannerPlaceholder>
                            {storeName}
                        </BannerPlaceholder>
                    )}
                </BannerWrapper>

                <StoreInfoCard>
                    <StoreHeader>
                        <StoreLogoWrapper>
                            {logoImage ? (
                                <LogoImage src={logoImage} alt={storeName} />
                            ) : (
                                <LogoPlaceholder>🍽️</LogoPlaceholder>
                            )}
                        </StoreLogoWrapper>
                        <StoreTitleGroup>
                            <StoreName>{storeName}</StoreName>
                        </StoreTitleGroup>
                    </StoreHeader>

                    <StoreMeta>
                        <StatusRow>
                            <Badge status={isOpen ? 'open' : 'closed'}>
                                {isOpen ? 'Aberto agora' : 'Fechado'}
                            </Badge>
                            {!isOpen && (
                                <StatusNotice>
                                    Agendamento disponível
                                </StatusNotice>
                            )}
                            {storeStatus?.reason && (
                                <span style={{ fontSize: '13px', color: theme.colors.textSubtle }}>
                                    ({storeStatus.reason})
                                </span>
                            )}
                        </StatusRow>

                        {todayHours && (
                            <StoreHoursInfo>
                                {todayHours.is_open ? (
                                    <>
                                        Horário de hoje: <HighlightTime>{todayHours.open_time?.substring(0, 5)}</HighlightTime> às <HighlightTime>{todayHours.close_time?.substring(0, 5)}</HighlightTime>
                                    </>
                                ) : (
                                    <span>Fechado hoje</span>
                                )}
                            </StoreHoursInfo>
                        )}

                        {config?.store_address && (
                            <AddressText>📍 {config.store_address}</AddressText>
                        )}
                    </StoreMeta>

                    <OrdersLinkWrapper>
                        <OrdersLink to={`/verify-orders?tenant=${tenant}`}>
                            <span>📋</span> Meus Pedidos
                        </OrdersLink>
                    </OrdersLinkWrapper>
                </StoreInfoCard>

                {categories.length > 0 && (
                    <CategoryTabsWrapper>
                        <CategoryTabsContainer>
                            {categories.map(cat => (
                                <CategoryTab
                                    key={cat}
                                    $active={activeCategory === cat}
                                    onClick={() => scrollToCategory(cat)}
                                >
                                    {cat}
                                </CategoryTab>
                            ))}
                        </CategoryTabsContainer>
                    </CategoryTabsWrapper>
                )}

                <MenuHeader>
                    <MenuTitle>Cardápio</MenuTitle>
                    {filteredProducts.length > 0 && (
                        <MenuCount>{filteredProducts.length} itens disponíveis</MenuCount>
                    )}
                </MenuHeader>

                {filteredProducts.length === 0 ? (
                    <EmptyStateContainer>
                        <p>Nenhum produto disponível nesta categoria no momento.</p>
                    </EmptyStateContainer>
                ) : (
                    <ProductGrid>
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </ProductGrid>
                )}

                <FloatingCart onClick={() => setIsCartOpen(true)}>
                    <span>Ver Carrinho</span>
                    {totalItems > 0 && (
                        <FloatingBadge>{totalItems}</FloatingBadge>
                    )}
                </FloatingCart>

                <CartDrawer
                    isOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                />
            </AppContainer>
        </ThemeProvider>
    );
};

export default ClientLayout;