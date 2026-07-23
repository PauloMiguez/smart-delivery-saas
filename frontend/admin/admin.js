// ============================================================
//  VERIFICAR AUTENTICAÇÃO
// ============================================================
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// ============================================================
//  CONFIGURAÇÃO - TENANT CORRETO
// ============================================================
const API_URL = window.location.origin + '/api';

// FUNÇÃO PARA DETECTAR TENANT
function getTenant() {
    // 1. Tenta da URL
    const urlParams = new URLSearchParams(window.location.search);
    const tenantFromUrl = urlParams.get('tenant');
    if (tenantFromUrl) {
        console.log('✅ Tenant da URL:', tenantFromUrl);
        return tenantFromUrl;
    }
    
    // 2. Tenta do subdomínio
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    if (subdomain && subdomain !== 'localhost' && subdomain !== '127.0.0.1' && subdomain !== 'smart-delivery-saas') {
        console.log('✅ Tenant do subdomínio:', subdomain);
        return subdomain;
    }
    
    // 3. Fallback - SEU RESTAURANTE
    console.log('⚠️ Usando fallback: firerburger');
    return 'firerburger';
}

const TENANT_ID = getTenant();
console.log('🏷️ Admin Tenant:', TENANT_ID);

// Salvar para uso futuro
sessionStorage.setItem('tenant', TENANT_ID);

// Adicionar tenant à URL se não estiver presente
if (!window.location.search.includes('tenant=')) {
    const newUrl = window.location.pathname + '?tenant=' + TENANT_ID + window.location.hash;
    window.history.replaceState({}, '', newUrl);
}

// ============================================================
//  ESTADO
// ============================================================
let products = [];
let categories = [];
let orders = [];
let config = {};
let editingProductId = null;
let editingCategoryId = null;
let categoryModalSource = 'categories';

// ============================================================
//  FUNÇÕES DE API
// ============================================================
async function apiRequest(endpoint, options = {}) {
    const url = API_URL + endpoint;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': TENANT_ID
        }
    };
    const configOptions = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, configOptions);
        
        // Se for 404, tentar com tenant na URL
        if (response.status === 404) {
            const urlWithTenant = url + (url.includes('?') ? '&' : '?') + 'tenant=' + TENANT_ID;
            const retryResponse = await fetch(urlWithTenant, configOptions);
            if (retryResponse.ok) {
                return await retryResponse.json();
            }
        }
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erro na requisição');
        }
        return data;
    } catch (error) {
        console.error('❌ Erro na API:', error);
        throw error;
    }
}

// ============================================================
//  CARREGAR DADOS
// ============================================================
async function loadData() {
    try {
        console.log('🔄 Carregando dados do admin...');
        
        const tenantRes = await apiRequest('/tenant');
        if (tenantRes.success) {
            const display = document.getElementById('tenant-display');
            if (display) display.textContent = '🏷️ ' + (tenantRes.data?.subdomain || TENANT_ID);
        }

        const productsRes = await apiRequest('/products');
        products = productsRes.data || [];
        console.log('✅ ' + products.length + ' produtos carregados');

        const categoriesRes = await apiRequest('/categories');
        categories = categoriesRes.data || [];
        console.log('✅ ' + categories.length + ' categorias carregadas');

        const ordersRes = await apiRequest('/orders');
        orders = ordersRes.data || [];
        console.log('✅ ' + orders.length + ' pedidos carregados');

        const configRes = await apiRequest('/config');
        config = configRes.data || {};
        console.log('✅ Configurações carregadas');

        renderAll();
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados. Verifique o console.', 'error');
        renderAll();
    }
}

// ============================================================
//  RENDERIZAÇÃO
// ============================================================
function renderAll() {
    renderAdminProducts();
    renderAdminCategories();
    renderAdminOrders();
    updateDashboard();
    updateConfigUI();
    populateCategorySelect();
    updateImagePreviews();
}

