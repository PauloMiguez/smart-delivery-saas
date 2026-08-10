import axios from 'axios';

const API_URL = '/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// ============================================================
//  CACHE DO MAPEAMENTO DE DOMÍNIOS
// ============================================================
let domainMappingCache = null;
let domainMappingPromise = null;

// ============================================================
//  FUNÇÃO PARA BUSCAR MAPEAMENTO DE DOMÍNIOS DO BACKEND
// ============================================================
const fetchDomainMapping = async () => {
    if (domainMappingCache) {
        return domainMappingCache;
    }

    if (domainMappingPromise) {
        return domainMappingPromise;
    }

    domainMappingPromise = (async () => {
        try {
            const response = await axios.get(`${API_URL}/domain-mapping`);
            if (response.data.success) {
                domainMappingCache = response.data.data;
                console.log('📋 Mapeamento de domínios carregado:', domainMappingCache);
                return domainMappingCache;
            }
            return {};
        } catch (error) {
            console.error('❌ Erro ao carregar mapeamento de domínios:', error);
            return {};
        } finally {
            domainMappingPromise = null;
        }
    })();

    return domainMappingPromise;
};

// ============================================================
//  FUNÇÃO PARA DETECTAR TENANT PELO DOMÍNIO
// ============================================================
const detectTenantByDomain = async (hostname) => {
    const mapping = await fetchDomainMapping();
    
    // Verificar no mapeamento
    if (mapping[hostname]) {
        return mapping[hostname];
    }
    
    // Verificar com www.
    if (hostname.startsWith('www.')) {
        const withoutWWW = hostname.replace('www.', '');
        if (mapping[withoutWWW]) {
            return mapping[withoutWWW];
        }
    }
    
    // Verificar se é subdomínio (ex: fireburger.smartdelivery.com)
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        const subdomain = parts[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'smart-delivery-saas') {
            return subdomain;
        }
    }
    
    return null;
};

// ============================================================
//  FUNÇÃO PARA OBTER TENANT
// ============================================================
const getTenant = async () => {
    // 1. Tenta da URL (query parameter)
    const params = new URLSearchParams(window.location.search);
    const tenantFromQuery = params.get('tenant');
    if (tenantFromQuery) {
        sessionStorage.setItem('tenant', tenantFromQuery);
        localStorage.setItem('tenant', tenantFromQuery);
        return tenantFromQuery;
    }
    
    // 2. Tenta do caminho da URL (ex: /tenant/fireburger)
    const pathMatch = window.location.pathname.match(/^\/tenant\/([^/]+)/);
    if (pathMatch) {
        const tenantFromPath = pathMatch[1];
        sessionStorage.setItem('tenant', tenantFromPath);
        localStorage.setItem('tenant', tenantFromPath);
        return tenantFromPath;
    }
    
    // 3. Tenta detectar por domínio personalizado (via API)
    const host = window.location.hostname;
    const tenantFromDomain = await detectTenantByDomain(host);
    if (tenantFromDomain) {
        sessionStorage.setItem('tenant', tenantFromDomain);
        localStorage.setItem('tenant', tenantFromDomain);
        return tenantFromDomain;
    }
    
    // 4. Tenta do sessionStorage
    const stored = sessionStorage.getItem('tenant');
    if (stored) {
        return stored;
    }
    
    // 5. Tenta do localStorage
    const localStored = localStorage.getItem('tenant');
    if (localStored) {
        sessionStorage.setItem('tenant', localStored);
        return localStored;
    }
    
    return null;
};

// ============================================================
//  CACHE DO TENANT (PARA EVITAR MÚLTIPLAS CHAMADAS)
// ============================================================
let tenantCache = null;
let tenantCachePromise = null;

// ============================================================
//  FUNÇÃO PARA OBTER TENANT COM CACHE
// ============================================================
const getTenantCached = async () => {
    if (tenantCache) {
        return tenantCache;
    }

    if (tenantCachePromise) {
        return tenantCachePromise;
    }

    tenantCachePromise = (async () => {
        const tenant = await getTenant();
        tenantCache = tenant;
        tenantCachePromise = null;
        return tenant;
    })();

    return tenantCachePromise;
};

// ============================================================
//  FUNÇÃO PARA LIMPAR O CACHE DO TENANT
// ============================================================
const clearTenantCache = () => {
    tenantCache = null;
    tenantCachePromise = null;
    domainMappingCache = null;
    domainMappingPromise = null;
};

// ============================================================
//  INTERCEPTOR DE REQUISIÇÕES
// ============================================================
api.interceptors.request.use(async config => {
    // Adicionar token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Verificar se é uma rota pública que não precisa de tenant
    const publicRoutes = ['/auth/login', '/auth/register', '/health', '/test-db', '/orders/available-slots', '/domain-mapping'];
    const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));
    
    // Verificar se é uma rota de tracking (contém 'token=' na URL)
    const isTrackingRoute = config.url?.includes('token=');
    
    // Verificar se já tem tenant na URL
    const hasTenantParam = config.url?.includes('tenant=');
    
    if (!isPublicRoute && !isTrackingRoute && !hasTenantParam) {
        const tenant = await getTenantCached();
        if (tenant) {
            config.headers['X-Tenant-ID'] = tenant;
            if (!config.url?.includes('?')) {
                config.url += '?tenant=' + tenant;
            } else {
                config.url += '&tenant=' + tenant;
            }
        }
    }
    
    console.log('📤 Requisição:', config.method?.toUpperCase(), config.url);
    return config;
});

// ============================================================
//  INTERCEPTOR DE RESPOSTAS
// ============================================================
api.interceptors.response.use(
    response => {
        console.log('📥 Resposta:', response.status, response.config.url);
        return response;
    },
    error => {
        // Se for erro 401 (não autorizado), limpar cache
        if (error.response?.status === 401) {
            clearTenantCache();
        }
        console.error('❌ API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ============================================================
//  EXPORTAÇÕES
// ============================================================
export const getTenantId = getTenantCached;
export const clearCache = clearTenantCache;

export default api;