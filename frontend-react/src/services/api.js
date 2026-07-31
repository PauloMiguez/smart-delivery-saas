import axios from 'axios';

const API_URL = '/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Função para obter tenant
const getTenant = () => {
    // 1. Tenta da URL
    const params = new URLSearchParams(window.location.search);
    const tenant = params.get('tenant');
    if (tenant) {
        sessionStorage.setItem('tenant', tenant);
        return tenant;
    }
    
    // 2. Tenta do sessionStorage
    const stored = sessionStorage.getItem('tenant');
    if (stored) {
        return stored;
    }
    
    // 3. Tenta do localStorage
    const localStored = localStorage.getItem('tenant');
    if (localStored) {
        sessionStorage.setItem('tenant', localStored);
        return localStored;
    }
    
    return null;
};

// Interceptor para adicionar token e tenant
api.interceptors.request.use(config => {
    // Adicionar token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // ============================================================
    //  CORREÇÃO: Não adicionar tenant para rotas de tracking
    // ============================================================
    const publicRoutes = ['/auth/login', '/auth/register', '/health', '/test-db'];
    const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));
    
    // Verificar se é uma rota de tracking (contém 'token=' na URL)
    const isTrackingRoute = config.url?.includes('token=');
    
    if (!isPublicRoute && !isTrackingRoute) {
        const tenant = getTenant();
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

api.interceptors.response.use(
    response => {
        console.log('📥 Resposta:', response.status, response.config.url);
        return response;
    },
    error => {
        console.error('❌ API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const getTenantId = getTenant;
export default api;
