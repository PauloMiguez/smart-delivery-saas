import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { playNewOrderSound, playNotificationSound } from '../../utils/notificationSound';
import { tokens } from '../../styles/tokens';
import {
    AdminContainer,
    Sidebar,
    SidebarBrand,
    NavItem,
    MainContent,
    PageHeader,
    StatsGrid,
    StatCard,
    TableWrapper,
    Table,
    Badge,
    ActionButton,
    MobileToggle,
    Overlay,
    ProductsContainer,
    OrdersContainer,
    ActionContainer,
    MobileOrderCard,
    MobileOrderRow,
    MobileItemsList,
    MobileActions
} from './AdminLayout.styled';

// ============================================================
//  IMPORTS LAZY
// ============================================================
const Dashboard = lazy(() => import('./Dashboard'));
const Products = lazy(() => import('./Products'));
const Categories = lazy(() => import('./Categories'));
const Orders = lazy(() => import('./Orders'));
const Config = lazy(() => import('./Config'));
const OperatingHours = lazy(() => import('./OperatingHours'));
const ProductModal = lazy(() => import('./ProductModal'));
const CategoryModal = lazy(() => import('./CategoryModal'));
const OrderTrackingModal = lazy(() => import('./OrderTrackingModal'));
const DeliverySettings = lazy(() => import('./DeliverySettings'));