// ============================================================
//  PRODUTOS
// ============================================================
function renderAdminProducts() {
    const container = document.getElementById('admin-product-list');
    if (!container) return;
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="big-icon">📦</div>
                <p>Nenhum produto cadastrado.</p>
                <button class="btn btn-sm" onclick="openProductModal()" style="margin-top:12px;width:auto;">+ Adicionar primeiro produto</button>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-item">
            <div class="info">
                <strong>${p.name}</strong>
                <span>${p.category || 'Sem categoria'} • R$ ${parseFloat(p.price).toFixed(2)} ${p.active ? '🟢 Ativo' : '🔴 Inativo'}</span>
            </div>
            <div class="actions">
                <button class="edit" onclick="editProduct(${p.id})">✏️</button>
                <button class="delete" onclick="deleteProduct(${p.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    modal.classList.add('open');

    if (!categories || categories.length === 0) {
        showToast('Cadastre uma categoria antes de adicionar um produto.', 'warning');
        closeProductModal();
        setTimeout(() => openCategoryModal(), 300);
        return;
    }

    if (product) {
        document.getElementById('product-modal-title').textContent = 'Editar Produto';
        document.getElementById('prod-name').value = product.name;
        document.getElementById('prod-desc').value = product.description || '';
        document.getElementById('prod-price').value = product.price;
        document.getElementById('prod-category').value = product.category || (categories[0] ? categories[0].name : '');
        document.getElementById('prod-active').value = product.active ? '1' : '0';
        editingProductId = product.id;
        document.getElementById('product-save-btn').textContent = 'Atualizar';
    } else {
        document.getElementById('product-modal-title').textContent = 'Adicionar Produto';
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-desc').value = '';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-category').value = categories[0] ? categories[0].name : '';
        document.getElementById('prod-active').value = '1';
        editingProductId = null;
        document.getElementById('product-save-btn').textContent = 'Salvar';
    }
    populateCategorySelect();
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.remove('open');
}

function populateCategorySelect() {
    const sel = document.getElementById('prod-category');
    if (!sel) return;
    sel.innerHTML = '';
    if (!categories || categories.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '-- Nenhuma categoria --';
        sel.appendChild(opt);
        return;
    }
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        sel.appendChild(opt);
    });
}

async function saveProduct() {
    const name = document.getElementById('prod-name').value.trim();
    const description = document.getElementById('prod-desc').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const active = document.getElementById('prod-active').value === '1';

    if (!name) { showToast('Digite o nome do produto.', 'warning'); return; }
    if (isNaN(price) || price <= 0) { showToast('Digite um preço válido.', 'warning'); return; }
    if (!category) { showToast('Selecione uma categoria.', 'warning'); return; }

    try {
        const data = { name, description, price, category, active };
        let result;
        if (editingProductId) {
            result = await apiRequest('/products/' + editingProductId, { method: 'PUT', body: JSON.stringify(data) });
        } else {
            result = await apiRequest('/products', { method: 'POST', body: JSON.stringify(data) });
        }
        if (result.success) {
            closeProductModal();
            await loadData();
            showToast('Produto salvo com sucesso!', 'success');
        }
    } catch (error) {
        showToast('Erro ao salvar produto: ' + error.message, 'error');
    }
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) openProductModal(product);
}

async function deleteProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    if (!confirm('Remover o produto "' + product.name + '"?')) return;
    try {
        await apiRequest('/products/' + id, { method: 'DELETE' });
        await loadData();
        showToast('Produto removido.', 'success');
    } catch (error) {
        showToast('Erro ao remover produto: ' + error.message, 'error');
    }
}

