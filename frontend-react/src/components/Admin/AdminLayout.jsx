import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { api } from '../../services/api';
import ProductModal from './ProductModal';
import CategoryModal from './CategoryModal';
import './AdminLayout.css';

const AdminLayout = () => {
    const { tenant, loading } = useTenant();
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

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
            setCategories(categoriesRes.data.data || []);
            setOrders(ordersRes.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados do admin:', error);
        }
    };

    useEffect(() => {
        if (!tenant) return;
        loadData();
    }, [tenant]);

    // === PRODUTOS ===
    const handleSaveProduct = async (productData) => {
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, productData);
            } else {
                await api.post('/products', productData);
            }
            await loadData();
            setEditingProduct(null);
            setIsProductModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            throw error;
        }
    };

    const handleDeleteProduct = async (id) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) return;
    try {
        // Buscar o produto para obter a URL da imagem
        const product = products.find(p => p.id === id);
        
        // Se tiver imagem, deletar do Cloudinary
        if (product?.image_url) {
            try {
                // Extrair public_id da URL
                const urlParts = product.image_url.split('/');
                const filename = urlParts[urlParts.length - 1].split('.')[0];
                const folder = urlParts[urlParts.length - 2];
                const publicId = `${folder}/${filename}`;
                
                await api.post('/upload/delete', { 
                    public_id: publicId,
                    config_key: null // Não é uma configuração
                });
                console.log('🗑️ Imagem deletada do Cloudinary');
            } catch (imgError) {
                console.warn('⚠️ Erro ao deletar imagem do Cloudinary:', imgError);
                // Continua mesmo se a imagem não for deletada
            }
        }
        
        // Deletar o produto do banco
        await api.delete(`/products/${id}`);
        await loadData();
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        alert('Erro ao deletar produto.');
    }
};

    // === CATEGORIAS ===
    const handleSaveCategory = async (categoryData) => {
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, categoryData);
            } else {
                await api.post('/categories', categoryData);
            }
            await loadData();
            setEditingCategory(null);
            setIsCategoryModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar categoria:', error);
            throw error;
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('Tem certeza que deseja remover esta categoria?')) return;
        try {
            await api.delete(`/categories/${id}`);
            await loadData();
        } catch (error) {
            console.error('Erro ao deletar categoria:', error);
            alert('Erro ao deletar categoria.');
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status });
            await loadData();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status do pedido.');
        }
    };

    if (loading) return <div className="admin-loader">Carregando...</div>;
    if (!tenant) return <div>Tenant não encontrado</div>;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>⚙️ Painel Administrativo</h1>
                <span className="admin-tenant">🏷️ {tenant}</span>
            </header>

            <nav className="admin-nav">
                <button 
                    className={activeTab === 'dashboard' ? 'active' : ''}
                    onClick={() => setActiveTab('dashboard')}
                >
                    📊 Dashboard
                </button>
                <button 
                    className={activeTab === 'products' ? 'active' : ''}
                    onClick={() => setActiveTab('products')}
                >
                    📦 Produtos
                </button>
                <button 
                    className={activeTab === 'categories' ? 'active' : ''}
                    onClick={() => setActiveTab('categories')}
                >
                    🏷️ Categorias
                </button>
                <button 
                    className={activeTab === 'orders' ? 'active' : ''}
                    onClick={() => setActiveTab('orders')}
                >
                    📋 Pedidos
                </button>
            </nav>

            <div className="admin-content">
                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div className="dashboard-grid">
                        <div className="dashboard-card">
                            <div className="number">{stats?.total || 0}</div>
                            <div className="label">Total de Pedidos</div>
                        </div>
                        <div className="dashboard-card">
                            <div className="number">R$ {stats?.todayRevenue?.toFixed(2) || '0,00'}</div>
                            <div className="label">Faturamento Hoje</div>
                        </div>
                        <div className="dashboard-card">
                            <div className="number">R$ {stats?.avgTicket?.toFixed(2) || '0,00'}</div>
                            <div className="label">Ticket Médio</div>
                        </div>
                        <div className="dashboard-card">
                            <div className="number">{stats?.pending || 0}</div>
                            <div className="label">Pedidos Pendentes</div>
                        </div>
                    </div>
                )}

                {/* PRODUTOS */}
                {activeTab === 'products' && (
                    <div className="products-admin">
                        <div className="products-header">
                            <h2>📦 Produtos</h2>
                            <button className="btn-add" onClick={() => {
                                setEditingProduct(null);
                                setIsProductModalOpen(true);
                            }}>
                                + Adicionar
                            </button>
                        </div>
                        {products.length === 0 ? (
                            <p>Nenhum produto cadastrado.</p>
                        ) : (
                            products.map(p => (
                                <div key={p.id} className="product-item-admin">
                                    <div className="product-info">
                                        {p.image_url && (
                                            <img 
                                                src={p.image_url} 
                                                alt={p.name} 
                                                className="product-thumb"
                                            />
                                        )}
                                        <span className="product-name">{p.name}</span>
                                        <span className="product-price">R$ {parseFloat(p.price).toFixed(2)}</span>
                                        <span className="product-status">
                                            {p.active ? '🟢 Ativo' : '🔴 Inativo'}
                                        </span>
                                    </div>
                                    <div className="product-actions">
                                        <button className="btn-edit" onClick={() => {
                                            setEditingProduct(p);
                                            setIsProductModalOpen(true);
                                        }}>
                                            ✏️
                                        </button>
                                        <button className="btn-delete" onClick={() => handleDeleteProduct(p.id)}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* CATEGORIAS */}
                {activeTab === 'categories' && (
                    <div className="categories-admin">
                        <div className="categories-header">
                            <h2>🏷️ Categorias</h2>
                            <button className="btn-add" onClick={() => {
                                setEditingCategory(null);
                                setIsCategoryModalOpen(true);
                            }}>
                                + Nova Categoria
                            </button>
                        </div>
                        {categories.length === 0 ? (
                            <p>Nenhuma categoria cadastrada.</p>
                        ) : (
                            categories.map(c => (
                                <div key={c.id} className="category-item-admin">
                                    <div className="category-info">
                                        <span className="category-name">{c.name}</span>
                                        <span className="category-order">Ordem: {c.display_order || 1}</span>
                                    </div>
                                    <div className="category-actions">
                                        <button className="btn-edit" onClick={() => {
                                            setEditingCategory(c);
                                            setIsCategoryModalOpen(true);
                                        }}>
                                            ✏️
                                        </button>
                                        <button className="btn-delete" onClick={() => handleDeleteCategory(c.id)}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* PEDIDOS */}
                {activeTab === 'orders' && (
                    <div className="orders-admin">
                        <h2>📋 Pedidos</h2>
                        {orders.length === 0 ? (
                            <p>Nenhum pedido recebido.</p>
                        ) : (
                            orders.map(o => {
                                let items = o.items;
                                if (typeof items === 'string') {
                                    try { items = JSON.parse(items); } catch (e) { items = []; }
                                }
                                if (!Array.isArray(items)) items = [];

                                const statusMap = {
                                    'pending': '🟡 Pendente',
                                    'confirmado': '🟢 Confirmado',
                                    'entregue': '✅ Entregue',
                                    'cancelado': '❌ Cancelado'
                                };
                                const statusClass = o.status || 'pending';

                                return (
                                    <div key={o.id} className="order-item-admin">
                                        <div className="order-header">
                                            <strong>#{o.order_number || o.id}</strong>
                                            <span className={`status-badge ${statusClass}`}>
                                                {statusMap[statusClass] || statusClass}
                                            </span>
                                        </div>
                                        <div className="order-details">
                                            <span className="customer-name">{o.customer_name || 'Cliente'}</span>
                                            <span className="order-items">
                                                {items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                            </span>
                                            <span className="order-total">R$ {parseFloat(o.total).toFixed(2)}</span>
                                        </div>
                                        <div className="order-actions">
                                            {statusClass === 'pending' && (
                                                <>
                                                    <button className="btn-confirm" onClick={() => updateOrderStatus(o.id, 'confirmado')}>
                                                        ✅ Confirmar
                                                    </button>
                                                    <button className="btn-cancel" onClick={() => updateOrderStatus(o.id, 'cancelado')}>
                                                        ❌ Cancelar
                                                    </button>
                                                </>
                                            )}
                                            {statusClass === 'confirmado' && (
                                                <button className="btn-deliver" onClick={() => updateOrderStatus(o.id, 'entregue')}>
                                                    📦 Entregue
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

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
        </div>
    );
};

export default AdminLayout;