import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTenantId } from '../services/api';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tenantId = getTenantId();
        setTenant(tenantId);
        setLoading(false);
        if (!tenantId) {
            console.warn('⚠️ Nenhum tenant encontrado');
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