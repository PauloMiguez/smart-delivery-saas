import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { TenantProvider } from './contexts/TenantContext';
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

function App() {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <ToastProvider>
                <ModalProvider>
                    <TenantProvider>
                        <CartProvider>
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
                        </CartProvider>
                    </TenantProvider>
                </ModalProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
