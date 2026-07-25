import axios from 'axios';

const API_URL = '/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para adicionar token
api.interceptors.request.use(config => {
    // Adicionar token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Adicionar tenant
    const tenant = getTenant();
    if (tenant) {
        config.headers['X-Tenant-ID'] = tenant;
        if (!config.url.includes('?')) {
            config.url += '?tenant=' + tenant;
        } else {
            config.url += '&tenant=' + tenant;
        }
    }
    
    console.log('📤 Requisição:', config.method.toUpperCase(), config.url);
    return config;
});

// Interceptor para resposta
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

// Função para obter tenant
const getTenant = () => {
    const params = new URLSearchParams(window.location.search);
    const tenant = params.get('tenant');
    if (tenant) {
        sessionStorage.setItem('tenant', tenant);
        return tenant;
    }
    return sessionStorage.getItem('tenant') || null;
};

export const getTenantId = getTenant;