import io from 'socket.io-client';
import { getTenantId } from './api';

let socket = null;

export const connectSocket = (token) => {
    const tenant = getTenantId();
    if (!tenant) {
        console.warn('⚠️ Tenant não encontrado para conectar socket');
        return null;
    }

    console.log('🔌 Conectando socket para tenant:', tenant);
    console.log('🔑 Token presente:', !!token);

    // ============================================================
    //  URL DINÂMICA PARA PRODUÇÃO E DESENVOLVIMENTO
    // ============================================================
    // Em produção: usa a URL do Render
    // Em desenvolvimento: usa localhost:3000
    // ============================================================
    const getSocketURL = () => {
        // Se estiver em produção (Render)
        if (window.location.hostname !== 'localhost' && 
            window.location.hostname !== '127.0.0.1') {
            // Usar a mesma URL do frontend (Render serve tudo)
            return window.location.origin;
        }
        // Desenvolvimento local
        return 'http://localhost:3000';
    };

    const SOCKET_URL = getSocketURL();
    console.log('🌐 Conectando ao backend em:', SOCKET_URL);

    socket = io(SOCKET_URL, {
        query: { tenant },
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
    });

    socket.on('connect', () => {
        console.log('✅ Socket conectado ao servidor!');
        console.log('📡 Socket ID:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('⚠️ Socket desconectado');
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Erro na conexão socket:', error);
        console.error('🔍 URL tentada:', SOCKET_URL);
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket desconectado');
    }
};

export const getSocket = () => socket;
