import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

const getTenant = () => {
    const params = new URLSearchParams(window.location.search);
    const tenant = params.get('tenant');
    if (tenant) {
        sessionStorage.setItem('tenant', tenant);
        return tenant;
    }
    return sessionStorage.getItem('tenant') || null;
};

api.interceptors.request.use(config => {
    const tenant = getTenant();
    if (tenant) {
        config.headers['X-Tenant-ID'] = tenant;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        console.error('❌ API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const getTenantId = getTenant;