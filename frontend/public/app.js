// ============================================================
//  CONFIGURAÇÃO - DETECÇÃO DE TENANT (CORRIGIDA)
// ============================================================
function getTenant() {
    // 1. Tenta da URL (query param)
    const urlParams = new URLSearchParams(window.location.search);
    const tenantFromUrl = urlParams.get('tenant');
    if (tenantFromUrl) {
        console.log('✅ Tenant da URL:', tenantFromUrl);
        sessionStorage.setItem('tenant', tenantFromUrl);
        return tenantFromUrl;
    }

    // 2. Tenta do sessionStorage
    const tenantFromStorage = sessionStorage.getItem('tenant');
    if (tenantFromStorage) {
        console.log('✅ Tenant do sessionStorage:', tenantFromStorage);
        return tenantFromStorage;
    }

    // 3. Tenta do subdomínio
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    if (subdomain && subdomain !== 'localhost' && subdomain !== '127.0.0.1' && subdomain !== 'smart-delivery-saas') {
        console.log('✅ Tenant do subdomínio:', subdomain);
        sessionStorage.setItem('tenant', subdomain);
        return subdomain;
    }

    // 4. Fallback - redirecionar para login se não tiver tenant
    console.error('❌ Nenhum tenant encontrado! Redirecionando para login...');
    window.location.href = '/login.html';
    return null;
}

const TENANT_ID = getTenant();
console.log('🏷️ Tenant:', TENANT_ID);

// ============================================================
//  API CONFIGURATION 
// ============================================================
const API_URL = window.location.origin + '/api';

// ============================================================
//  ESTADO
// ============================================================
let state = {
    products: [],
    categories: [],
    cart: [],
    config: {},
    user: {
        name: 'Usuário',
        email: 'usuario@email.com',
        phone: '(85) 99999-9999',
        address: ''
    },
    orders: [],
    currentPage: 'home'
};

let couponApplied = null;
let selectedPayment = 'Dinheiro';
let selectedSchedule = 'Pedir agora (60-75min)';
let checkoutStep = 1;
let editFieldName = '';

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
    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, config);
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
        console.log('🔄 Carregando dados...');

        // Carregar dados do usuário do localStorage
        const savedAddress = localStorage.getItem('user_address');
        const savedName = localStorage.getItem('user_name');
        const savedPhone = localStorage.getItem('user_phone');
        const savedEmail = localStorage.getItem('user_email');
        
        if (savedAddress) state.user.address = savedAddress;
        if (savedName) state.user.name = savedName;
        if (savedPhone) state.user.phone = savedPhone;
        if (savedEmail) state.user.email = savedEmail;

        const configRes = await apiRequest('/config');
        state.config = configRes.data || {};
        console.log('✅ Configurações carregadas');

        const productsRes = await apiRequest('/products?active_only=true');
        state.products = productsRes.data || [];
        console.log('✅ ' + state.products.length + ' produtos carregados');

        const categoriesRes = await apiRequest('/categories');
        state.categories = categoriesRes.data || [];
        console.log('✅ ' + state.categories.length + ' categorias carregadas');

        try {
            const ordersRes = await apiRequest('/orders');
            state.orders = ordersRes.data || [];
            console.log('✅ ' + state.orders.length + ' pedidos carregados');
        } catch (e) {
            console.log('⚠️ Nenhum pedido encontrado');
        }

        renderAll();
        await waitForImages();
        document.getElementById('app').classList.add('loaded');
        document.getElementById('loader').style.display = 'none';

    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        document.getElementById('app').classList.add('loaded');
        document.getElementById('loader').style.display = 'none';
    }
}

function waitForImages() {
    return new Promise((resolve) => {
        const images = document.querySelectorAll('img');
        if (images.length === 0) { resolve(); return; }
        let loaded = 0;
        images.forEach(img => {
            if (img.complete) { loaded++; if (loaded === images.length) resolve(); }
            else { img.addEventListener('load', () => { loaded++; if (loaded === images.length) resolve(); }); }
            img.addEventListener('error', () => { loaded++; if (loaded === images.length) resolve(); });
        });
        setTimeout(resolve, 5000);
    });
}

