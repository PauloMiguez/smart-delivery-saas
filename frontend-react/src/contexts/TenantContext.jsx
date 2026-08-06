import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokens } from '../styles/tokens';

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
//  FUNÇÃO PARA OBTER TENANT
// ============================================================
export const getTenantId = () => {
    // 1. Tenta da URL
    const params = new URLSearchParams(window.location.search);
    const tenant = params.get('tenant');
    if (tenant) {
        localStorage.setItem('tenant', tenant);
        sessionStorage.setItem('tenant', tenant);
        return tenant;
    }
    
    // 2. Tenta do localStorage (persistente)
    const localStored = localStorage.getItem('tenant');
    if (localStored) {
        sessionStorage.setItem('tenant', localStored);
        return localStored;
    }
    
    // 3. Tenta do sessionStorage
    const stored = sessionStorage.getItem('tenant');
    if (stored) {
        return stored;
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
        const tenantId = getTenantId();
        console.log('🔍 [TenantContext] getTenantId retornou:', tenantId);
        
        if (tenantId) {
            setTenant(tenantId);
            localStorage.setItem('tenant', tenantId);
            sessionStorage.setItem('tenant', tenantId);
            setStatus(formatTenantMessage(`Tenant carregado: ${tenantId}`, 'success'));
        } else {
            const savedTenant = localStorage.getItem('tenant');
            if (savedTenant) {
                console.log('🔄 [TenantContext] Recuperando tenant do localStorage:', savedTenant);
                setTenant(savedTenant);
                setStatus(formatTenantMessage(`Tenant recuperado: ${savedTenant}`, 'info'));
                
                const url = new URL(window.location);
                if (!url.searchParams.has('tenant')) {
                    url.searchParams.set('tenant', savedTenant);
                    window.history.replaceState({}, '', url);
                }
            } else {
                localStorage.removeItem('tenant');
                sessionStorage.removeItem('tenant');
                setStatus(formatTenantMessage('Nenhum tenant encontrado', 'warning'));
                console.log('🧹 [TenantContext] Limpando storage - sem tenant');
            }
        }
        setLoading(false);
    }, []);

    // ============================================================
    //  RECUPERAR TENANT QUANDO A ABA FOR REATIVADA
    // ============================================================
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const currentTenant = getTenantId();
                if (currentTenant && !tenant) {
                    console.log('🔄 [TenantContext] Recuperando tenant após reativação:', currentTenant);
                    setTenant(currentTenant);
                    setStatus(formatTenantMessage(`Tenant recuperado: ${currentTenant}`, 'info'));
                }
                
                const params = new URLSearchParams(window.location.search);
                const urlTenant = params.get('tenant');
                if (!urlTenant && tenant) {
                    const url = new URL(window.location);
                    url.searchParams.set('tenant', tenant);
                    window.history.replaceState({}, '', url);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [tenant]);

    // ============================================================
    //  RECUPERAR TENANT QUANDO A PÁGINA FOR CARREGADA
    // ============================================================
    useEffect(() => {
        const handleLoad = () => {
            const params = new URLSearchParams(window.location.search);
            const urlTenant = params.get('tenant');
            
            if (!urlTenant && tenant) {
                const url = new URL(window.location);
                url.searchParams.set('tenant', tenant);
                window.history.replaceState({}, '', url);
            }
        };

        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
    }, [tenant]);

    // ============================================================
    //  OUVIR MUDANÇAS NA URL (popstate)
    // ============================================================
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const urlTenant = params.get('tenant');
            if (urlTenant && urlTenant !== tenant) {
                console.log('🔄 [TenantContext] Tenant mudou na URL:', urlTenant);
                setTenant(urlTenant);
                localStorage.setItem('tenant', urlTenant);
                sessionStorage.setItem('tenant', urlTenant);
                setStatus(formatTenantMessage(`Tenant alterado: ${urlTenant}`, 'info'));
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