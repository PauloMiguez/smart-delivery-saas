import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import {
    AdminContainer,
    Sidebar,
    SidebarBrand,
    NavItem,
    MainContent,
    PageHeader,
    StatsGrid,
    StatCard,
    Table,
    Badge,
    ActionButton,
    MobileToggle,
    Overlay
} from './AdminLayout.styled';
import ProductModal from './ProductModal';
import CategoryModal from './CategoryModal';
import Config from './Config';
import ProductFilters from './ProductFilters';
import Pagination from '../Shared/Pagination';

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

    const loadData = async () => {
        try {
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
        } catch (error) {
            console.error('Erro ao carregar dados do admin:', error);
            showToast('Erro ao carregar dados.', 'error');
        }
    };

    useEffect(() => {
        if (!tenant) return;
        loadData();
    }, [tenant]);

    // Aplicar filtros
    useEffect(() => {
        applyFilters();
    }, [products, filters]);

    // Atualizar total de páginas
    useEffect(() => {
        setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage) || 1);
        if (currentPage > Math.ceil(filteredProducts.length / itemsPerPage)) {
            setCurrentPage(1);
        }
    }, [filteredProducts, itemsPerPage]);

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
            const isActive = filters.status === 'active';
            filtered = filtered.filter(p => p.active === isActive);
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
                    </NavItem>
                ))}
            </Sidebar>

            <MainContent>
                <PageHeader>
                    <h2>{navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}</h2>
                    <MobileToggle onClick={() => setSidebarOpen(true)}>
                        ☰
                    </MobileToggle>
                </PageHeader>

                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <StatsGrid>
                        <StatCard>
                            <div className="number">{stats?.total || 0}</div>
                            <div className="label">Total de Pedidos</div>
                        </StatCard>
                        <StatCard>
                            <div className="number">R$ {stats?.todayRevenue?.toFixed(2) || '0,00'}</div>
                            <div className="label">Faturamento Hoje</div>
                        </StatCard>
                        <StatCard>
                            <div className="number">R$ {stats?.avgTicket?.toFixed(2) || '0,00'}</div>
                            <div className="label">Ticket Médio</div>
                        </StatCard>
                        <StatCard>
                            <div className="number">{stats?.pending || 0}</div>
                            <div className="label">Pedidos Pendentes</div>
                        </StatCard>
                    </StatsGrid>
                )}

                {/* PRODUTOS */}
                {activeTab === 'products' && (
                    <div className="products-admin">
                        <PageHeader>
                            <h2>📦 Produtos</h2>
                            <ActionButton 
                                $variant="confirm" 
                                onClick={() => {
                                    setEditingProduct(null);
                                    setIsProductModalOpen(true);
                                }}
                            >
                                + Adicionar
                            </ActionButton>
                        </PageHeader>
                        
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
                                                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                                                        />
                                                    ) : (
                                                        <span style={{ color: '#ccc', fontSize: 20 }}>📦</span>
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
                                                        style={{ marginLeft: 4 }}
                                                        onClick={() => handleDeleteProduct(p.id)}
                                                    >
                                                        🗑️
                                                    </ActionButton>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                
                                <Pagination 
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </>
                        )}
                    </div>
                )}

                {/* CATEGORIAS */}
                {activeTab === 'categories' && (
                    <>
                        <PageHeader>
                            <h2>🏷️ Categorias</h2>
                            <ActionButton 
                                $variant="confirm" 
                                onClick={() => {
                                    setEditingCategory(null);
                                    setIsCategoryModalOpen(true);
                                }}
                            >
                                + Nova Categoria
                            </ActionButton>
                        </PageHeader>
                        {categories.length === 0 ? (
                            <p style={{ color: '#888', padding: '20px 0' }}>Nenhuma categoria cadastrada.</p>
                        ) : (
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
                                                    style={{ marginLeft: 4 }}
                                                    onClick={() => handleDeleteCategory(c.id)}
                                                >
                                                    🗑️
                                                </ActionButton>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </>
                )}

                {/* PEDIDOS - COM BOTÕES UNIFICADOS */}
                {activeTab === 'orders' && (
                    <>
                        <h2>📋 Pedidos</h2>
                        {orders.length === 0 ? (
                            <p style={{ color: '#888', padding: '20px 0' }}>Nenhum pedido recebido.</p>
                        ) : (
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
                                                    {items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                                </td>
                                                <td><strong>R$ {parseFloat(o.total).toFixed(2)}</strong></td>
                                                <td>
                                                    <Badge $status={statusMap[statusClass] || 'pending'}>
                                                        {statusLabels[statusClass] || statusClass}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {/* ============================================================
                                                        BOTÕES DE AÇÃO UNIFICADOS COM O ESTILO DOS PRODUTOS
                                                        ============================================================ */}
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                                                                    style={{ marginLeft: 4 }}
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
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        )}
                    </>
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