// ============================================================
//  RENDERIZAÇÃO
// ============================================================
function renderAll() {
    renderHeader();
    renderCategories();
    renderMenu();
    renderCart();
    renderOrders();
    renderProfile();
    updateBadges();
}

function renderHeader() {
    const config = state.config;

    document.getElementById('store-name').textContent = config.store_name || 'Smart Delivery';
    const isOpen = config.is_open === 'true' || config.is_open === true;
    document.getElementById('store-status').textContent = isOpen ? '🟢 Aberto' : '🔴 Fechado';
    document.getElementById('store-hours').textContent = ' • ' + (config.open_time || '09:00') + ' – ' + (config.close_time || '22:00');
    document.getElementById('store-address').textContent = '📍 ' + (config.store_address || 'Endereço não configurado');

    // Banner
    const bannerContainer = document.getElementById('banner-container');
    if (bannerContainer) {
        if (config.banner_image) {
            bannerContainer.innerHTML = `<img src="${config.banner_image}" alt="Banner" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            bannerContainer.innerHTML = `<div class="banner-placeholder">🍽️ ${config.store_name || 'Smart Delivery'}</div>`;
        }
    }

    // Logo
    const logoContainer = document.getElementById('logo-container');
    if (logoContainer) {
        if (config.logo_image) {
            logoContainer.innerHTML = `<img src="${config.logo_image}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            logoContainer.innerHTML = `<div class="logo-placeholder">${config.store_name ? config.store_name.substring(0, 2).toUpperCase() : 'SD'}</div>`;
        }
    }

    document.getElementById('store-pickup-address').textContent = config.store_address || 'Endereço não configurado';
    document.getElementById('checkout-address').textContent = state.user.address || 'Endereço não cadastrado';
    document.getElementById('checkout-fee-display').textContent = 'R$ ' + (parseFloat(config.delivery_fee) || 0).toFixed(2);
}

// ============================================================
//  RENDER CATEGORIES - CORRIGIDO
// ============================================================
function renderCategories() {
    const container = document.getElementById('category-tabs');
    // Obter nomes das categorias
    const categoryNames = state.categories.map(c => c.name);
    // Filtrar categorias que têm produtos ativos
    const activeCategories = categoryNames.filter(cat => 
        state.products.some(p => (p.category === cat) && (p.active === 1 || p.active === true))
    );
    if (activeCategories.length === 0) {
        container.innerHTML = '<button style="background:transparent;color:#888;cursor:default;padding:8px 16px;">Nenhuma categoria</button>';
        return;
    }
    container.innerHTML = activeCategories.map((cat, i) => 
        `<button class="${i === 0 ? 'active' : ''}" onclick="scrollToCategory('${cat}')">${cat}</button>`
    ).join('');
}

function scrollToCategory(category) {
    const el = document.getElementById('category-' + category.replace(/\s+/g, '-'));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.category-tabs button').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === category);
    });
}

