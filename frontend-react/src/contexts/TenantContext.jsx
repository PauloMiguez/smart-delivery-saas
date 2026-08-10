import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokens } from '../styles/tokens';
import { api } from '../services/api';

// ============================================================
//  STYLED COMPONENTS PARA MENSAGENS
// ============================================================
const getStatusStyle = (type) => {
  switch(type) {
    case 'info':
      return {
        icon: 'ℹ️',
        color: tokens.colors.accent,
        background: tokens.colors.accentLight
      };
    case 'success':
      return {
        icon: '✅',
        color: tokens.colors.success,
        background: tokens.colors.successLight
      };
    case 'warning':
      return {
        icon: '⚠️',
        color: tokens.colors.warning,
        background: tokens.colors.warningLight
      };
    case 'error':
      return {
        icon: '❌',
        color: tokens.colors.error,
        background: tokens.colors.errorLight
      };
    default:
      return {
        icon: 'ℹ️',
        color: tokens.colors.textSecondary,
        background: tokens.colors.background
      };
  }
};

// ============================================================
//  CRIAR CONTEXTO
// ============================================================
const TenantContext = createContext();

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};

export { TenantContext };

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
            const response = await api.get('/domain-mapping');
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
    
    if (mapping[hostname]) {
        return mapping[hostname];
    }
    
    if (hostname.startsWith('www.')) {
        const withoutWWW = hostname.replace('www.', '');
        if (mapping[withoutWWW]) {
            return mapping[withoutWWW];
        }
    }
    
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
//  FUNÇÃO PARA VERIFICAR SE É DOMÍNIO PERSONALIZADO
// ============================================================
const isCustomDomain = async () => {
    const host = window.location.hostname;
    const mapping = await fetchDomainMapping();
    
    // Verificar se o host está no mapeamento (com ou sem www)
    if (mapping[host]) return true;
    if (host.startsWith('www.') && mapping[host.replace('www.', '')]) return true;
    
    return false;
};

