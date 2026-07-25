import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from './contexts/TenantContext';
import { CartProvider } from './contexts/CartContext';
import ClientLayout from './components/Client/ClientLayout';
import Checkout from './components/Client/Checkout';
import AdminLayout from './components/Admin/AdminLayout';
import Login from './components/Admin/Login';

function App() {
    return (
        <TenantProvider>
            <CartProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<ClientLayout />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/admin" element={<AdminLayout />} />
                        <Route path="/admin/*" element={<AdminLayout />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/login.html" element={<Navigate to="/login" />} />
                        <Route path="/register.html" element={<Navigate to="/register" />} />
                    </Routes>
                </BrowserRouter>
            </CartProvider>
        </TenantProvider>
    );
}

export default App;