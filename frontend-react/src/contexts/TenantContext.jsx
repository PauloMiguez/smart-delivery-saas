import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ✅ Criar o contexto
const TenantContext = createContext();

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};

// ✅ Exportar o contexto para uso no App.jsx
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

export const TenantProvider = ({ children }) => {
    const location = useLocation();
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tenantId = getTenantId();
        console.log('🔍 [TenantContext] getTenantId retornou:', tenantId);
        
        if (tenantId) {
            setTenant(tenantId);
            localStorage.setItem('tenant', tenantId);
            sessionStorage.setItem('tenant', tenantId);
        } else {
            const savedTenant = localStorage.getItem('tenant');
            if (savedTenant) {
                console.log('🔄 [TenantContext] Recuperando tenant do localStorage:', savedTenant);
                setTenant(savedTenant);
                const url = new URL(window.location);
                if (!url.searchParams.has('tenant')) {
                    url.searchParams.set('tenant', savedTenant);
                    window.history.replaceState({}, '', url);
                }
            } else {
                localStorage.removeItem('tenant');
                sessionStorage.removeItem('tenant');
                console.log('🧹 [TenantContext] Limpando storage - sem tenant');
            }
        }
        setLoading(false);
    }, [location]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const currentTenant = getTenantId();
                if (currentTenant && !tenant) {
                    console.log('🔄 [TenantContext] Recuperando tenant após reativação:', currentTenant);
                    setTenant(currentTenant);
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

    const value = {
        tenant,
        loading,
        setTenant
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};