// ============================================================
//  COMPONENT LOADER
// ============================================================
const ComponentLoader = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 20px',
        minHeight: '200px'
    }}>
        <div style={{
            width: 36,
            height: 36,
            border: '3px solid #e8ebeb',
            borderTop: `3px solid ${tokens.colors.accent}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

// ============================================================
//  STYLED COMPONENTS ADICIONAIS
// ============================================================
const AuthLoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: ${tokens.typography.fontFamily};
  font-size: ${tokens.typography.fontSize.base};
  color: ${tokens.colors.textSecondary};
  background: ${tokens.colors.background};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: ${tokens.typography.fontFamily};
  font-size: ${tokens.typography.fontSize.base};
  color: ${tokens.colors.textSecondary};
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: ${tokens.typography.fontFamily};
  font-size: ${tokens.typography.fontSize.base};
  color: ${tokens.colors.error};
  padding: ${tokens.spacing.lg};
  text-align: center;
`;

// ============================================================
//  ADMIN LAYOUT
// ============================================================
const AdminLayout = () => {
    const navigate = useNavigate();
    const { tenant, loading: tenantLoading } = useTenant();
    const { showToast } = useToast();

    // ============================================================
    //  TODOS OS HOOKS PRIMEIRO
    // ============================================================
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [unreadOrders, setUnreadOrders] = useState(0);
    const [socket, setSocket] = useState(null);
    const [socketStatus, setSocketStatus] = useState('desconectado');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ search: '', category: '', status: '' });
    const [period, setPeriod] = useState('today');
    const [salesData, setSalesData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [lastUpdate, setLastUpdate] = useState('');
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [trackingModalOpen, setTrackingModalOpen] = useState(false);
    const [trackingOrderId, setTrackingOrderId] = useState(null);
    const [trackingToken, setTrackingToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // ============================================================
    //  HOOKS DE EFEITO
    // ============================================================

    // 1. Verificação de autenticação
    useEffect(() => {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenant') || tenant;

        console.log('🔐 Verificando autenticação no Admin...');
        console.log('🔑 Token:', token ? 'presente' : 'ausente');
        console.log('🏷️ Tenant:', tenantId);

        if (!token || !tenantId) {
            console.log('❌ Não autenticado - Redirecionando para login');
            navigate(`/login?tenant=${tenantId || ''}`);
            setAuthChecked(true);
            return;
        }

        setIsAuthenticated(true);
        setAuthChecked(true);
    }, [navigate, tenant]);

    // 2. Carregar dados
    const loadData = useCallback(async () => {
        if (!isAuthenticated || !tenant) return;
        try {
            console.log('📊 Carregando dados do admin...');
            const [statsRes, productsRes, categoriesRes, ordersRes] = await Promise.all([
                api.get('/stats/orders'),
                api.get('/products'),
                api.get('/categories'),
                api.get('/orders')
            ]);
            setStats(statsRes.data.data);
            setProducts(productsRes.data.data || []);
            setFilteredProducts(productsRes.data.data || []);
            setCategories(categoriesRes.data.data || []);
            setOrders(ordersRes.data.data || []);
            setCurrentPage(1);
            console.log('✅ Dados carregados!');
        } catch (error) {
            console.error('❌ Erro ao carregar dados do admin:', error);
            showToast('Erro ao carregar dados.', 'error');
        }
    }, [isAuthenticated, tenant, showToast]);

    useEffect(() => {
        if (authChecked && isAuthenticated && tenant) {
            loadData();
        }
    }, [authChecked, isAuthenticated, tenant, loadData]);

    // 3. Dashboard data
    const loadDashboardData = useCallback(async (selectedPeriod) => {
        if (!isAuthenticated || !tenant) return;
        setDashboardLoading(true);
        try {
            console.log('📊 Carregando dados do dashboard para período:', selectedPeriod);
            const response = await api.get(`/stats/dashboard?period=${selectedPeriod}`);
            if (response.data.success) {
                const data = response.data.data;
                setSalesData(data.salesData || []);
                setStatusData(data.statusData || []);
                setTopProducts(data.topProducts || []);
                setLastUpdate(new Date().toLocaleString('pt-BR'));
                console.log('✅ Dados do dashboard carregados!');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados do dashboard:', error);
            showToast('Erro ao carregar dados do dashboard', 'error');
        } finally {
            setDashboardLoading(false);
        }
    }, [isAuthenticated, tenant, showToast]);

    useEffect(() => {
        if (activeTab === 'dashboard' && authChecked && isAuthenticated && tenant) {
            loadDashboardData(period);
        }
    }, [activeTab, tenant, period, loadDashboardData, authChecked, isAuthenticated]);

    // 4. WebSocket
    useEffect(() => {
        if (!isAuthenticated || !tenant) {
            console.log('⏳ Aguardando autenticação para conectar socket...');
            return;
        }

        console.log('🔌 Inicializando socket para tenant:', tenant);
        const token = localStorage.getItem('token');
        console.log('🔑 Token presente:', !!token);

        const socketInstance = connectSocket(token);
        setSocket(socketInstance);

        if (socketInstance) {
            socketInstance.on('connect', () => {
                console.log('✅ Socket conectado ao servidor!');
                setSocketStatus('conectado');
            });

            socketInstance.on('disconnect', () => {
                console.log('⚠️ Socket desconectado');
                setSocketStatus('desconectado');
            });

            socketInstance.on('connect_error', (error) => {
                console.error('❌ Erro na conexão socket:', error);
                setSocketStatus('erro');
            });

            socketInstance.on('new-order-notification', (data) => {
                console.log('🔔🔔🔔 NOVO PEDIDO RECEBIDO!', data);
                playNewOrderSound();
                showToast(
                    `🆕 NOVO PEDIDO #${data.order.orderNumber} - ${data.order.customer_name}`,
                    'success'
                );
                setUnreadOrders(prev => prev + 1);
                loadData();
                if (activeTab === 'orders') {
                    loadData();
                }
            });

            socketInstance.on('order-updated', (data) => {
                console.log('📦 Pedido atualizado:', data);
                if (data.action === 'status_change') {
                    playNotificationSound();
                    showToast(
                        `📦 Pedido #${data.order.orderNumber} atualizado para: ${data.order.status}`,
                        'info'
                    );
                    loadData();
                    if (activeTab === 'orders') loadData();
                }
            });
        } else {
            console.error('❌ Falha ao criar socket instance');
        }

        return () => {
            console.log('🔌 Desconectando socket...');
            disconnectSocket();
            setSocketStatus('desconectado');
        };
    }, [isAuthenticated, tenant, showToast, loadData, activeTab]);

    // 5. Reset unread orders
    useEffect(() => {
        if (activeTab === 'orders') {
            setUnreadOrders(0);
        }
    }, [activeTab]);

    // 6. Filtros
    useEffect(() => {
        applyFilters();
    }, [products, filters]);

    useEffect(() => {
        setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage) || 1);
        if (currentPage > Math.ceil(filteredProducts.length / itemsPerPage)) {
            setCurrentPage(1);
        }
    }, [filteredProducts, itemsPerPage]);

    // ============================================================
    //  FUNÇÃO applyFilters
    // ============================================================
    const applyFilters = () => {
        let filtered = [...products];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                (p.description && p.description.toLowerCase().includes(searchLower))
            );
        }

        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category);
        }

        if (filters.status) {
            if (filters.status === 'active') {
                filtered = filtered.filter(p => p.active === 1 || p.active === true);
            } else if (filters.status === 'inactive') {
                filtered = filtered.filter(p => p.active === 0 || p.active === false);
            }
        }

        setFilteredProducts(filtered);
        setCurrentPage(1);
    };

    // ============================================================
    //  CONDICIONAIS
    // ============================================================
    if (!authChecked) {
        return (
            <AuthLoadingContainer>
                Verificando autenticação...
            </AuthLoadingContainer>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (tenantLoading) {
        return (
            <LoadingContainer>
                Carregando tenant...
            </LoadingContainer>
        );
    }

    if (!tenant) {
        return (
            <ErrorContainer>
                Tenant não encontrado
            </ErrorContainer>
        );
    }

    // ============================================================
    //  HANDLERS
    // ============================================================
    const handleFilter = (newFilters) => {
        setFilters(newFilters);
    };

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
    };

    const handleRefresh = () => {
        loadDashboardData(period);
        loadData();
        showToast('📊 Dashboard atualizado!', 'success');
    };

    const openTrackingModal = (orderId, token) => {
        setTrackingOrderId(orderId);
        setTrackingToken(token);
        setTrackingModalOpen(true);
    };

    const getCurrentItems = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredProducts.slice(startIndex, endIndex);
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        const productList = document.querySelector('.products-admin');
        if (productList) {
            productList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // === PRODUTOS ===
    const handleSaveProduct = async (productData) => {
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, productData);
                showToast('Produto atualizado com sucesso!', 'success');
            } else {
                await api.post('/products', productData);
                showToast('Produto criado com sucesso!', 'success');
            }
            await loadData();
            setEditingProduct(null);
            setIsProductModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            showToast('Erro ao salvar produto.', 'error');
            throw error;
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Tem certeza que deseja remover este produto?')) return;
        try {
            const product = products.find(p => p.id === id);
            if (product?.image_url) {
                try {
                    const urlParts = product.image_url.split('/');
                    const filename = urlParts[urlParts.length - 1].split('.')[0];
                    const folder = urlParts[urlParts.length - 2];
                    const publicId = `${folder}/${filename}`;
                    await api.post('/upload/delete', { public_id: publicId, config_key: null });
                    console.log('🗑️ Imagem deletada do Cloudinary');
                } catch (imgError) {
                    console.warn('⚠️ Erro ao deletar imagem do Cloudinary:', imgError);
                }
            }
            await api.delete(`/products/${id}`);
            showToast('Produto removido com sucesso!', 'success');
            await loadData();
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            showToast('Erro ao deletar produto.', 'error');
        }
    };

    // === CATEGORIAS ===
    const handleSaveCategory = async (categoryData) => {
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, categoryData);
                showToast('Categoria atualizada com sucesso!', 'success');
            } else {
                await api.post('/categories', categoryData);
                showToast('Categoria criada com sucesso!', 'success');
            }
            await loadData();
            setEditingCategory(null);
            setIsCategoryModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar categoria:', error);
            showToast('Erro ao salvar categoria.', 'error');
            throw error;
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('Tem certeza que deseja remover esta categoria?')) return;
        try {
            await api.delete(`/categories/${id}`);
            showToast('Categoria removida com sucesso!', 'success');
            await loadData();
        } catch (error) {
            console.error('Erro ao deletar categoria:', error);
            showToast('Erro ao deletar categoria.', 'error');
        }
    };

    // === PEDIDOS ===
    const updateOrderStatus = async (orderId, status) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status });
            await loadData();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            showToast('Erro ao atualizar status do pedido.', 'error');
        }
    };

    // ============================================================
    //  NAVEGAÇÃO
    // ============================================================
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'products', label: 'Produtos', icon: '📦' },
        { id: 'categories', label: 'Categorias', icon: '🏷️' },
        { id: 'orders', label: 'Pedidos', icon: '📋' },
        { id: 'hours', label: 'Horários', icon: '🕐' },
        { id: 'delivery', label: 'Taxa de Entrega', icon: '🚚' },
        { id: 'config', label: 'Configurações', icon: '⚙️' }
    ];

    const currentItems = getCurrentItems();

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <Suspense fallback={<ComponentLoader />}>
                        <Dashboard
                            period={period}
                            onPeriodChange={handlePeriodChange}
                            onRefresh={handleRefresh}
                            lastUpdate={lastUpdate}
                            loading={dashboardLoading}
                            stats={stats}
                            salesData={salesData}
                            statusData={statusData}
                            topProducts={topProducts}
                            orders={orders}
                        />
                    </Suspense>
                );
            case 'products':
                return (
                    <Suspense fallback={<ComponentLoader />}>
                        <Products
                            products={products}
                            filteredProducts={filteredProducts}
                            categories={categories}
                            currentItems={currentItems}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            onFilter={handleFilter}
                            onAddProduct={() => {
                                setEditingProduct(null);
                                setIsProductModalOpen(true);
                            }}
                            onEditProduct={(product) => {
                                setEditingProduct(product);
                                setIsProductModalOpen(true);
                            }}
                            onDeleteProduct={handleDeleteProduct}
                        />
                    </Suspense>
                );
            case 'categories':
                return (
                    <Suspense fallback={<ComponentLoader />}>
                        <Categories
                            categories={categories}
                            onAddCategory={() => {
                                setEditingCategory(null);
                                setIsCategoryModalOpen(true);
                            }}
                            onEditCategory={(category) => {
                                setEditingCategory(category);
                                setIsCategoryModalOpen(true);
                            }}
                            onDeleteCategory={handleDeleteCategory}
                        />
                    </Suspense>
                );
            case 'orders':
                return (
                    <Suspense fallback={<ComponentLoader />}>
                        <Orders
                            orders={orders}
                            unreadOrders={unreadOrders}
                            onUpdateStatus={updateOrderStatus}
                            onOpenTracking={openTrackingModal}
                            onRefresh={loadData}
                        />
                    </Suspense>
                );
            case 'hours':
                return (
                    <Suspense fallback={<ComponentLoader />}>
                        <OperatingHours />
                    </Suspense>
                );
            case 'delivery':
                return (
                    <Suspense fallback={<ComponentLoader />}>
                        <DeliverySettings />
                    </Suspense>
                );
            case 'config':
                return (
                    <Suspense fallback={<ComponentLoader />}>
                        <Config />
                    </Suspense>
                );
            default:
                return <div>Página não encontrada</div>;
        }
    };

    return (
        <AdminContainer>
            <Overlay $open={sidebarOpen} onClick={() => setSidebarOpen(false)} />
            <Sidebar $open={sidebarOpen}>
                <SidebarBrand>
                    <h1>⚙️ <span>Smart</span>Delivery</h1>
                    <p>Painel Administrativo</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                        🏷️ {tenant}
                    </p>
                    <p style={{
                        fontSize: '11px',
                        color: socketStatus === 'conectado' ? '#2e7d32' : '#d32f2f',
                        marginTop: '4px'
                    }}>
                        {socketStatus === 'conectado' ? '🟢 Online' : '🔴 Offline'}
                    </p>
                </SidebarBrand>
                {navItems.map(item => (
                    <NavItem
                        key={item.id}
                        $active={activeTab === item.id}
                        onClick={() => {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                        }}
                    >
                        <span className="icon">{item.icon}</span>
                        {item.label}
                        {item.id === 'orders' && unreadOrders > 0 && (
                            <span style={{
                                background: tokens.colors.error,
                                color: '#fff',
                                borderRadius: '50%',
                                padding: '2px 8px',
                                fontSize: '11px',
                                marginLeft: 'auto'
                            }}>
                                {unreadOrders}
                            </span>
                        )}
                    </NavItem>
                ))}
            </Sidebar>
            <MainContent>
                <PageHeader>
                    <h2>
                        {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                        {activeTab === 'orders' && unreadOrders > 0 && (
                            <span style={{
                                fontSize: '14px',
                                color: tokens.colors.error,
                                marginLeft: '12px',
                                fontWeight: 'normal'
                            }}>
                                ({unreadOrders} novos)
                            </span>
                        )}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontSize: '12px',
                            color: socketStatus === 'conectado' ? '#2e7d32' : '#d32f2f'
                        }}>
                            {socketStatus === 'conectado' ? '🟢 Online' : '🔴 Offline'}
                        </span>
                        <MobileToggle onClick={() => setSidebarOpen(true)}>
                            ☰
                        </MobileToggle>
                    </div>
                </PageHeader>
                {renderTabContent()}
            </MainContent>
            <Suspense fallback={null}>
                {isProductModalOpen && (
                    <ProductModal
                        isOpen={isProductModalOpen}
                        onClose={() => {
                            setIsProductModalOpen(false);
                            setEditingProduct(null);
                        }}
                        onSave={handleSaveProduct}
                        product={editingProduct}
                        categories={categories}
                    />
                )}
            </Suspense>
            <Suspense fallback={null}>
                {isCategoryModalOpen && (
                    <CategoryModal
                        isOpen={isCategoryModalOpen}
                        onClose={() => {
                            setIsCategoryModalOpen(false);
                            setEditingCategory(null);
                        }}
                        onSave={handleSaveCategory}
                        category={editingCategory}
                    />
                )}
            </Suspense>
            <Suspense fallback={null}>
                {trackingModalOpen && (
                    <OrderTrackingModal
                        isOpen={trackingModalOpen}
                        onClose={() => {
                            setTrackingModalOpen(false);
                            setTrackingOrderId(null);
                            setTrackingToken(null);
                        }}
                        orderId={trackingOrderId}
                        token={trackingToken}
                    />
                )}
            </Suspense>
        </AdminContainer>
    );
};

export default AdminLayout;