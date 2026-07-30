import React from 'react';
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
import TrackOrder from './components/Client/TrackOrder';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <ToastProvider>
                <ModalProvider>
                    <TenantProvider>
                        <CartProvider>
                            <BrowserRouter>
                                <Routes>
                                    <Route path="/" element={<ClientLayout />} />
                                    <Route path="/checkout" element={<Checkout />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/register.html" element={<Navigate to="/register" />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/login.html" element={<Navigate to="/login" />} />
                                    <Route path="/admin/*" element={<AdminLayout />} />
                                    <Route path="/track/:orderId" element={<TrackOrder />} />
                                </Routes>
                            </BrowserRouter>
                        </CartProvider>
                    </TenantProvider>
                </ModalProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;