import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';

const AdminLayout = () => {
    const { tenant, loading } = useTenant();

    if (loading) {
        return <div className="loader">Carregando...</div>;
    }

    if (!tenant) {
        return <Navigate to="/login.html" />;
    }

    return (
        <div className="admin-app">
            <h1>Painel Administrativo</h1>
            <p>Tenant: {tenant}</p>
            {/* Conteúdo do admin será adicionado aqui */}
        </div>
    );
};

export default AdminLayout;