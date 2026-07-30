import React, { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { playNewOrderSound, playNotificationSound } from '../../utils/notificationSound';
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
import ProductModal from './ProductModal';
import CategoryModal from './CategoryModal';
import Config from './Config';
import ProductFilters from './ProductFilters';
import Pagination from '../Shared/Pagination';
// ============================================================
//  IMPORTS DO DASHBOARD
// ============================================================
import {
    SalesLineChart,
    OrderStatusPieChart,
    TopProductsChart,
    MetricCard
} from './Dashboard/SalesChart';
import RecentOrders from './Dashboard/RecentOrders';
import FilterBar from './Dashboard/FilterBar';

const AdminLayout = () => {
    const { tenant, loading } = useTenant();
    const { showToast } = useToast();
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
    
    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Filtros
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        status: ''
    });

    // ============================================================
    //  DASHBOARD - ESTADOS
    // ============================================================
    const [period, setPeriod] = useState('today');
    const [salesData, setSalesData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [lastUpdate, setLastUpdate] = useState('');
    const [dashboardLoading, setDashboardLoading] = useState(false);

    // ============================================================
    //  CARREGAR DADOS
    // ============================================================
    const loadData = async () => {
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
    };

    useEffect(() => {
        if (!tenant) return;
        loadData();
    }, [tenant]);

    // ============================================================
    //  WEBSOCKET - NOTIFICAÇÕES EM TEMPO REAL
    // ============================================================
    useEffect(() => {
        if (!tenant) {
            console.log('⏳ Aguardando tenant para conectar socket...');
            return;
        }
        
        console.log('🔌 Inicializando socket para tenant:', tenant);
        const token = localStorage.getItem('token');
        console.log('🔑 Token presente:', !!token);
        
        const socketInstance = connectSocket(token);
        console.log('📡 Socket instance:', socketInstance ? 'criada' : 'falhou');
        setSocket(socketInstance);

        if (socketInstance) {
            socketInstance.on('connect', () => {
                console.log('✅ Socket conectado ao servidor!');
                setSocketStatus('conectado');
                showToast('🔌 Conectado ao servidor de notificações', 'success');
            });

            socketInstance.on('disconnect', () => {
                console.log('⚠️ Socket desconectado');
                setSocketStatus('desconectado');
            });

            socketInstance.on('connect_error', (error) => {
                console.error('❌ Erro na conexão socket:', error);
                setSocketStatus('erro');
            });

            // ============================================================
            //  NOVO PEDIDO - NOTIFICAÇÃO
            // ============================================================
            socketInstance.on('new-order-notification', (data) => {
                console.log('🔔🔔🔔 NOVO PEDIDO RECEBIDO!', data);
                
                // Tocar som de novo pedido
                playNewOrderSound();
                
                // Mostrar toast
                showToast(
                    `🆕 NOVO PEDIDO #${data.order.orderNumber} - ${data.order.customer_name}`,
                    'success'
                );
                
                // Atualizar contador
                setUnreadOrders(prev => prev + 1);
                
                // Recarregar dados
                loadData();
                loadDashboardData(period);
                
                // Se estiver na aba de pedidos, recarregar
                if (activeTab === 'orders') {
                    loadData();
                }
            });

            // ============================================================
            //  ATUALIZAÇÃO DE STATUS - NOTIFICAÇÃO
            // ============================================================
            socketInstance.on('order-updated', (data) => {
                console.log('📦 Pedido atualizado:', data);
                if (data.action === 'status_change') {
                    playNotificationSound();
                    showToast(
                        `📦 Pedido #${data.order.orderNumber} atualizado para: ${data.order.status}`,
                        'info'
                    );
                    loadData();
                    loadDashboardData(period);
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
    }, [tenant]);

    // Resetar contador quando visualizar pedidos
    useEffect(() => {
        if (activeTab === 'orders') {
            setUnreadOrders(0);
        }
    }, [activeTab]);

    // ============================================================
    //  DASHBOARD - CARREGAR DADOS (CORRIGIDO COM useCallback)
    // ============================================================
    const loadDashboardData = useCallback(async (selectedPeriod) => {
        if (!tenant) return;
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
    }, [tenant, showToast]);

    // Carregar dados do dashboard quando a aba for ativada ou período mudar
    useEffect(() => {
        if (activeTab === 'dashboard' && tenant) {
            loadDashboardData(period);
        }
    }, [activeTab, tenant, period, loadDashboardData]);

    // ============================================================
    //  DASHBOARD - HANDLERS
    // ============================================================
    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        // O useEffect vai carregar os dados automaticamente
    };

    const handleRefresh = () => {
        loadDashboardData(period);
        loadData();
        showToast('📊 Dashboard atualizado!', 'success');
    };

    // ============================================================
    //  FILTROS E PAGINAÇÃO - CORRIGIDO
    // ============================================================
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
    //  CORREÇÃO: applyFilters com filtro de status funcionando
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
        
        // ============================================================
        //  CORREÇÃO: Filtro de status comparando com 1/0 ou true/false
        // ============================================================
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

    const handleFilter = (newFilters) => {
        setFilters(newFilters);
    };

    // Paginação
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
                    
                    await api.post('/upload/delete', { 
                        public_id: publicId,
                        config_key: null
                    });
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
            showToast(`Pedido atualizado para: ${status}`, 'success');
            await loadData();
            loadDashboardData(period);
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            showToast('Erro ao atualizar status do pedido.', 'error');
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'products', label: 'Produtos', icon: '📦' },
        { id: 'categories', label: 'Categorias', icon: '🏷️' },
        { id: 'orders', label: 'Pedidos', icon: '📋' },
        { id: 'config', label: 'Configurações', icon: '⚙️' }
    ];

    if (loading) return <div className="loader">Carregando...</div>;
    if (!tenant) return <div>Tenant não encontrado</div>;

    const currentItems = getCurrentItems();

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
                        color: socketStatus === 'conectado' ? '#27ae60' : '#e74c3c',
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
                                background: '#e74c3c',
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
                                color: '#e74c3c', 
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
                            color: socketStatus === 'conectado' ? '#27ae60' : '#e74c3c'
                        }}>
                            {socketStatus === 'conectado' ? '🟢 Online' : '🔴 Offline'}
                        </span>
                        <MobileToggle onClick={() => setSidebarOpen(true)}>
                            ☰
                        </MobileToggle>
                    </div>
                </PageHeader>

                {/* ============================================================
                    DASHBOARD - COMPLETO COM GRÁFICOS
                ============================================================ */}
                {activeTab === 'dashboard' && (
                    <>
                        <FilterBar
                            period={period}
                            onPeriodChange={handlePeriodChange}
                            onRefresh={handleRefresh}
                            lastUpdate={lastUpdate}
                            loading={dashboardLoading}
                        />

                        <StatsGrid>
                            <MetricCard
                                icon="📦"
                                title="Total de Pedidos"
                                value={stats?.total || 0}
                                trend="up"
                                trendValue="12%"
                            />
                            <MetricCard
                                icon="💰"
                                title="Faturamento Hoje"
                                value={`R$ ${stats?.todayRevenue?.toFixed(2) || '0,00'}`}
                                trend="up"
                                trendValue="8%"
                            />
                            <MetricCard
                                icon="🎫"
                                title="Ticket Médio"
                                value={`R$ ${stats?.avgTicket?.toFixed(2) || '0,00'}`}
                                trend="down"
                                trendValue="3%"
                            />
                            <MetricCard
                                icon="⏳"
                                title="Pedidos Pendentes"
                                value={stats?.pending || 0}
                                trend={stats?.pending > 5 ? 'down' : 'up'}
                                trendValue={stats?.pending > 5 ? 'Alto' : 'Normal'}
                            />
                        </StatsGrid>

                        {/* Gráfico de Vendas */}
                        <SalesLineChart data={salesData} />

                        {/* Gráficos de Status e Top Produtos */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '20px',
                            marginTop: '20px'
                        }}>
                            <OrderStatusPieChart data={statusData} />
                            <TopProductsChart data={topProducts} />
                        </div>

                        {/* Últimos Pedidos */}
                        <RecentOrders orders={orders} />
                    </>
                )}

                {/* PRODUTOS */}
                {activeTab === 'products' && (
                    <ProductsContainer>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ margin: 0 }}>Gerenciar Produtos</h3>
                            <ActionButton 
                                onClick={() => {
                                    setEditingProduct(null);
                                    setIsProductModalOpen(true);
                                }}
                            >
                                + Adicionar Produto
                            </ActionButton>
                        </div>
                        
                        <ProductFilters 
                            categories={categories}
                            onFilter={handleFilter}
                        />
                        
                        {filteredProducts.length === 0 ? (
                            <p style={{ color: '#888', padding: '20px 0' }}>
                                {products.length === 0 ? 'Nenhum produto cadastrado.' : 'Nenhum produto encontrado com os filtros aplicados.'}
                            </p>
                        ) : (
                            <>
                                {/* TABELA DESKTOP */}
                                <TableWrapper className="desktop-table">
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th>Imagem</th>
                                                <th>Nome</th>
                                                <th>Preço</th>
                                                <th>Status</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map(p => (
                                                <tr key={p.id}>
                                                    <td>
                                                        {p.image_url ? (
                                                            <img 
                                                                src={p.image_url} 
                                                                alt={p.name} 
                                                                style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }}
                                                            />
                                                        ) : (
                                                            <span style={{ color: '#ccc', fontSize: 18 }}>📦</span>
                                                        )}
                                                    </td>
                                                    <td><strong>{p.name}</strong></td>
                                                    <td>R$ {parseFloat(p.price).toFixed(2)}</td>
                                                    <td>
                                                        <Badge $status={p.active ? 'active' : 'inactive'}>
                                                            {p.active ? '🟢 Ativo' : '🔴 Inativo'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <ActionContainer>
                                                            <ActionButton 
                                                                $variant="edit" 
                                                                onClick={() => {
                                                                    setEditingProduct(p);
                                                                    setIsProductModalOpen(true);
                                                                }}
                                                            >
                                                                ✏️
                                                            </ActionButton>
                                                            <ActionButton 
                                                                $variant="delete" 
                                                                onClick={() => handleDeleteProduct(p.id)}
                                                            >
                                                                🗑️
                                                            </ActionButton>
                                                        </ActionContainer>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </TableWrapper>

                                {/* CARDS MOBILE PARA PRODUTOS */}
                                <div className="mobile-cards">
                                    {currentItems.map(p => (
                                        <MobileOrderCard key={p.id}>
                                            <MobileOrderRow>
                                                <span className="label">Produto</span>
                                                <span className="value"><strong>{p.name}</strong></span>
                                            </MobileOrderRow>
                                            <MobileOrderRow>
                                                <span className="label">Preço</span>
                                                <span className="value">R$ {parseFloat(p.price).toFixed(2)}</span>
                                            </MobileOrderRow>
                                            {p.image_url && (
                                                <MobileOrderRow>
                                                    <span className="label">Imagem</span>
                                                    <span className="value">
                                                        <img 
                                                            src={p.image_url} 
                                                            alt={p.name} 
                                                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                                                        />
                                                    </span>
                                                </MobileOrderRow>
                                            )}
                                            <MobileOrderRow>
                                                <span className="label">Status</span>
                                                <span className="value">
                                                    <Badge $status={p.active ? 'active' : 'inactive'}>
                                                        {p.active ? '🟢 Ativo' : '🔴 Inativo'}
                                                    </Badge>
                                                </span>
                                            </MobileOrderRow>
                                            <MobileActions>
                                                <ActionButton 
                                                    $variant="edit" 
                                                    onClick={() => {
                                                        setEditingProduct(p);
                                                        setIsProductModalOpen(true);
                                                    }}
                                                    style={{ flex: 1 }}
                                                >
                                                    ✏️ Editar
                                                </ActionButton>
                                                <ActionButton 
                                                    $variant="delete" 
                                                    onClick={() => handleDeleteProduct(p.id)}
                                                    style={{ flex: 1 }}
                                                >
                                                    🗑️ Remover
                                                </ActionButton>
                                            </MobileActions>
                                        </MobileOrderCard>
                                    ))}
                                </div>
                                
                                <Pagination 
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </>
                        )}
                    </ProductsContainer>
                )}

                {/* CATEGORIAS */}
                {activeTab === 'categories' && (
                    <ProductsContainer>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ margin: 0 }}>Gerenciar Categorias</h3>
                            <ActionButton 
                                onClick={() => {
                                    setEditingCategory(null);
                                    setIsCategoryModalOpen(true);
                                }}
                            >
                                + Nova Categoria
                            </ActionButton>
                        </div>
                        
                        {categories.length === 0 ? (
                            <p style={{ color: '#888', padding: '20px 0' }}>Nenhuma categoria cadastrada.</p>
                        ) : (
                            <>
                                {/* TABELA DESKTOP */}
                                <TableWrapper className="desktop-table">
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th>Nome</th>
                                                <th>Ordem</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map(c => (
                                                <tr key={c.id}>
                                                    <td><strong>{c.name}</strong></td>
                                                    <td>{c.display_order || 1}</td>
                                                    <td>
                                                        <ActionContainer>
                                                            <ActionButton 
                                                                $variant="edit" 
                                                                onClick={() => {
                                                                    setEditingCategory(c);
                                                                    setIsCategoryModalOpen(true);
                                                                }}
                                                            >
                                                                ✏️
                                                            </ActionButton>
                                                            <ActionButton 
                                                                $variant="delete" 
                                                                onClick={() => handleDeleteCategory(c.id)}
                                                            >
                                                                🗑️
                                                            </ActionButton>
                                                        </ActionContainer>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </TableWrapper>

                                {/* CARDS MOBILE PARA CATEGORIAS */}
                                <div className="mobile-cards">
                                    {categories.map(c => (
                                        <MobileOrderCard key={c.id}>
                                            <MobileOrderRow>
                                                <span className="label">Categoria</span>
                                                <span className="value"><strong>{c.name}</strong></span>
                                            </MobileOrderRow>
                                            <MobileOrderRow>
                                                <span className="label">Ordem</span>
                                                <span className="value">{c.display_order || 1}</span>
                                            </MobileOrderRow>
                                            <MobileActions>
                                                <ActionButton 
                                                    $variant="edit" 
                                                    onClick={() => {
                                                        setEditingCategory(c);
                                                        setIsCategoryModalOpen(true);
                                                    }}
                                                    style={{ flex: 1 }}
                                                >
                                                    ✏️ Editar
                                                </ActionButton>
                                                <ActionButton 
                                                    $variant="delete" 
                                                    onClick={() => handleDeleteCategory(c.id)}
                                                    style={{ flex: 1 }}
                                                >
                                                    🗑️ Remover
                                                </ActionButton>
                                            </MobileActions>
                                        </MobileOrderCard>
                                    ))}
                                </div>
                            </>
                        )}
                    </ProductsContainer>
                )}

                {/* PEDIDOS */}
                {activeTab === 'orders' && (
                    <OrdersContainer>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ margin: 0 }}>
                                Pedidos Recebidos
                                {unreadOrders > 0 && (
                                    <span style={{ 
                                        fontSize: '14px', 
                                        color: '#e74c3c', 
                                        marginLeft: '12px',
                                        fontWeight: 'normal'
                                    }}>
                                        ({unreadOrders} novos)
                                    </span>
                                )}
                            </h3>
                        </div>
                        
                        {orders.length === 0 ? (
                            <p style={{ color: '#888', padding: '20px 0' }}>Nenhum pedido recebido.</p>
                        ) : (
                            <>
                                {/* TABELA DESKTOP */}
                                <TableWrapper className="desktop-table">
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th>Pedido</th>
                                                <th>Cliente</th>
                                                <th>Itens</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map(o => {
                                                let items = o.items;
                                                if (typeof items === 'string') {
                                                    try { items = JSON.parse(items); } catch (e) { items = []; }
                                                }
                                                if (!Array.isArray(items)) items = [];

                                                const statusMap = {
                                                    'pending': 'pending',
                                                    'confirmado': 'confirmed',
                                                    'entregue': 'delivered',
                                                    'cancelado': 'cancelled'
                                                };

                                                const statusLabels = {
                                                    'pending': '🟡 Pendente',
                                                    'confirmado': '🟢 Confirmado',
                                                    'entregue': '✅ Entregue',
                                                    'cancelado': '❌ Cancelado'
                                                };

                                                const statusClass = o.status || 'pending';

                                                return (
                                                    <tr key={o.id}>
                                                        <td>#{o.order_number || o.id}</td>
                                                        <td>{o.customer_name || 'Cliente'}</td>
                                                        <td>
                                                            {items.map((i, idx) => (
                                                                <div key={idx}>{i.qty}x {i.name}</div>
                                                            ))}
                                                        </td>
                                                        <td><strong>R$ {parseFloat(o.total).toFixed(2)}</strong></td>
                                                        <td>
                                                            <Badge $status={statusMap[statusClass] || 'pending'}>
                                                                {statusLabels[statusClass] || statusClass}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <ActionContainer>
                                                                {statusClass === 'pending' && (
                                                                    <>
                                                                        <ActionButton 
                                                                            $variant="confirm" 
                                                                            onClick={() => updateOrderStatus(o.id, 'confirmado')}
                                                                        >
                                                                            ✅ Confirmar
                                                                        </ActionButton>
                                                                        <ActionButton 
                                                                            $variant="cancel" 
                                                                            onClick={() => updateOrderStatus(o.id, 'cancelado')}
                                                                        >
                                                                            ❌ Cancelar
                                                                        </ActionButton>
                                                                    </>
                                                                )}
                                                                {statusClass === 'confirmado' && (
                                                                    <ActionButton 
                                                                        $variant="deliver" 
                                                                        onClick={() => updateOrderStatus(o.id, 'entregue')}
                                                                    >
                                                                        📦 Entregue
                                                                    </ActionButton>
                                                                )}
                                                                {statusClass === 'entregue' && (
                                                                    <Badge $status="delivered">
                                                                        ✅ Finalizado
                                                                    </Badge>
                                                                )}
                                                                {statusClass === 'cancelado' && (
                                                                    <Badge $status="cancelled">
                                                                        ❌ Cancelado
                                                                    </Badge>
                                                                )}
                                                            </ActionContainer>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </TableWrapper>

                                {/* CARDS MOBILE PARA PEDIDOS */}
                                <div className="mobile-cards">
                                    {orders.map(o => {
                                        let items = o.items;
                                        if (typeof items === 'string') {
                                            try { items = JSON.parse(items); } catch (e) { items = []; }
                                        }
                                        if (!Array.isArray(items)) items = [];

                                        const statusMap = {
                                            'pending': 'pending',
                                            'confirmado': 'confirmed',
                                            'entregue': 'delivered',
                                            'cancelado': 'cancelled'
                                        };

                                        const statusLabels = {
                                            'pending': '🟡 Pendente',
                                            'confirmado': '🟢 Confirmado',
                                            'entregue': '✅ Entregue',
                                            'cancelado': '❌ Cancelado'
                                        };

                                        const statusClass = o.status || 'pending';

                                        return (
                                            <MobileOrderCard key={o.id}>
                                                <MobileOrderRow>
                                                    <span className="label">Pedido</span>
                                                    <span className="value">#{o.order_number || o.id}</span>
                                                </MobileOrderRow>
                                                <MobileOrderRow>
                                                    <span className="label">Cliente</span>
                                                    <span className="value">{o.customer_name || 'Cliente'}</span>
                                                </MobileOrderRow>
                                                <MobileOrderRow>
                                                    <span className="label">Total</span>
                                                    <span className="value"><strong>R$ {parseFloat(o.total).toFixed(2)}</strong></span>
                                                </MobileOrderRow>
                                                <MobileOrderRow>
                                                    <span className="label">Status</span>
                                                    <span className="value">
                                                        <Badge $status={statusMap[statusClass] || 'pending'}>
                                                            {statusLabels[statusClass] || statusClass}
                                                        </Badge>
                                                    </span>
                                                </MobileOrderRow>
                                                <MobileOrderRow style={{ flexDirection: 'column', alignItems: 'stretch', borderBottom: 'none' }}>
                                                    <span className="label" style={{ marginBottom: '8px' }}>Itens</span>
                                                    <MobileItemsList>
                                                        {items.map((item, idx) => (
                                                            <div className="item" key={idx}>
                                                                <span className="item-name">{item.name}</span>
                                                                <span className="item-qty">{item.qty}x</span>
                                                                <span className="item-price">R$ {(item.price * item.qty).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </MobileItemsList>
                                                </MobileOrderRow>
                                                <MobileActions>
                                                    {statusClass === 'pending' && (
                                                        <>
                                                            <ActionButton 
                                                                $variant="confirm" 
                                                                onClick={() => updateOrderStatus(o.id, 'confirmado')}
                                                                style={{ flex: 1 }}
                                                            >
                                                                ✅ Confirmar
                                                            </ActionButton>
                                                            <ActionButton 
                                                                $variant="cancel" 
                                                                onClick={() => updateOrderStatus(o.id, 'cancelado')}
                                                                style={{ flex: 1 }}
                                                            >
                                                                ❌ Cancelar
                                                            </ActionButton>
                                                        </>
                                                    )}
                                                    {statusClass === 'confirmado' && (
                                                        <ActionButton 
                                                            $variant="deliver" 
                                                            onClick={() => updateOrderStatus(o.id, 'entregue')}
                                                            style={{ flex: 1 }}
                                                        >
                                                            📦 Entregue
                                                        </ActionButton>
                                                    )}
                                                    {statusClass === 'entregue' && (
                                                        <Badge $status="delivered" style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
                                                            ✅ Finalizado
                                                        </Badge>
                                                    )}
                                                    {statusClass === 'cancelado' && (
                                                        <Badge $status="cancelled" style={{ width: '100%', textAlign: 'center', padding: '8px' }}>
                                                            ❌ Cancelado
                                                        </Badge>
                                                    )}
                                                </MobileActions>
                                            </MobileOrderCard>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </OrdersContainer>
                )}

                {/* CONFIGURAÇÕES */}
                {activeTab === 'config' && <Config />}
            </MainContent>

            {/* MODAIS */}
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

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                }}
                onSave={handleSaveCategory}
                category={editingCategory}
            />
        </AdminContainer>
    );
};

export default AdminLayout;