// ============================================================
//  FUNÇÃO PARA OBTER TENANT
// ============================================================
export const getTenantId = async () => {
    // 1. Tenta da URL (query parameter)
    const params = new URLSearchParams(window.location.search);
    const tenantFromQuery = params.get('tenant');
    if (tenantFromQuery) {
        localStorage.setItem('tenant', tenantFromQuery);
        sessionStorage.setItem('tenant', tenantFromQuery);
        return tenantFromQuery;
    }
    
    // 2. Tenta do caminho da URL (ex: /tenant/fireburger)
    const pathMatch = window.location.pathname.match(/^\/tenant\/([^/]+)/);
    if (pathMatch) {
        const tenantFromPath = pathMatch[1];
        localStorage.setItem('tenant', tenantFromPath);
        sessionStorage.setItem('tenant', tenantFromPath);
        return tenantFromPath;
    }
    
    // 3. Tenta detectar por domínio personalizado (via API)
    const host = window.location.hostname;
    const isCustom = host !== 'smart-delivery-saas.onrender.com' && 
                    host !== 'localhost' && 
                    host !== '127.0.0.1';
    
    const tenantFromDomain = await detectTenantByDomain(host);
    if (tenantFromDomain && isCustom) {
        sessionStorage.setItem('tenant', tenantFromDomain);
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
//  FORMATAR MENSAGEM DE STATUS
// ============================================================
const formatTenantMessage = (message, type = 'info') => {
    const style = getStatusStyle(type);
    return {
        message,
        type,
        style,
        formatted: `${style.icon} ${message}`
    };
};

// ============================================================
//  PROVIDER
// ============================================================
export const TenantProvider = ({ children }) => {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);

    // ============================================================
    //  CARREGAR TENANT INICIAL
    // ============================================================
    useEffect(() => {
        const loadTenant = async () => {
            const tenantId = await getTenantId();
            console.log('🔍 [TenantContext] getTenantId retornou:', tenantId);
            
            if (tenantId) {
                setTenant(tenantId);
                setStatus(formatTenantMessage(`Tenant carregado: ${tenantId}`, 'success'));
            } else {
                const savedTenant = localStorage.getItem('tenant');
                if (savedTenant) {
                    console.log('🔄 [TenantContext] Recuperando tenant do localStorage:', savedTenant);
                    setTenant(savedTenant);
                    setStatus(formatTenantMessage(`Tenant recuperado: ${savedTenant}`, 'info'));
                } else {
                    localStorage.removeItem('tenant');
                    sessionStorage.removeItem('tenant');
                    setStatus(formatTenantMessage('Nenhum tenant encontrado', 'warning'));
                    console.log('🧹 [TenantContext] Limpando storage - sem tenant');
                }
            }
            setLoading(false);
        };

        loadTenant();
    }, []);

    // ============================================================
    //  RECUPERAR TENANT QUANDO A ABA FOR REATIVADA
    // ============================================================
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (!document.hidden) {
                const currentTenant = await getTenantId();
                if (currentTenant && !tenant) {
                    console.log('🔄 [TenantContext] Recuperando tenant após reativação:', currentTenant);
                    setTenant(currentTenant);
                    setStatus(formatTenantMessage(`Tenant recuperado: ${currentTenant}`, 'info'));
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [tenant]);

    // ============================================================
    //  ADICIONAR TENANT NA URL - CORRIGIDO (NÃO ADICIONA PARA DOMÍNIOS PERSONALIZADOS)
    // ============================================================
    useEffect(() => {
        const handleLoad = async () => {
            const isCustom = await isCustomDomain();
            
            // Só adicionar tenant na URL se NÃO for domínio personalizado
            if (!isCustom) {
                const params = new URLSearchParams(window.location.search);
                const urlTenant = params.get('tenant');
                
                if (!urlTenant && tenant) {
                    const url = new URL(window.location);
                    url.searchParams.set('tenant', tenant);
                    window.history.replaceState({}, '', url);
                }
            }
        };

        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
    }, [tenant]);

    // ============================================================
    //  OUVIR MUDANÇAS NA URL (popstate) - CORRIGIDO
    // ============================================================
    useEffect(() => {
        const handlePopState = async () => {
            const isCustom = await isCustomDomain();
            
            if (!isCustom) {
                const params = new URLSearchParams(window.location.search);
                const urlTenant = params.get('tenant');
                if (urlTenant && urlTenant !== tenant) {
                    console.log('🔄 [TenantContext] Tenant mudou na URL:', urlTenant);
                    setTenant(urlTenant);
                    localStorage.setItem('tenant', urlTenant);
                    sessionStorage.setItem('tenant', urlTenant);
                    setStatus(formatTenantMessage(`Tenant alterado: ${urlTenant}`, 'info'));
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [tenant]);

    // ============================================================
    //  FUNÇÃO PARA ATUALIZAR TENANT MANUALMENTE
    // ============================================================
    const updateTenant = (newTenant) => {
        if (!newTenant) {
            setStatus(formatTenantMessage('Tenant inválido', 'error'));
            return false;
        }
        
        setTenant(newTenant);
        localStorage.setItem('tenant', newTenant);
        sessionStorage.setItem('tenant', newTenant);
        
        const url = new URL(window.location);
        url.searchParams.set('tenant', newTenant);
        window.history.replaceState({}, '', url);
        
        setStatus(formatTenantMessage(`Tenant atualizado: ${newTenant}`, 'success'));
        return true;
    };

    // ============================================================
    //  LIMPAR TENANT
    // ============================================================
    const clearTenant = () => {
        setTenant(null);
        localStorage.removeItem('tenant');
        sessionStorage.removeItem('tenant');
        
        const url = new URL(window.location);
        url.searchParams.delete('tenant');
        window.history.replaceState({}, '', url);
        
        setStatus(formatTenantMessage('Tenant removido', 'warning'));
    };

    const value = {
        tenant,
        loading,
        status,
        setTenant,
        updateTenant,
        clearTenant,
        getTenantId
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};