// ============================================================
//  CATEGORIAS
// ============================================================
function renderAdminCategories() {
    const container = document.getElementById('admin-category-list');
    if (!container) return;
    if (!categories || categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="big-icon">🏷️</div>
                <p>Nenhuma categoria cadastrada.</p>
                <button class="btn btn-sm btn-primary" onclick="openCategoryModal()" style="margin-top:12px;width:auto;">+ Criar primeira categoria</button>
            </div>
        `;
        return;
    }

    const sorted = [...categories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    container.innerHTML = sorted.map(c => `
        <div class="category-item">
            <div class="info">
                <strong>${c.name}</strong>
                <span>Ordem: ${c.display_order || 0}</span>
            </div>
            <div class="actions">
                <button class="edit" onclick="editCategory(${c.id})">✏️</button>
                <button class="delete" onclick="deleteCategory(${c.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function openCategoryModal(category = null) {
    const modal = document.getElementById('category-modal');
    if (!modal) return;
    modal.classList.add('open');

    if (category) {
        document.getElementById('category-modal-title').textContent = 'Editar Categoria';
        document.getElementById('cat-name').value = category.name;
        document.getElementById('cat-order').value = category.display_order || 1;
        editingCategoryId = category.id;
        document.getElementById('category-save-btn').textContent = 'Atualizar';
    } else {
        document.getElementById('category-modal-title').textContent = 'Nova Categoria';
        document.getElementById('cat-name').value = '';
        document.getElementById('cat-order').value = (categories || []).length + 1;
        editingCategoryId = null;
        document.getElementById('category-save-btn').textContent = 'Salvar';
    }
}

function openCategoryModalFromProduct() {
    categoryModalSource = 'product';
    openCategoryModal();
}

function closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) modal.classList.remove('open');
    categoryModalSource = 'categories';
}

async function saveCategory() {
    const name = document.getElementById('cat-name').value.trim();
    const display_order = parseInt(document.getElementById('cat-order').value) || 1;
    if (!name) { showToast('Digite o nome da categoria.', 'warning'); return; }

    try {
        const data = { name, display_order };
        let result;
        if (editingCategoryId) {
            result = await apiRequest('/categories/' + editingCategoryId, { method: 'PUT', body: JSON.stringify(data) });
        } else {
            result = await apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) });
        }
        if (result.success) {
            closeCategoryModal();
            await loadData();
            if (categoryModalSource === 'product') {
                populateCategorySelect();
                document.getElementById('prod-category').value = name;
            }
            showToast('Categoria "' + name + '" salva!', 'success');
        }
    } catch (error) {
        showToast('Erro ao salvar categoria: ' + error.message, 'error');
    }
}

function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (category) openCategoryModal(category);
}

async function deleteCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    if (!confirm('Remover a categoria "' + category.name + '"?')) return;
    try {
        await apiRequest('/categories/' + id, { method: 'DELETE' });
        await loadData();
        showToast('Categoria removida.', 'success');
    } catch (error) {
        showToast('Erro ao remover categoria: ' + error.message, 'error');
    }
}

// ============================================================
//  CONFIGURAÇÕES
// ============================================================
function updateConfigUI() {
    document.getElementById('config-store-name').value = config.store_name || '';
    document.getElementById('config-phone').value = config.store_phone || '';
    document.getElementById('config-delivery-fee').value = config.delivery_fee || '3.00';
    document.getElementById('config-open').value = config.open_time || '09:00';
    document.getElementById('config-close').value = config.close_time || '22:00';
    document.getElementById('config-status').checked = config.is_open === 'true' || config.is_open === true;
    document.getElementById('config-status-label').textContent = config.is_open === 'true' || config.is_open === true ? 'Aberto' : 'Fechado';

    document.getElementById('config-status').addEventListener('change', function() {
        document.getElementById('config-status-label').textContent = this.checked ? 'Aberto' : 'Fechado';
    });

    if (config.store_address) {
        fillAddressFields(config.store_address);
    }
}

function fillAddressFields(address) {
    const parts = address.split(', ');
    document.getElementById('config-street').value = parts[0] || '';
    const numPart = parts[1] || '';
    document.getElementById('config-number').value = numPart.split(' - ')[0] || '';
    document.getElementById('config-complement').value = numPart.includes(' - ') ? numPart.split(' - ').slice(1).join(' - ') : '';
    document.getElementById('config-neighborhood').value = parts[2] || '';
    const cityState = parts[3] || '';
    document.getElementById('config-city').value = cityState.split(' - ')[0] || '';
    document.getElementById('config-state').value = cityState.split(' - ')[1] || '';
}

function formatCep(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5, 8);
    input.value = value;
}

