import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTenantId } from '../services/api';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ============================================================
        //  CORREÇÃO: Limpar storage se não houver tenant na URL
        // ============================================================
        const params = new URLSearchParams(window.location.search);
        const hasTenantInUrl = params.has('tenant');
        
        // Se não tiver tenant na URL, limpar storage
        if (!hasTenantInUrl) {
            console.log('🧹 Limpando storage - sem tenant na URL');
            localStorage.removeItem('tenant');
            sessionStorage.removeItem('tenant');
        }

        const tenantId = getTenantId();
        console.log('🔍 [TenantContext] getTenantId retornou:', tenantId);
        setTenant(tenantId);
        setLoading(false);
        
        if (!tenantId) {
            console.log('🏠 Nenhum tenant encontrado - Mostrando página de boas-vindas');
        } else {
            console.log('✅ Tenant definido:', tenantId);
        }
    }, []);

    return (
        <TenantContext.Provider value={{ tenant, loading }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant deve ser usado dentro de TenantProvider');
    }
    return context;
};