// ============================================================
//  RENDER MENU - CORRIGIDO (COMPARAÇÃO CORRETA)
// ============================================================
function renderMenu() {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (!state.products || state.products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="big-icon">🍽️</div>
                <p>Nenhum produto disponível no momento.</p>
            </div>
        `;
        return;
    }

    const activeProducts = state.products.filter(p => p.active === 1 || p.active === true);
    
    if (activeProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="big-icon">🍽️</div>
                <p>Nenhum produto ativo no momento.</p>
            </div>
        `;
        return;
    }

    // Obter nomes das categorias
    const categoryNames = state.categories.map(c => c.name);
    
    // Agrupar produtos por categoria (incluindo "Sem categoria")
    const productMap = {};
    activeProducts.forEach(p => {
        // Verificar se a categoria do produto existe na lista de categorias
        const cat = categoryNames.includes(p.category) ? p.category : 'Sem categoria';
        if (!productMap[cat]) productMap[cat] = [];
        productMap[cat].push(p);
    });

    const categories = Object.keys(productMap);

    if (categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="big-icon">🏷️</div>
                <p>Nenhuma categoria com produtos disponíveis.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = categories.map(cat => {
        const items = productMap[cat];
        return `
            <div class="category-section" id="category-${cat.replace(/\s+/g, '-')}">
                <div class="category-title">${cat}</div>
                ${items.map(p => `
                    <div class="product-item" data-product-id="${p.id}">
                        <div class="product-info">
                            <div class="product-name">${p.name}</div>
                            <div class="product-desc">${p.description || ''}</div>
                            <div class="product-price">R$ ${parseFloat(p.price).toFixed(2)}</div>
                        </div>
                        <div class="product-actions">
                            <button onclick="changeQty(${p.id}, -1)" aria-label="Remover item">−</button>
                            <span class="qty" id="qty-${p.id}">${getCartQty(p.id)}</span>
                            <button onclick="changeQty(${p.id}, 1)" aria-label="Adicionar item">+</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

// ============================================================
//  CARRINHO
// ============================================================
function getCartQty(productId) {
    const item = state.cart.find(c => c.id === productId);
    return item ? item.qty : 0;
}

function changeQty(productId, delta) {
    const idx = state.cart.findIndex(c => c.id === productId);
    if (idx >= 0) {
        state.cart[idx].qty += delta;
        if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1);
    } else if (delta > 0) {
        const prod = state.products.find(p => p.id === productId);
        if (prod) state.cart.push({ id: prod.id, name: prod.name, price: parseFloat(prod.price), qty: 1 });
    }
    renderMenu();
    renderCart();
    updateBadges();
    updateCheckoutTotals();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const empty = document.getElementById('cart-empty');
    const summary = document.getElementById('cart-summary');

    if (state.cart.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        summary.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    summary.style.display = 'block';

    let subtotal = 0;
    container.innerHTML = state.cart.map(item => {
        const total = item.price * item.qty;
        subtotal += total;
        return `
            <div class="card product-item">
                <div class="product-info">
                    <div class="product-name">${item.name}</div>
                    <div class="product-price">R$ ${total.toFixed(2)}</div>
                </div>
                <div class="product-actions">
                    <button onclick="changeQty(${item.id}, -1)">−</button>
                    <span class="qty">${item.qty}</span>
                    <button onclick="changeQty(${item.id}, 1)">+</button>
                    <button onclick="removeFromCart(${item.id})" style="color:#e74c3c;border:none;font-size:18px;background:none;cursor:pointer;">✕</button>
                </div>
            </div>
        `;
    }).join('');

    const fee = parseFloat(state.config.delivery_fee) || 0;
    let total = subtotal + fee;
    if (couponApplied && couponApplied.type === 'percent') {
        total = total - (total * couponApplied.value / 100);
    }

    document.getElementById('cart-subtotal').textContent = 'R$ ' + subtotal.toFixed(2);
    document.getElementById('cart-delivery-fee').textContent = 'R$ ' + fee.toFixed(2);
    document.getElementById('cart-total').textContent = 'R$ ' + total.toFixed(2);
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(c => c.id !== productId);
    renderMenu();
    renderCart();
    updateBadges();
}

function clearCart() {
    state.cart = [];
    renderMenu();
    renderCart();
    updateBadges();
}

function updateBadges() {
    const total = state.cart.reduce((acc, i) => acc + i.qty, 0);
    document.querySelectorAll('.badge').forEach(el => {
        el.style.display = total > 0 ? 'inline' : 'none';
        if (total > 0) el.textContent = total;
    });
}

// ============================================================
//  NAVEGAÇÃO
// ============================================================
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    const navMap = { 'home': 0, 'cart': 1, 'orders': 2, 'profile': 3 };
    const btns = document.querySelectorAll('.bottom-nav button');
    if (btns[navMap[pageId]]) btns[navMap[pageId]].classList.add('active');

    if (pageId === 'cart') renderCart();
    if (pageId === 'orders') renderOrders();
    if (pageId === 'profile') renderProfile();
    if (pageId === 'home') { renderCategories(); renderMenu(); }
    if (pageId === 'checkout') updateCheckoutTotals();
}

// ============================================================
//  CHECKOUT
// ============================================================
function goToCheckout() {
    if (state.cart.length === 0) { showToast('Adicione itens à sacola primeiro.', 'warning'); return; }
    checkoutStep = 1;
    showCheckoutStep(1);
    updateCheckoutTotals();
    document.getElementById('checkout-address').textContent = state.user.address || 'Endereço não cadastrado';
    switchPage('checkout');
    setDeliveryNow();
}

function showCheckoutStep(step) {
    document.getElementById('checkout-step-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('checkout-step-2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('checkout-step-3').style.display = step === 3 ? 'block' : 'none';

    for (let i = 1; i <= 3; i++) {
        const el = document.getElementById('step-' + i);
        el.classList.remove('active', 'done');
        if (i < step) el.classList.add('done');
        else if (i === step) el.classList.add('active');
    }
    if (step === 3) buildOrderSummary();
}

function nextCheckoutStep(nextStep) {
    if (checkoutStep === 2) {
        const selected = document.querySelector('.chip-group .chip.selected');
        if (!selected) { showToast('Selecione uma forma de pagamento.', 'warning'); return; }
        selectedPayment = selected.dataset.method;
    }
    checkoutStep = nextStep;
    showCheckoutStep(checkoutStep);
    updateCheckoutTotals();
}

function setDeliveryNow() {
    selectedSchedule = 'Pedir agora (60-75min)';
    document.getElementById('schedule-info').textContent = '⏱️ Entrega em 60-75 minutos';
}

function setDeliverySchedule() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes() + 30).padStart(2, '0');
    selectedSchedule = 'Agendado para ' + h + ':' + m;
    document.getElementById('schedule-info').textContent = '📅 ' + selectedSchedule;
}

function updateCheckoutTotals() {
    const subtotal = state.cart.reduce((acc, i) => acc + i.price * i.qty, 0);
    const fee = parseFloat(state.config.delivery_fee) || 0;
    let total = subtotal + fee;
    if (couponApplied && couponApplied.type === 'percent') {
        total = total - (total * couponApplied.value / 100);
    }
    document.getElementById('checkout-subtotal').textContent = 'R$ ' + subtotal.toFixed(2);
    document.getElementById('checkout-delivery-fee').textContent = 'R$ ' + fee.toFixed(2);
    document.getElementById('checkout-total').textContent = 'R$ ' + total.toFixed(2);
}

function buildOrderSummary() {
    const container = document.getElementById('order-summary-items');
    container.innerHTML = state.cart.map(item =>
        `<div class="flex-between"><span>${item.qty}x ${item.name}</span> <span>R$ ${(item.price * item.qty).toFixed(2)}</span></div>`
    ).join('');

    document.getElementById('order-summary-address').textContent = state.user.address;
    document.getElementById('order-summary-payment').textContent = selectedPayment;
    document.getElementById('order-summary-schedule').textContent = selectedSchedule;

    const subtotal = state.cart.reduce((acc, i) => acc + i.price * i.qty, 0);
    const fee = parseFloat(state.config.delivery_fee) || 0;
    let total = subtotal + fee;
    if (couponApplied && couponApplied.type === 'percent') {
        total = total - (total * couponApplied.value / 100);
    }
    document.getElementById('order-summary-subtotal').textContent = 'R$ ' + subtotal.toFixed(2);
    document.getElementById('order-summary-fee').textContent = 'R$ ' + fee.toFixed(2);
    document.getElementById('order-summary-total').textContent = 'R$ ' + total.toFixed(2);
}

// ============================================================
//  ENVIAR PEDIDO - CORRIGIDO (COM VALIDAÇÃO DE ENDEREÇO)
// ============================================================
async function submitOrder() {
    // 1. Validar carrinho
    if (state.cart.length === 0) { 
        showToast('Sacola vazia!', 'warning'); 
        return; 
    }

    // 2. Validar endereço
    if (!state.user.address || state.user.address.trim() === '') {
        showToast('Por favor, preencha o endereço de entrega.', 'warning');
        openAddressModal();
        return;
    }

    const subtotal = state.cart.reduce((acc, i) => acc + i.price * i.qty, 0);
    const fee = parseFloat(state.config.delivery_fee) || 0;
    let total = subtotal + fee;
    let discountText = '';
    if (couponApplied && couponApplied.type === 'percent') {
        const discount = total * couponApplied.value / 100;
        total = total - discount;
        discountText = '\nDesconto (' + couponApplied.value + '%): -R$ ' + discount.toFixed(2);
    }

    console.log('📦 Enviando pedido:', {
        customer_name: state.user.name,
        customer_phone: state.user.phone,
        customer_address: state.user.address,
        items: state.cart.length,
        subtotal: subtotal,
        total: total
    });

    try {
        const orderData = {
            customer_name: state.user.name,
            customer_phone: state.user.phone,
            customer_address: state.user.address,
            items: state.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: parseFloat(item.price),
                qty: item.qty
            })),
            subtotal: subtotal,
            delivery_fee: fee,
            total: total,
            payment_method: selectedPayment,
            delivery_type: 'delivery',
            scheduled_time: selectedSchedule,
            notes: ''
        };

        const result = await apiRequest('/orders', { 
            method: 'POST', 
            body: JSON.stringify(orderData) 
        });
        
        console.log('✅ Pedido criado:', result);

        // WhatsApp
        const phone = state.config.store_phone || '5511999999999';
        const cleanPhone = phone.replace(/\D/g, '');
        const message = '🍽️ *NOVO PEDIDO*\nCliente: ' + state.user.name + '\nTelefone: ' + state.user.phone + '\nEndereço: ' + state.user.address + '\n\n*Itens:*\n' + state.cart.map(i => `- ${i.qty}x ${i.name} = R$ ${(i.price * i.qty).toFixed(2)}`).join('\n') + '\n\nSubtotal: R$ ' + subtotal.toFixed(2) + discountText + '\nTaxa entrega: R$ ' + fee.toFixed(2) + '\n*Total: R$ ' + total.toFixed(2) + '*\nPagamento: ' + selectedPayment + '\nEntrega: ' + selectedSchedule;
        window.open('https://wa.me/55' + cleanPhone + '?text=' + encodeURIComponent(message), '_blank');

        state.cart = [];
        couponApplied = null;
        renderAll();
        switchPage('home');
        showToast('Pedido enviado com sucesso!', 'success');

    } catch (error) {
        console.error('❌ Erro ao enviar pedido:', error);
        showToast('Erro ao enviar pedido: ' + error.message, 'error');
    }
}

