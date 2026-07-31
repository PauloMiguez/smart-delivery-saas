import React, { lazy, Suspense, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { TenantProvider, TenantContext } from './contexts/TenantContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { ModalProvider } from './contexts/ModalContext';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './styles/theme';
import ClientLayout from './components/Client/ClientLayout';
import Checkout from './components/Client/Checkout';
import Register from './components/Client/Register';
import Login from './components/Client/Login';
import AdminLayout from './components/Admin/AdminLayout';

// ============================================================
//  LAZY LOAD - CARREGAR COMPONENTES SOB DEMANDA
// ============================================================
const TrackOrder = lazy(() => import('./components/Client/TrackOrder'));
const OrdersHistory = lazy(() => import('./components/Client/OrdersHistory'));

// Componente de loading
const LoadingFallback = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#888'
    }}>
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p>Carregando...</p>
        </div>
    </div>
);

// ============================================================
//  PÁGINA DE BOAS-VINDAS
// ============================================================
const WelcomePage = () => (
    <div style={{ 
        maxWidth: 480, 
        margin: '0 auto', 
        padding: '60px 20px', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#fff'
    }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🏠</div>
        <h1 style={{ color: '#2d3436', fontSize: 28, marginBottom: 12 }}>Smart Delivery</h1>
        <p style={{ color: '#888', marginBottom: 24, fontSize: 16 }}>
            Sistema de delivery para restaurantes
        </p>
        <div style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '12px',
            width: '100%',
            maxWidth: 380
        }}>
            <p style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>
                Para acessar um restaurante, use o link correto:
            </p>
            <code style={{ 
                display: 'block',
                background: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                wordBreak: 'break-all',
                color: '#e67e22'
            }}>
                https://smart-delivery-saas.onrender.com/?tenant=fireburger
            </code>
            <p style={{ color: '#888', fontSize: 13, marginTop: 12 }}>
                Ou use o painel administrativo:
            </p>
            <code style={{ 
                display: 'block',
                background: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                wordBreak: 'break-all',
                color: '#e67e22'
            }}>
                https://smart-delivery-saas.onrender.com/admin?tenant=fireburger
            </code>
        </div>
    </div>
);

// ============================================================
//  COMPONENTE PRINCIPAL COM VERIFICAÇÃO DE TENANT
// ============================================================
const AppContent = () => {
    const { tenant, loading } = useContext(TenantContext);

    // Enquanto carrega, mostrar loading
    if (loading) {
        return <LoadingFallback />;
    }

    // Se não tiver tenant e estiver na raiz, mostrar página de boas-vindas
    const isRoot = window.location.pathname === '/' || window.location.pathname === '';
    if (!tenant && isRoot) {
        return <WelcomePage />;
    }

    // Se não tiver tenant e não estiver na raiz, redirecionar para a raiz
    if (!tenant && !isRoot) {
        window.location.href = '/';
        return <LoadingFallback />;
    }

    return (
        <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path="/" element={<ClientLayout />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/register.html" element={<Navigate to="/register" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/login.html" element={<Navigate to="/login" />} />
                    <Route path="/track/:orderId" element={<TrackOrder />} />
                    <Route path="/orders" element={<OrdersHistory />} />
                    <Route path="/admin/*" element={<AdminLayout />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
};

function App() {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <ToastProvider>
                <ModalProvider>
                    <TenantProvider>
                        <CartProvider>
                            <AppContent />
                        </CartProvider>
                    </TenantProvider>
                </ModalProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