function buscarCepAdmin(cep) {
    const cepClean = cep.replace(/\D/g, '');
    if (cepClean.length !== 8) return;
    const loadingEl = document.getElementById('admin-cep-loading');
    if (loadingEl) loadingEl.classList.add('active');
    fetch('https://viacep.com.br/ws/' + cepClean + '/json/')
        .then(response => response.json())
        .then(data => {
            if (loadingEl) loadingEl.classList.remove('active');
            if (data.erro) { showToast('CEP não encontrado.', 'warning'); return; }
            document.getElementById('config-street').value = data.logradouro || '';
            document.getElementById('config-neighborhood').value = data.bairro || '';
            document.getElementById('config-city').value = data.localidade || '';
            document.getElementById('config-state').value = data.uf || '';
            document.getElementById('config-number').focus();
        })
        .catch(() => {
            if (loadingEl) loadingEl.classList.remove('active');
            showToast('Erro ao buscar CEP.', 'error');
        });
}

function updateImagePreviews() {
    const bannerPreview = document.getElementById('banner-preview');
    const bannerPlaceholder = document.getElementById('banner-placeholder');
    if (bannerPreview && bannerPlaceholder) {
        if (config.banner_image) {
            bannerPreview.src = config.banner_image;
            bannerPreview.style.display = 'block';
            bannerPlaceholder.style.display = 'none';
        } else {
            bannerPreview.style.display = 'none';
            bannerPlaceholder.style.display = 'flex';
        }
    }
    const logoPreview = document.getElementById('logo-preview');
    const logoPlaceholder = document.getElementById('logo-placeholder');
    if (logoPreview && logoPlaceholder) {
        if (config.logo_image) {
            logoPreview.src = config.logo_image;
            logoPreview.style.display = 'block';
            logoPlaceholder.style.display = 'none';
        } else {
            logoPreview.style.display = 'none';
            logoPlaceholder.style.display = 'flex';
        }
    }
}

function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    const placeholder = preview?.parentElement?.querySelector('.placeholder');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function clearImage(type) {
    if (type === 'banner') {
        config.banner_image = '';
        const upload = document.getElementById('banner-upload');
        if (upload) upload.value = '';
        updateImagePreviews();
    } else if (type === 'logo') {
        config.logo_image = '';
        const upload = document.getElementById('logo-upload');
        if (upload) upload.value = '';
        updateImagePreviews();
    }
}

async function saveConfig() {
    try {
        const data = {
            store_name: document.getElementById('config-store-name').value.trim(),
            store_phone: document.getElementById('config-phone').value.trim(),
            delivery_fee: document.getElementById('config-delivery-fee').value,
            open_time: document.getElementById('config-open').value,
            close_time: document.getElementById('config-close').value,
            is_open: document.getElementById('config-status').checked ? 'true' : 'false'
        };

        const street = document.getElementById('config-street').value.trim();
        const number = document.getElementById('config-number').value.trim();
        const complement = document.getElementById('config-complement').value.trim();
        const neighborhood = document.getElementById('config-neighborhood').value.trim();
        const city = document.getElementById('config-city').value.trim();
        const state = document.getElementById('config-state').value.trim();

        if (street && number && neighborhood && city && state) {
            let address = street + ', ' + number;
            if (complement) address += ' - ' + complement;
            address += ', ' + neighborhood + ', ' + city + ' - ' + state;
            data.store_address = address;
        }

        const bannerPreview = document.getElementById('banner-preview');
        if (bannerPreview && bannerPreview.src && bannerPreview.src.startsWith('data:image')) {
            data.banner_image = bannerPreview.src;
        }
        const logoPreview = document.getElementById('logo-preview');
        if (logoPreview && logoPreview.src && logoPreview.src.startsWith('data:image')) {
            data.logo_image = logoPreview.src;
        }

        await apiRequest('/config', { method: 'PUT', body: JSON.stringify(data) });
        await loadData();
        showToast('Configurações salvas com sucesso!', 'success');
    } catch (error) {
        showToast('Erro ao salvar configurações: ' + error.message, 'error');
    }
}

