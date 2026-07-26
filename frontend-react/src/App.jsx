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
import AdminLayout from './components/Admin/AdminLayout';
import Login from './components/Admin/Login';
import Register from './components/Admin/Register';

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
                                    <Route path="/admin" element={<AdminLayout />} />
                                    <Route path="/admin/*" element={<AdminLayout />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/login.html" element={<Navigate to="/login" />} />
                                    <Route path="/register.html" element={<Navigate to="/register" />} />
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