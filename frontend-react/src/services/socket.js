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

    // USAR A PORTA DO BACKEND (3000) E NÃO A DO FRONTEND (5173)
    const SOCKET_URL = 'http://localhost:3000';

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
        console.error('🔍 Verifique se o backend está rodando em http://localhost:3000');
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
