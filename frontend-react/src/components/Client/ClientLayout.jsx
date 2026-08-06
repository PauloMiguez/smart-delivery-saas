// frontend-react/src/components/Client/ClientLayout.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useCart } from '../../contexts/CartContext';
import { api } from '../../services/api';
import { Badge } from '../Shared/Container';
import ProductCard from './ProductCard';
import CartDrawer from './CartDrawer';

// Forçar carregamento dos componentes de pedidos (evita tree-shaking)
import OrdersHistory from './OrdersHistory';
import TrackOrder from './TrackOrder';

// ============================================================
// 🎨 DESIGN SYSTEM TOKENS (THEME)
// ============================================================
const theme = {
  colors: {
    // Neutral Palette (Cool Slate Neutrals)
    bgPrimary: '#FAFAFB',
    bgSurface: '#FFFFFF',
    bgSubtle: '#F1F5F9',
    bgMuted: '#E2E8F0',
    
    // Text Hierarchy
    textPrimary: '#0F172A',   // Slate 900 (Sem preto puro)
    textSecondary: '#475569', // Slate 600
    textMuted: '#94A3B8',     // Slate 400
    
    // Accent Color (Uso ultra-moderado)
    accent: '#D97706',        // Amber/Warm Rust
    accentHover: '#B45309',
    accentLight: '#FEF3C7',
    
    // Borders & Lines
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    
    // Status Indicators
    success: '#059669',
    successBg: '#ECFDF5',
    error: '#DC2626',
    errorBg: '#FEF2F2',
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { size: '1.5rem', height: '1.25', weight: '700' },     // 24px
    h2: { size: '1.25rem', height: '1.3', weight: '600' },     // 20px
    body: { size: '0.875rem', height: '1.5', weight: '400' },   // 14px
    caption: { size: '0.75rem', height: '1.4', weight: '500' }, // 12px
  },
  spacing: (factor) => `${factor * 8}px`, // Sistema de 8px
  radii: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 3px 0 rgba(15, 23, 42, 0.03), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
    card: '0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 2px 4px -2px rgba(15, 23, 42, 0.02)',
    floating: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }
};

// Global styles injected for typography optimization
const GlobalStyles = createGlobalStyle`
  body {
    background-color: ${({ theme }) => theme.colors.bgPrimary};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
  }
`;

// ============================================================
// 🧩 STYLED COMPONENTS
// ============================================================

const AppContainer = styled.div`
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(10)} ${({ theme }) => theme.spacing(2)};
  box-sizing: border-box;

  @media (min-width: 768px) {
    padding: 0 ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(10)} ${({ theme }) => theme.spacing(4)};
  }
`;

// Banner Section
const BannerWrapper = styled.header`
  margin: 0 -${({ theme }) => theme.spacing(2)};
  position: relative;
  overflow: hidden;
  
  @media (min-width: 768px) {
    margin: ${({ theme }) => theme.spacing(2)} 0 0 0;
    border-radius: ${({ theme }) => theme.radii.lg};
  }
`;

const BannerImage = styled.div`
  width: 100%;
  height: 180px;
  background-image: url(${props => props.$image});
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: ${({ theme }) => theme.colors.bgSubtle};
  
  @media (min-width: 600px) {
    height: 240px;
  }
`;

const BannerPlaceholder = styled.div`
  width: 100%;
  height: 180px;
  background-color: ${({ theme }) => theme.colors.bgSubtle};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.h1.size};
  font-weight: ${({ theme }) => theme.typography.h1.weight};
  color: ${({ theme }) => theme.colors.textSecondary};
  letter-spacing: -0.02em;

  @media (min-width: 600px) {
    height: 240px;
  }
`;

// Store Info Card
const StoreInfoCard = styled.section`
  background: ${({ theme }) => theme.colors.bgSurface};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing(3)};
  margin-top: -${({ theme }) => theme.spacing(4)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
  position: relative;
  z-index: 2;
  box-shadow: ${({ theme }) => theme.shadows.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const StoreHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StoreName = styled.h1`
  font-size: ${({ theme }) => theme.typography.h1.size};
  line-height: ${({ theme }) => theme.typography.h1.height};
  font-weight: ${({ theme }) => theme.typography.h1.weight};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const LogoImage = styled.img`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  object-fit: cover;
  background: ${({ theme }) => theme.colors.bgSurface};
`;

const LogoPlaceholder = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
`;

const StoreMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  flex-wrap: wrap;
  font-size: ${({ theme }) => theme.typography.body.size};
  color: ${({ theme }) => theme.colors.textSecondary};

  .address {
    font-size: ${({ theme }) => theme.typography.caption.size};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const StoreHoursInfo = styled.div`
  font-size: ${({ theme }) => theme.typography.caption.size};
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.colors.bgSubtle};
  border-radius: ${({ theme }) => theme.radii.sm};

  .highlight {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: 600;
  }