// ============================================================
//  MODAL DE ENDEREÇO (COM CEP OPCIONAL)
// ============================================================
function openAddressModal() {
    const modal = document.getElementById('address-modal');
    if (!modal) return;
    
    // Preencher campos com dados atuais
    const address = state.user.address || '';
    const parts = address.split(', ');
    document.getElementById('user-street').value = parts[0] || '';
    const numPart = parts[1] || '';
    document.getElementById('user-number').value = numPart.split(' - ')[0] || '';
    document.getElementById('user-complement').value = numPart.includes(' - ') ? numPart.split(' - ').slice(1).join(' - ') : '';
    document.getElementById('user-neighborhood').value = parts[2] || '';
    const cityState = parts[3] || '';
    document.getElementById('user-city').value = cityState.split(' - ')[0] || '';
    document.getElementById('user-state').value = cityState.split(' - ')[1] || '';
    document.getElementById('user-cep').value = '';
    
    // Limpar mensagem de status do CEP
    document.getElementById('cep-status').textContent = '';
    document.getElementById('cep-status').className = '';
    
    modal.style.display = 'flex';
    document.getElementById('user-street').focus();
}

function closeAddressModal() {
    document.getElementById('address-modal').style.display = 'none';
}

// ============================================================
//  CEP FUNCTIONS (COM BUSCA AUTOMÁTICA E MANUAL)
// ============================================================
function formatCep(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5, 8);
    input.value = value;
    
    // Limpar status quando o usuário digitar
    const statusEl = document.getElementById('cep-status');
    statusEl.textContent = '';
    statusEl.className = '';
}

