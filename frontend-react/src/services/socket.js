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
    console.log('📍 Ambiente:', window.location.hostname);

    // ============================================================
    //  URL DO SOCKET - DETECÇÃO AUTOMÁTICA
    // ============================================================
    let SOCKET_URL;
    
    // Em produção (Render)
    if (window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
        // Usar a URL do frontend (Render)
        SOCKET_URL = window.location.origin;
        console.log('🏭 Modo produção - URL:', SOCKET_URL);
    } else {
        // Desenvolvimento local
        SOCKET_URL = 'http://localhost:3000';
        console.log('💻 Modo desenvolvimento - URL:', SOCKET_URL);
    }

    console.log('🌐 Conectando ao backend em:', SOCKET_URL);

    socket = io(SOCKET_URL, {
        query: { tenant },
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Forçar polling se WebSocket falhar
        upgrade: true,
        rememberUpgrade: false,
    });

    // EXPOR O SOCKET GLOBALMENTE PARA DEBUG
    window.socket = socket;

    socket.on('connect', () => {
        console.log('✅ Socket conectado ao servidor!');
        console.log('📡 Socket ID:', socket.id);
        console.log('🔗 Transporte:', socket.io.engine.transport.name);
    });

    socket.on('disconnect', () => {
        console.log('⚠️ Socket desconectado');
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Erro na conexão socket:', error);
        console.error('🔍 URL tentada:', SOCKET_URL);
        console.error('🔍 Tenant:', tenant);
        console.error('🔍 Token presente:', !!token);
        
        // Tentar recuar para polling se WebSocket falhar
        if (socket.io.engine.transport.name === 'websocket') {
            console.log('🔄 Tentando fallback para polling...');
            socket.io.engine.transport.name = 'polling';
        }
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconectado após ${attemptNumber} tentativas`);
    });

    socket.on('reconnect_error', (error) => {
        console.error('❌ Erro na reconexão:', error);
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        window.socket = null;
        console.log('🔌 Socket desconectado');
    }
};

export const getSocket = () => socket;