`;

const OrdersLinkWrapper = styled.div`
  margin-top: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(2)};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const OrdersLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.body.size};
  font-weight: 600;
  text-decoration: none;
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(1.5)}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSurface};
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.bgSubtle};
    border-color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`;

// Categories Horizontal Navigation
const CategoryTabsWrapper = styled.nav`
  overflow-x: auto;
  padding: ${({ theme }) => `${theme.spacing(1)} 0 ${theme.spacing(2)} 0`};
  margin: 0 -${({ theme }) => theme.spacing(2)};
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-right: ${({ theme }) => theme.spacing(2)};
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryTabsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  width: max-content;
`;

const CategoryTab = styled.button`
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(2.5)}`};
  border: 1px solid ${props => props.$active ? props.theme.colors.textPrimary : props.theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${props => props.$active ? props.theme.colors.textPrimary : props.theme.colors.bgSurface};
  color: ${props => props.$active ? props.theme.colors.bgSurface : props.theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.body.size};
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  white-space: nowrap;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: ${({ theme }) => theme.colors.textPrimary};
    color: ${props => props.$active ? props.theme.colors.bgSurface : props.theme.colors.textPrimary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`;

// Menu Section
const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing(2)} 0 ${theme.spacing(1.5)} 0`};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const MenuTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.h2.size};
  font-weight: ${({ theme }) => theme.typography.h2.weight};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  letter-spacing: -0.01em;
`;

const MenuCount = styled.span`
  font-size: ${({ theme }) => theme.typography.caption.size};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 500;
`;

const ProductGrid = styled.main`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing(2)};
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 960px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

// Floating Cart Button
const FloatingCart = styled.button`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing(3)};
  right: ${({ theme }) => theme.spacing(3)};
  height: 52px;
  padding: 0 ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.textPrimary};
  color: ${({ theme }) => theme.colors.bgSurface};
  border: none;
  box-shadow: ${({ theme }) => theme.shadows.floating};
  font-size: ${({ theme }) => theme.typography.body.size};
  font-weight: 600;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  z-index: 99;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};

  &:hover {
    transform: translateY(-2px);
    background: ${({ theme }) => theme.colors.textSecondary};
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`;

const FloatingBadge = styled.span`
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.bgSurface};
  font-size: ${({ theme }) => theme.typography.caption.size};
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radii.full};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => `${theme.spacing(6)} 0`};
  color: ${({ theme }) => theme.colors.textMuted};
  
  p {
    margin-top: ${({ theme }) => theme.spacing(1)};
    font-size: ${({ theme }) => theme.typography.body.size};
  }
`;

// ============================================================
// 🚀 COMPONENTE PRINCIPAL
// ============================================================
const ClientLayoutContent = () => {
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
      <EmptyState style={{ maxWidth: 480, margin: '60px auto' }}>
        <StoreName style={{ justifyContent: 'center', marginBottom: 12 }}>Smart Delivery</StoreName>
        <p>Informe um subdomínio válido para continuar.</p>
      </EmptyState>
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
    return <EmptyState><p>Carregando cardápio...</p></EmptyState>;
  }

  const hasBanner = !!config?.banner_image;
  const storeName = config?.store_name || 'Restaurante';
  const logoImage = config?.logo_image;

  return (
    <>
      <AppContainer>
        <BannerWrapper>
          {hasBanner ? (
            <BannerImage $image={config.banner_image} />
          ) : (
            <BannerPlaceholder>{storeName}</BannerPlaceholder>
          )}
        </BannerWrapper>

        <StoreInfoCard>
          <StoreHeader>
            {logoImage ? (
              <LogoImage src={logoImage} alt={storeName} />
            ) : (
              <LogoPlaceholder>🍽️</LogoPlaceholder>
            )}
            <StoreName>{storeName}</StoreName>
          </StoreHeader>

          <StoreMeta>
            <MetaRow>
              <Badge status={isOpen ? 'open' : 'closed'}>
                {isOpen ? 'Aberto agora' : 'Fechado'}
              </Badge>
              {storeStatus?.reason && (
                <span className="address">• {storeStatus.reason}</span>
              )}
            </MetaRow>

            {todayHours && (
              <StoreHoursInfo>
                {todayHours.is_open ? (
                  <>
                    Horário hoje: <span className="highlight">
                      {todayHours.open_time?.substring(0, 5)} - {todayHours.close_time?.substring(0, 5)}
                    </span>
                  </>
                ) : (
                  <span>Fechado hoje</span>
                )}
              </StoreHoursInfo>
            )}

            {config?.store_address && (
              <MetaRow>
                <span className="address">{config.store_address}</span>
              </MetaRow>
            )}
          </StoreMeta>

          <OrdersLinkWrapper>
            <OrdersLink to={`/verify-orders?tenant=${tenant}`}>
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
            <MenuCount>{filteredProducts.length} itens</MenuCount>
          )}
        </MenuHeader>

        {filteredProducts.length === 0 ? (
          <EmptyState>
            <p>Nenhum item disponível nesta categoria.</p>
          </EmptyState>
        ) : (
          <ProductGrid>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>
        )}
      </AppContainer>

      <FloatingCart onClick={() => setIsCartOpen(true)} aria-label="Ver Carrinho">
        <span>Carrinho</span>
        {totalItems > 0 && <FloatingBadge>{totalItems}</FloatingBadge>}
      </FloatingCart>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
};

export default function ClientLayout() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <ClientLayoutContent />
    </ThemeProvider>
  );
}