function buscarCep(cep) {
    const cepClean = cep.replace(/\D/g, '');
    const statusEl = document.getElementById('cep-status');
    
    // Se o CEP estiver vazio, apenas limpar os campos (usuário vai preencher manualmente)
    if (cepClean.length === 0) {
        statusEl.textContent = '💡 Preencha o endereço manualmente ou digite o CEP para busca automática.';
        statusEl.className = 'info';
        return;
    }
    
    if (cepClean.length !== 8) {
        statusEl.textContent = '⚠️ Digite um CEP válido com 8 dígitos.';
        statusEl.className = 'warning';
        return;
    }
    
    statusEl.textContent = '🔍 Buscando endereço...';
    statusEl.className = 'loading';
    
    fetch('https://viacep.com.br/ws/' + cepClean + '/json/')
        .then(response => response.json())
        .then(data => {
            if (data.erro) {
                statusEl.textContent = '❌ CEP não encontrado. Preencha o endereço manualmente.';
                statusEl.className = 'error';
                return;
            }
            
            // Preencher campos com os dados do CEP
            document.getElementById('user-street').value = data.logradouro || '';
            document.getElementById('user-neighborhood').value = data.bairro || '';
            document.getElementById('user-city').value = data.localidade || '';
            document.getElementById('user-state').value = data.uf || '';
            
            statusEl.textContent = '✅ Endereço encontrado! Complete o número e complemento se necessário.';
            statusEl.className = 'success';
            
            // Focar no número
            document.getElementById('user-number').focus();
        })
        .catch(() => {
            statusEl.textContent = '❌ Erro ao buscar CEP. Preencha o endereço manualmente.';
            statusEl.className = 'error';
        });
}