// ============================================================
//  PEDIDOS
// ============================================================
function renderAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if (!container) return;
    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum pedido recebido.</div>';
        return;
    }

    container.innerHTML = orders.map(o => {
        const statusMap = { 'pending': '🟡 Pendente', 'confirmado': '🟢 Confirmado', 'entregue': '✅ Entregue', 'cancelado': '❌ Cancelado' };
        const statusLabel = statusMap[o.status] || o.status;
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        return `
            <div class="order-card">
                <div class="order-header">
                    <strong>${o.order_number || '#' + o.id}</strong>
                    <span class="tag ${o.status === 'pending' ? 'tag-orange' : o.status === 'entregue' ? 'tag-green' : 'tag-red'}">${statusLabel}</span>
                </div>
                <div style="font-size:13px;color:#555;margin-bottom:4px;">
                    <strong>${o.customer_name || 'Cliente'}</strong> • ${o.customer_phone || ''}
                </div>
                <div class="order-items">${items.map(i => `${i.qty}x ${i.name}`).join(', ')}</div>
                <div class="flex-between">
                    <span>Total: <strong>R$ ${parseFloat(o.total).toFixed(2)}</strong></span>
                    <span style="font-size:13px;color:#888;">${new Date(o.created_at).toLocaleString()}</span>
                </div>
                <div style="font-size:12px;color:#888;margin-top:4px;">Entrega: ${o.customer_address || 'N/A'}</div>
                <div class="order-actions">
                    <button class="btn btn-sm btn-success" onclick="updateOrderStatus(${o.id},'confirmado')">✅ Confirmar</button>
                    <button class="btn btn-sm btn-secondary" onclick="updateOrderStatus(${o.id},'entregue')">📦 Entregue</button>
                    <button class="btn btn-sm btn-danger" onclick="updateOrderStatus(${o.id},'cancelado')">❌ Cancelar</button>
                </div>
            </div>
        `;
    }).join('');
}

async function updateOrderStatus(orderId, status) {
    try {
        await apiRequest('/orders/' + orderId + '/status', { method: 'PUT', body: JSON.stringify({ status }) });
        await loadData();
        showToast('Pedido atualizado para: ' + status, 'success');
    } catch (error) {
        showToast('Erro ao atualizar pedido: ' + error.message, 'error');
    }
}

// ============================================================
//  DASHBOARD
// ============================================================
async function updateDashboard() {
    try {
        const result = await apiRequest('/stats/orders');
        const stats = result.data || {};
        document.getElementById('dash-total-orders').textContent = stats.total || 0;
        document.getElementById('dash-today-revenue').textContent = 'R$ ' + (stats.todayRevenue || 0).toFixed(2);
        document.getElementById('dash-avg-ticket').textContent = 'R$ ' + (stats.avgTicket || 0).toFixed(2);
        document.getElementById('dash-pending-orders').textContent = stats.pending || 0;
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// ============================================================
//  TOAST
// ============================================================
function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '📢') + '</span><span>' + message + '</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>';
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 300);
    }, duration);
}

// ============================================================
//  TABS
// ============================================================
document.querySelectorAll('.admin-tabs button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.dataset.tab;
        document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(tab);
        if (target) target.classList.add('active');
        if (tab === 'tab-orders') renderAdminOrders();
        if (tab === 'tab-dashboard') updateDashboard();
        if (tab === 'tab-products') renderAdminProducts();
        if (tab === 'tab-categories') renderAdminCategories();
    });
});

// ============================================================
//  LOGOUT
// ============================================================
function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin_token');
        window.location.href = '/';
    }
}

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Painel Administrativo SaaS iniciado!');
    if (!checkAuth()) return;
    loadData();
});

// ============================================================
//  EXPOSIÇÃO GLOBAL
// ============================================================
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openCategoryModal = openCategoryModal;
window.openCategoryModalFromProduct = openCategoryModalFromProduct;
window.closeCategoryModal = closeCategoryModal;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.saveConfig = saveConfig;
window.updateOrderStatus = updateOrderStatus;
window.formatCep = formatCep;
window.buscarCepAdmin = buscarCepAdmin;
window.previewImage = previewImage;
window.clearImage = clearImage;
window.logout = logout;
window.showToast = showToast;

console.log('✅ Admin functions disponíveis globalmente');