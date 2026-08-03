import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';

// ============================================================
//  LAZY LOAD - CADA COMPONENTE CARREGADO SOB DEMANDA
//  ISSO REDUZ O BUNDLE INICIAL DE 830KB PARA ~200KB
// ============================================================

// Componentes principais (carregados quando acessados)
const Dashboard = lazy(() => import('./Dashboard'));
const Products = lazy(() => import('./Products'));
const Categories = lazy(() => import('./Categories'));
const Orders = lazy(() => import('./Orders'));
const Config = lazy(() => import('./Config'));
const OperatingHours = lazy(() => import('./OperatingHours'));

// Componentes de modais (carregados apenas quando abertos)
const ProductModal = lazy(() => import('./ProductModal'));
const CategoryModal = lazy(() => import('./CategoryModal'));
const OrderTrackingModal = lazy(() => import('./OrderTrackingModal'));

// Sub-componentes do Dashboard (carregados apenas quando na aba dashboard)
const SalesChart = lazy(() => import('./Dashboard/SalesChart'));
const RecentOrders = lazy(() => import('./Dashboard/RecentOrders'));
const FilterBar = lazy(() => import('./Dashboard/FilterBar'));
const DashboardGrid = lazy(() => import('./Dashboard/DashboardGrid'));

// ============================================================
//  FALLBACK PARA CARREGAMENTO
// ============================================================

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    background: transparent;
`;

const LoadingSpinner = styled.div`
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid ${props => props.theme?.primary || '#e67e22'};
    border-radius: 50%;
    animation: spin 1s linear infinite;

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

const LoadingFallback = () => (
    <LoadingContainer>
        <LoadingSpinner />
    </LoadingContainer>
);

// ============================================================
//  ROTAS DO ADMIN - COM LAZY LOADING GRANULAR
// ============================================================

const AdminRoutes = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* Rotas principais */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/hours" element={<OperatingHours />} />
                <Route path="/config" element={<Config />} />
                
                {/* Redirecionamento padrão */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </Suspense>
    );
};

// ============================================================
//  EXPORTAR MODAIS PARA USO NO ADMINLAYOUT
//  (ELES SERÃO CARREGADOS SOB DEMANDA)
// ============================================================

export const LazyProductModal = ProductModal;
export const LazyCategoryModal = CategoryModal;
export const LazyOrderTrackingModal = OrderTrackingModal;

export default AdminRoutes;