// ============================================================
//  SALVAR ENDEREÇO
// ============================================================
async function saveUserAddress() {
    const street = document.getElementById('user-street').value.trim();
    const number = document.getElementById('user-number').value.trim();
    const complement = document.getElementById('user-complement').value.trim();
    const neighborhood = document.getElementById('user-neighborhood').value.trim();
    const city = document.getElementById('user-city').value.trim();
    const stateUf = document.getElementById('user-state').value.trim();

    // Validar campos obrigatórios
    if (!street || !number || !neighborhood || !city || !stateUf) {
        showToast('Preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    let address = street + ', ' + number;
    if (complement) address += ' - ' + complement;
    address += ', ' + neighborhood + ', ' + city + ' - ' + stateUf;

    // Salvar localmente
    state.user.address = address;
    
    // Salvar no localStorage
    try {
        localStorage.setItem('user_address', address);
        localStorage.setItem('user_name', state.user.name);
        localStorage.setItem('user_phone', state.user.phone);
        localStorage.setItem('user_email', state.user.email);
    } catch (e) {
        console.warn('Não foi possível salvar no localStorage:', e);
    }
    
    renderProfile();
    renderHeader();
    closeAddressModal();
    showToast('Endereço salvo com sucesso!', 'success');
}

// ============================================================
//  PERFIL
// ============================================================
function renderProfile() {
    const user = state.user;
    document.getElementById('user-avatar').textContent = user.name ? user.name.substring(0, 1).toUpperCase() : '?';
    document.getElementById('user-name-display').textContent = user.name || 'Não definido';
    document.getElementById('user-email-display').textContent = user.email || 'Não definido';
    document.getElementById('user-name-value').textContent = user.name || 'Não definido';
    document.getElementById('user-email-value').textContent = user.email || 'Não definido';
    document.getElementById('user-phone-value').textContent = user.phone || 'Não definido';
    document.getElementById('user-address-value').textContent = user.address || 'Não cadastrado';
}

function editUserField(field) {
    const labels = { 
        'name': 'Nome completo', 
        'email': 'E-mail', 
        'phone': 'Telefone' 
    };
    editFieldName = field;
    document.getElementById('edit-modal-title').textContent = 'Editar ' + labels[field];
    document.getElementById('edit-modal-label').textContent = labels[field];
    document.getElementById('edit-modal-input').value = state.user[field] || '';
    document.getElementById('edit-modal').style.display = 'flex';
    document.getElementById('edit-modal-input').focus();
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

async function saveEditField() {
    const newValue = document.getElementById('edit-modal-input').value.trim();
    if (newValue === '') { 
        showToast('O campo não pode ficar vazio.', 'warning'); 
        return; 
    }
    closeEditModal();
    state.user[editFieldName] = newValue;
    
    // Salvar no localStorage
    try {
        localStorage.setItem('user_name', state.user.name);
        localStorage.setItem('user_email', state.user.email);
        localStorage.setItem('user_phone', state.user.phone);
    } catch (e) {
        console.warn('Não foi possível salvar no localStorage:', e);
    }
    
    renderProfile();
    renderHeader();
    const labelMap = { 'name': 'Nome', 'email': 'E-mail', 'phone': 'Telefone' };
    showToast(labelMap[editFieldName] + ' atualizado com sucesso!', 'success');
}

function clearUserData() {
    if (confirm('Deseja resetar os dados do usuário?')) {
        state.user = { name: 'Usuário', email: 'usuario@email.com', phone: '(85) 99999-9999', address: '' };
        // Limpar localStorage
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_phone');
        localStorage.removeItem('user_address');
        renderProfile();
        showToast('Dados resetados.', 'success');
    }
}

// ============================================================
//  ORDERS
// ============================================================
function renderOrders() {
    const container = document.getElementById('orders-list');
    const empty = document.getElementById('orders-empty');
    if (state.orders.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    container.innerHTML = state.orders.map(o => {
        const statusMap = { 'pending': '🟡 Pendente', 'confirmado': '🟢 Confirmado', 'entregue': '✅ Entregue', 'cancelado': '❌ Cancelado' };
        return `
            <div class="card">
                <div class="flex-between">
                    <span><strong>${o.order_number || '#' + o.id}</strong></span>
                    <span class="tag ${o.status === 'pending' ? 'tag-orange' : o.status === 'entregue' ? 'tag-green' : 'tag-red'}">${statusMap[o.status] || o.status}</span>
                </div>
                <div style="font-size:14px;margin:6px 0;">${o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</div>
                <div class="flex-between"><span>Total</span> <strong>R$ ${parseFloat(o.total).toFixed(2)}</strong></div>
                <div style="font-size:12px;color:#888;margin-top:4px;">${new Date(o.created_at).toLocaleString()}</div>
            </div>
        `;
    }).join('');
}

// ============================================================
//  TOAST
// ============================================================
function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '📢'}</span>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 300);
    }, duration);
}

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Smart Delivery SaaS iniciado!');
    
    document.querySelectorAll('.chip-group .chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.chip-group .chip').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedPayment = this.dataset.method;
        });
    });
    const firstChip = document.querySelector('.chip-group .chip');
    if (firstChip) firstChip.classList.add('selected');

    loadData();
});

// ============================================================
//  EXPOSIÇÃO GLOBAL
// ============================================================
window.switchPage = switchPage;
window.clearCart = clearCart;
window.applyCoupon = applyCoupon;
window.goToCheckout = goToCheckout;
window.nextCheckoutStep = nextCheckoutStep;
window.setDeliveryNow = setDeliveryNow;
window.setDeliverySchedule = setDeliverySchedule;
window.submitOrder = submitOrder;
window.editUserField = editUserField;
window.closeEditModal = closeEditModal;
window.saveEditField = saveEditField;
window.clearUserData = clearUserData;
window.openAddressModal = openAddressModal;
window.closeAddressModal = closeAddressModal;
window.saveUserAddress = saveUserAddress;
window.formatCep = formatCep;
window.buscarCep = buscarCep;
window.scrollToCategory = scrollToCategory;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.showToast = showToast;

console.log('✅ Todas as funções disponíveis globalmente');