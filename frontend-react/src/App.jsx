import React, { lazy, Suspense, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { TenantProvider, TenantContext } from './contexts/TenantContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { ModalProvider } from './contexts/ModalContext';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './styles/theme';

// ============================================================
//  LAZY LOAD - TODOS OS COMPONENTES PESADOS
// ============================================================

// Cliente - já estavam lazy
const TrackOrder = lazy(() => import('./components/Client/TrackOrder'));
const OrdersHistory = lazy(() => import('./components/Client/OrdersHistory'));

// Cliente - agora também lazy (componentes que só são usados em rotas específicas)
const ClientLayout = lazy(() => import('./components/Client/ClientLayout'));
const Checkout = lazy(() => import('./components/Client/Checkout'));
const Register = lazy(() => import('./components/Client/Register'));
const Login = lazy(() => import('./components/Client/Login'));
const OrderVerification = lazy(() => import('./components/Client/OrderVerification'));

// Admin - AGORA LAZY (era carregado diretamente antes)
const AdminLayout = lazy(() => import('./components/Admin/AdminLayout'));

// Componente de loading melhorado
const LoadingFallback = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#888',
        background: '#fff'
    }}>
        <div style={{ textAlign: 'center' }}>
            <div style={{ 
                width: 40, 
                height: 40, 
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #e67e22',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
            }} />
            <p>Carregando...</p>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    </div>
);

// ============================================================
//  PÁGINA DE BOAS-VINDAS (OTIMIZADA)
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
                color: '#e67e22',
                marginBottom: '12px'
            }}>
                https://smart-delivery-saas.onrender.com/?tenant=nome_do_restaurante
            </code>
            <p style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>
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
                https://smart-delivery-saas.onrender.com/admin?tenant=nome_do_restaurante
            </code>
            <p style={{ 
                color: '#888', 
                fontSize: '12px', 
                marginTop: '16px',
                fontStyle: 'italic'
            }}>
                💡 Substitua "nome_do_restaurante" pelo subdomínio cadastrado
            </p>
        </div>
    </div>
);

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
const AppContent = () => {
    const { tenant, loading } = useContext(TenantContext);

    if (loading) {
        return <LoadingFallback />;
    }

    const pathname = window.location.pathname;
    
    // Rotas que não precisam de tenant
    const isTrackingRoute = pathname.includes('/track/');
    const isLoginRoute = pathname.includes('/login');
    const isRegisterRoute = pathname.includes('/register');
    const isCheckoutRoute = pathname.includes('/checkout');
    const isOrdersRoute = pathname.includes('/orders');
    const isVerifyRoute = pathname.includes('/verify-orders');
    const isAdminRoute = pathname.includes('/admin');

    // Rotas que não precisam de tenant
    if (isTrackingRoute || isLoginRoute || isRegisterRoute || isCheckoutRoute || 
        isOrdersRoute || isVerifyRoute || isAdminRoute) {
        return (
            <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        {/* Rotas públicas */}
                        <Route path="/" element={<ClientLayout />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/register.html" element={<Navigate to="/register" />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/login.html" element={<Navigate to="/login" />} />
                        
                        {/* Rotas com lazy loading */}
                        <Route path="/track/:orderId" element={<TrackOrder />} />
                        <Route path="/orders" element={<OrdersHistory />} />
                        <Route path="/verify-orders" element={<OrderVerification />} />
                        
                        {/* Admin - agora lazy! */}
                        <Route path="/admin/*" element={<AdminLayout />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        );
    }

    const isRoot = pathname === '/' || pathname === '';
    if (!tenant && isRoot) {
        return <WelcomePage />;
    }

    if (!tenant && !isRoot) {
        window.location.href = '/';
        return <LoadingFallback />;
    }

    // Rotas com tenant
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
                    <Route path="/verify-orders" element={<OrderVerification />} />
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