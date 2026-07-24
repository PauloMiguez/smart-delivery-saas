import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from './contexts/TenantContext';
import ClientLayout from './components/Client/ClientLayout';
import AdminLayout from './components/Admin/AdminLayout';

function App() {
    return (
        <TenantProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<ClientLayout />} />
                    <Route path="/admin/*" element={<AdminLayout />} />
                    <Route path="/login.html" element={<Navigate to="/login" />} />
                    <Route path="/register.html" element={<Navigate to="/register" />} />
                </Routes>
            </BrowserRouter>
        </TenantProvider>
    );
}

export default App;