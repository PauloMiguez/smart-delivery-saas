// ============================================================
// SMART DELIVERY SAAS - SERVER COMPLETO (COM WEBSOCKET)
// ============================================================
require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

// ============================================================
//  IMPORTS CLOUDINARY
// ============================================================
const { uploadBanner, uploadLogo, uploadProduct, deleteImage } = require('./upload');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//  MIDDLEWARES - CORS CONFIGURADO UMA VEZ
// ============================================================
app.use(cors({
    origin: ['http://localhost:5173', 'https://smart-delivery-saas.onrender.com', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================
//  CONEXÃO COM O BANCO DE DADOS (VERSÃO RENDER - FINAL)
// ============================================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER || '39E87ruqfSzYfRX.root',
    password: process.env.DB_PASSWORD || '8inwhBgD2ePqz8HH',
    database: process.env.DB_NAME || 'smart_delivery_saas',
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
});

// Reconexão automática
pool.on('connection', (connection) => {
    console.log('🔄 Nova conexão com o banco estabelecida');
});

pool.on('error', (err) => {
    console.error('❌ Erro no pool de conexões:', err);
    setTimeout(() => {
        console.log('🔄 Tentando reconectar ao banco...');
    }, 5000);
});

console.log('📊 Configuração do banco:');
console.log('   Host:', process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com');
console.log('   Database:', process.env.DB_NAME || 'smart_delivery_saas');
console.log('   User:', process.env.DB_USER || '39E87ruqfSzYfRX.root');

// ============================================================
//  TESTE DE CONEXÃO COM O BANCO
// ============================================================
async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco de dados:');
        console.error('   Mensagem:', error.message);
        console.error('   Código:', error.code);
        return false;
    }
}

// ============================================================
//  TENANT MIDDLEWARE - CORRIGIDO (COM ROTAS DE TRACKING)
// ============================================================
app.use((req, res, next) => {
    // ROTAS PÚBLICAS - NÃO PRECISAM DE TENANT
    const publicRoutes = [
        '/api/health',
        '/api/auth/login',
        '/api/auth/register',
        '/api/test-db'
    ];

    // ROTAS DE TRACKING - NÃO PRECISAM DE TENANT (USAM TOKEN)
    const isTrackingRoute = req.path.includes('/api/orders/') && req.query.token;

    // Verificar se é uma rota pública
    if (publicRoutes.includes(req.path)) {
        return next();
    }

    // Verificar se é uma rota de tracking
    if (isTrackingRoute) {
        console.log('🔓 Rota de tracking liberada (sem tenant):', req.path);
        return next();
    }

    // Verificar tenant da query
    if (req.query.tenant) {
        req.tenantId = req.query.tenant;
        console.log('🏷️ Tenant da query:', req.tenantId);
        return next();
    }

    // Verificar tenant do header
    if (req.headers['x-tenant-id']) {
        req.tenantId = req.headers['x-tenant-id'];
        console.log('🏷️ Tenant do header:', req.tenantId);
        return next();
    }

    // Verificar tenant do subdomínio
    const host = req.get('host');
    if (host) {
        const parts = host.split('.');
        if (parts.length >= 3) {
            const subdomain = parts[0];
            if (subdomain && subdomain !== 'www' && subdomain !== 'smart-delivery-saas') {
                req.tenantId = subdomain;
                console.log('🏷️ Tenant do subdomínio:', req.tenantId);
                return next();
            }
        }
    }

    // Verificar se é arquivo estático
    if (req.path.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
        return next();
    }

    // Se for API e não encontrou tenant, retornar erro
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'Tenant não encontrado. Use ?tenant=seu_subdominio ou header X-Tenant-ID.'
        });
    }

    next();
});

// ============================================================
//  HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Smart Delivery SaaS API rodando!',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
//  ENDPOINT DE TESTE DO BANCO
// ============================================================
app.get('/api/test-db', async (req, res) => {
    try {
        console.log('🔄 Testando conexão com banco...');
        const [result] = await pool.query('SELECT 1 as connected');
        console.log('✅ Conexão com banco OK:', result);
        res.json({
            success: true,
            message: 'Conexão com banco OK',
            data: result
        });
    } catch (error) {
        console.error('❌ Erro no teste de conexão:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================
//  AUTENTICAÇÃO
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET || 'smart_delivery_super_secret_key_change_in_production_2024';

function generateToken(userId, tenantId) {
    return jwt.sign({ userId, tenantId }, JWT_SECRET, { expiresIn: '7d' });
}

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.tenantId = decoded.tenantId || req.tenantId;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Token inválido' });
    }
}

// ============================================================
//  ROTAS DE AUTENTICAÇÃO
// ============================================================

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email e senha são obrigatórios'
            });
        }

        console.log('🔐 Login:', email);

        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Email ou senha inválidos'
            });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Email ou senha inválidos'
            });
        }

        const token = generateToken(user.id, user.tenant_id);

        console.log('✅ Login bem-sucedido:', email);

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    tenantId: user.tenant_id,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('❌ Erro no login:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor: ' + error.message
        });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const {
            restaurantName,
            subdomain,
            ownerName,
            email,
            phone,
            password
        } = req.body;

        if (!restaurantName || !subdomain || !ownerName || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Todos os campos são obrigatórios'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'A senha deve ter no mínimo 6 caracteres'
            });
        }

        console.log('📝 Registro:', email, 'Subdomínio:', subdomain);

        const [existingTenant] = await pool.query(
            'SELECT * FROM tenants WHERE subdomain = ?',
            [subdomain]
        );

        if (existingTenant.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Este subdomínio já está em uso'
            });
        }

        const [existingEmail] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingEmail.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Este email já está cadastrado'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            await connection.query(
                `INSERT INTO tenants (id, name, subdomain, email, phone, plan, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [subdomain, restaurantName, subdomain, email, phone || null, 'free', 'active']
            );

            const [result] = await connection.query(
                `INSERT INTO users (tenant_id, name, email, phone, password, role) 
                 VALUES (?, ?, ?, ?, ?, 'admin')`,
                [subdomain, ownerName, email, phone || null, passwordHash]
            );

            await connection.query(
                `INSERT INTO config (tenant_id, config_key, config_value) 
                 VALUES 
                 (?, 'store_name', ?),
                 (?, 'is_open', 'true')`,
                [subdomain, restaurantName, subdomain]
            );

            await connection.commit();
            connection.release();

            console.log('✅ Registro concluído:', email);

            const token = generateToken(result.insertId, subdomain);

            res.status(201).json({
                success: true,
                message: 'Restaurante cadastrado com sucesso!',
                data: {
                    token,
                    user: {
                        id: result.insertId,
                        name: ownerName,
                        email: email,
                        tenantId: subdomain,
                        role: 'admin'
                    },
                    subdomain: subdomain,
                    url: `https://${subdomain}.smartdelivery.com`
                }
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('❌ Erro no registro:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor: ' + error.message });
    }
});

// ============================================================
//  ROTAS DE PRODUTOS
// ============================================================

app.get('/api/products', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({ success: false, error: 'Tenant não encontrado' });
        }

        const [products] = await pool.query(
            'SELECT * FROM products WHERE tenant_id = ? ORDER BY category, name',
            [tenantId]
        );

        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ success: false, error: 'Erro ao carregar produtos' });
    }
});

app.post('/api/products', verifyToken, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { name, description, price, category, active = true, image } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Nome e preço são obrigatórios' });
        }

        const [result] = await pool.query(
            `INSERT INTO products (tenant_id, name, description, price, category, active, image_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [tenantId, name, description || null, price, category || null, active ? 1 : 0, image || null]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId },
            message: 'Produto criado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar produto' });
    }
});

app.put('/api/products/:id', verifyToken, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const productId = req.params.id;
        const { name, description, price, category, active, image } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Nome e preço são obrigatórios' });
        }

        const [result] = await pool.query(
            `UPDATE products 
             SET name = ?, description = ?, price = ?, category = ?, active = ?, image_url = ?
             WHERE id = ? AND tenant_id = ?`,
            [name, description || null, price, category || null, active ? 1 : 0, image || null, productId, tenantId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Produto não encontrado' });
        }

        res.json({ success: true, message: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar produto' });
    }
});

app.delete('/api/products/:id', verifyToken, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const productId = req.params.id;

        const [result] = await pool.query(
            'DELETE FROM products WHERE id = ? AND tenant_id = ?',
            [productId, tenantId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Produto não encontrado' });
        }

        res.json({ success: true, message: 'Produto removido com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        res.status(500).json({ success: false, error: 'Erro ao deletar produto' });
    }
});

// ============================================================
//  ROTAS DE CATEGORIAS
// ============================================================

app.get('/api/categories', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({ success: false, error: 'Tenant não encontrado' });
        }

        const [categories] = await pool.query(
            'SELECT * FROM categories WHERE tenant_id = ? ORDER BY display_order ASC, name',
            [tenantId]
        );

        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ success: false, error: 'Erro ao carregar categorias' });
    }
});

app.post('/api/categories', verifyToken, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { name, display_order } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Nome da categoria é obrigatório' });
        }

        const [result] = await pool.query(
            `INSERT INTO categories (tenant_id, name, display_order) 
             VALUES (?, ?, ?)`,
            [tenantId, name, display_order || 1]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId },
            message: 'Categoria criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar categoria' });
    }
});

app.put('/api/categories/:id', verifyToken, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const categoryId = req.params.id;
        const { name, display_order } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Nome da categoria é obrigatório' });
        }

        const [result] = await pool.query(
            `UPDATE categories SET name = ?, display_order = ?
             WHERE id = ? AND tenant_id = ?`,
            [name, display_order || 1, categoryId, tenantId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Categoria não encontrada' });
        }

        res.json({ success: true, message: 'Categoria atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar categoria' });
    }
});

app.delete('/api/categories/:id', verifyToken, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const categoryId = req.params.id;

        const [result] = await pool.query(
            'DELETE FROM categories WHERE id = ? AND tenant_id = ?',
            [categoryId, tenantId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Categoria não encontrada' });
        }

        res.json({ success: true, message: 'Categoria removida com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        res.status(500).json({ success: false, error: 'Erro ao deletar categoria' });
    }
});

// ============================================================
//  ROTAS DE PEDIDOS
// ============================================================

app.get('/api/orders', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({ success: false, error: 'Tenant não encontrado' });
        }

        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC',
            [tenantId]
        );

        const processedOrders = orders.map(o => ({
            ...o,
            items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
        }));

        res.json({ success: true, data: processedOrders });
    } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({ success: false, error: 'Erro ao carregar pedidos' });
    }
});

// ============================================================
//  ROTA GET /api/orders/:id - COM VALIDAÇÃO DE TOKEN (CORRIGIDA)
//  NÃO DEPENDE DO TENANT - APENAS DO TOKEN
// ============================================================
// backend/server.js - ROTA GET /api/orders/:id
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const accessToken = req.query.token;
        const customerName = req.query.name;
        const customerPhone = req.query.phone;

        console.log(`📦 Buscando pedido ID: ${orderId}`);
        console.log(`🔑 Token: ${accessToken?.substring(0, 20)}...`);
        console.log(`👤 Nome: ${customerName}`);
        console.log(`📱 Telefone: ${customerPhone}`);

        // Validar token
        if (!accessToken) {
            console.log('❌ Token não fornecido');
            return res.status(401).json({
                success: false,
                error: 'Token de acesso necessário'
            });
        }

        // Buscar pedido
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE id = ? AND access_token = ?',
            [orderId, accessToken]
        );

        if (orders.length === 0) {
            console.log('❌ Pedido não encontrado ou token inválido');
            return res.status(404).json({
                success: false,
                error: 'Pedido não encontrado ou token inválido'
            });
        }

        const order = orders[0];

        // ============================================================
        //  VALIDAÇÃO: Verificar nome e telefone do cliente
        // ============================================================
        if (customerName && customerPhone) {
            const nameMatch = order.customer_name.toLowerCase() === customerName.toLowerCase();
            const phoneMatch = order.customer_phone.replace(/\D/g, '') === customerPhone.replace(/\D/g, '');

            if (!nameMatch || !phoneMatch) {
                console.log('❌ Dados do cliente não conferem');
                return res.status(403).json({
                    success: false,
                    error: 'Dados do cliente não conferem. Verifique nome e telefone.'
                });
            }
            console.log('✅ Dados do cliente validados com sucesso!');
        }

        // Incrementar visualizações
        await pool.query(
            'UPDATE orders SET tracking_views = tracking_views + 1 WHERE id = ?',
            [orderId]
        );

        const orderResponse = {
            ...order,
            items: typeof order.items === 'string' ?
                JSON.parse(order.items) : order.items,
            access_token: undefined
        };

        console.log(`✅ Pedido encontrado: ${order.order_number}`);
        res.json({ success: true, data: orderResponse });
    } catch (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar pedido: ' + error.message
        });
    }
});

// ============================================================
//  ROTA POST /api/orders - COM NUMERAÇÃO SEQUENCIAL E TOKEN
// ============================================================
app.post('/api/orders', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({ success: false, error: 'Tenant não encontrado' });
        }

        const {
            customer_name,
            customer_phone,
            customer_address,
            items,
            subtotal,
            total,
            delivery_fee = 0,
            payment_method = 'dinheiro'
        } = req.body;

        console.log('📦 Pedido recebido:', {
            tenantId,
            customer_name,
            items: items?.length,
            subtotal,
            total
        });

        if (!customer_name || !customer_address || !items || !total) {
            console.log('❌ Dados faltando');
            return res.status(400).json({
                success: false,
                error: 'Nome, endereço, itens e total são obrigatórios'
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'O pedido deve conter pelo menos um item'
            });
        }

        // ============================================================
        //  GERAR NÚMERO DO PEDIDO - SEQUENCIAL POR TENANT COM PREFIXO
        // ============================================================
        const [lastOrder] = await pool.query(
            `SELECT order_number FROM orders 
             WHERE tenant_id = ? 
             ORDER BY id DESC 
             LIMIT 1`,
            [tenantId]
        );

        let nextNumber = 1;
        if (lastOrder.length > 0) {
            const lastNumberStr = lastOrder[0].order_number.split('-')[1];
            const lastNumber = parseInt(lastNumberStr);
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }

        const sequentialNumber = String(nextNumber).padStart(6, '0');
        const tenantPrefix = tenantId.replace(/\s+/g, '').toUpperCase();
        const orderNumber = `#${tenantPrefix}-${sequentialNumber}`;

        console.log(`📋 Número do pedido: ${orderNumber} (Sequencial: ${nextNumber})`);

        // ============================================================
        //  GERAR TOKEN ÚNICO PARA ACOMPANHAMENTO
        // ============================================================
        const accessToken = crypto.randomBytes(32).toString('hex');
        console.log(`🔑 Token gerado: ${accessToken.substring(0, 16)}...`);

        // ============================================================
        //  INSERIR PEDIDO NO BANCO
        // ============================================================
        const [result] = await pool.query(
            `INSERT INTO orders (
                tenant_id, order_number, customer_name, customer_phone, 
                customer_address, items, subtotal, total, delivery_fee, 
                payment_method, status, created_at, access_token
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), ?)`,
            [
                tenantId,
                orderNumber,
                customer_name,
                customer_phone || null,
                customer_address,
                JSON.stringify(items),
                parseFloat(subtotal || 0),
                parseFloat(total),
                parseFloat(delivery_fee),
                payment_method,
                accessToken
            ]
        );

        console.log('✅ Pedido criado:', orderNumber);

        // ============================================================
        //  NOTIFICAÇÃO EM TEMPO REAL - NOVO PEDIDO
        // ============================================================
        const io = req.app.get('io');
        if (io) {
            const orderData = {
                id: result.insertId,
                orderNumber: orderNumber,
                customer_name: customer_name,
                total: parseFloat(total),
                items: items,
                status: 'pending'
            };

            console.log('🔔 Enviando notificação de novo pedido para tenant:', tenantId);

            io.to(`tenant-${tenantId}`).emit('new-order-notification', {
                order: orderData,
                timestamp: new Date().toISOString()
            });

            io.to(`tenant-${tenantId}`).emit('order-updated', {
                action: 'new',
                order: orderData
            });
        }

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                order_number: orderNumber,
                access_token: accessToken
            },
            message: 'Pedido criado com sucesso!'
        });
    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao criar pedido: ' + error.message
        });
    }
});

app.put('/api/orders/:id/status', verifyToken, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const orderId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, error: 'Status é obrigatório' });
        }

        const validStatuses = ['pending', 'confirmado', 'preparando', 'entregue', 'cancelado'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Status inválido. Use: ' + validStatuses.join(', ')
            });
        }

        const [result] = await pool.query(
            `UPDATE orders SET status = ?, updated_at = NOW()
             WHERE id = ? AND tenant_id = ?`,
            [status, orderId, tenantId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
        }

        // ============================================================
        //  NOTIFICAÇÃO EM TEMPO REAL - STATUS ATUALIZADO
        // ============================================================
        const io = req.app.get('io');
        if (io) {
            const [orderInfo] = await pool.query(
                'SELECT order_number FROM orders WHERE id = ? AND tenant_id = ?',
                [orderId, tenantId]
            );

            if (orderInfo.length > 0) {
                console.log('🔔 Enviando notificação de atualização de status para tenant:', tenantId);
                console.log('   Pedido:', orderInfo[0].order_number, 'Status:', status);

                io.to(`tenant-${tenantId}`).emit('order-updated', {
                    action: 'status_change',
                    order: {
                        id: orderId,
                        orderNumber: orderInfo[0].order_number,
                        status: status
                    }
                });
            }
        }

        res.json({ success: true, message: 'Status atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar status' });
    }
});

// ============================================================
//  ROTAS DE CONFIGURAÇÕES (CHAVE-VALOR) - CORRIGIDA
// ============================================================

app.get('/api/config', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        console.log('🔧 [CONFIG] Tenant recebido:', tenantId);

        if (!tenantId) {
            console.log('❌ [CONFIG] Tenant não encontrado');
            return res.status(404).json({
                success: false,
                error: 'Tenant não encontrado'
            });
        }

        console.log('🔍 [CONFIG] Verificando tenant no banco...');
        const [tenant] = await pool.query(
            'SELECT id FROM tenants WHERE id = ?',
            [tenantId]
        );

        if (tenant.length === 0) {
            console.log('❌ [CONFIG] Tenant não existe:', tenantId);
            return res.status(404).json({
                success: false,
                error: 'Tenant não encontrado'
            });
        }

        console.log('✅ [CONFIG] Tenant encontrado:', tenantId);

        console.log('🔍 [CONFIG] Buscando configurações...');
        const [rows] = await pool.query(
            'SELECT config_key, config_value FROM config WHERE tenant_id = ?',
            [tenantId]
        );

        console.log('📊 [CONFIG] Linhas encontradas:', rows.length);

        const config = {};
        rows.forEach(row => {
            config[row.config_key] = row.config_value;
        });

        const defaultConfig = {
            store_name: 'Minha Loja',
            is_open: 'true',
            delivery_fee: '3.00',
            open_time: '09:00',
            close_time: '22:00',
            store_address: '',
            store_phone: '',
            banner_image: '',
            logo_image: ''
        };

        const finalConfig = { ...defaultConfig, ...config };

        console.log('✅ [CONFIG] Config carregada com sucesso!');
        res.json({ success: true, data: finalConfig });
    } catch (error) {
        console.error('❌ [CONFIG] Erro detalhado:', error);
        console.error('❌ [CONFIG] Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Erro ao carregar configurações: ' + error.message
        });
    }
});

app.put('/api/config', verifyToken, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({ success: false, error: 'Tenant não encontrado' });
        }

        const configData = req.body;
        console.log('📝 Atualizando config para tenant:', tenantId, configData);

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const [key, value] of Object.entries(configData)) {
                const stringValue = typeof value === 'boolean' ? String(value) : value;
                await connection.query(
                    `INSERT INTO config (tenant_id, config_key, config_value) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE config_value = ?`,
                    [tenantId, key, stringValue, stringValue]
                );
            }

            await connection.commit();
            connection.release();

            res.json({ success: true, message: 'Configurações salvas com sucesso' });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('❌ Erro ao salvar configurações:', error);
        res.status(500).json({ success: false, error: 'Erro ao salvar configurações' });
    }
});

// ============================================================
//  ROTAS DE UPLOAD DE IMAGENS (CLOUDINARY)
// ============================================================

app.post('/api/upload/banner', verifyToken, uploadBanner.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada' });
        }

        const tenantId = req.tenantId;
        const imageUrl = req.file.path;
        const publicId = req.file.filename;

        console.log('📸 Banner uploaded:', imageUrl);

        await pool.query(
            `INSERT INTO config (tenant_id, config_key, config_value) 
             VALUES (?, 'banner_image', ?) 
             ON DUPLICATE KEY UPDATE config_value = ?`,
            [tenantId, imageUrl, imageUrl]
        );

        await pool.query(
            `INSERT INTO config (tenant_id, config_key, config_value) 
             VALUES (?, 'banner_public_id', ?) 
             ON DUPLICATE KEY UPDATE config_value = ?`,
            [tenantId, publicId, publicId]
        );

        res.json({
            success: true,
            data: {
                url: imageUrl,
                public_id: publicId
            },
            message: 'Banner enviado com sucesso!'
        });
    } catch (error) {
        console.error('❌ Erro no upload do banner:', error);
        res.status(500).json({ success: false, error: 'Erro ao enviar banner' });
    }
});

app.post('/api/upload/logo', verifyToken, uploadLogo.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada' });
        }

        const tenantId = req.tenantId;
        const imageUrl = req.file.path;
        const publicId = req.file.filename;

        console.log('📸 Logo uploaded:', imageUrl);

        await pool.query(
            `INSERT INTO config (tenant_id, config_key, config_value) 
             VALUES (?, 'logo_image', ?) 
             ON DUPLICATE KEY UPDATE config_value = ?`,
            [tenantId, imageUrl, imageUrl]
        );

        await pool.query(
            `INSERT INTO config (tenant_id, config_key, config_value) 
             VALUES (?, 'logo_public_id', ?) 
             ON DUPLICATE KEY UPDATE config_value = ?`,
            [tenantId, publicId, publicId]
        );

        res.json({
            success: true,
            data: {
                url: imageUrl,
                public_id: publicId
            },
            message: 'Logo enviado com sucesso!'
        });
    } catch (error) {
        console.error('❌ Erro no upload do logo:', error);
        res.status(500).json({ success: false, error: 'Erro ao enviar logo' });
    }
});

app.post('/api/upload/product', verifyToken, uploadProduct.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada' });
        }

        const imageUrl = req.file.path;
        const publicId = req.file.filename;

        console.log('📸 Produto image uploaded:', imageUrl);

        res.json({
            success: true,
            data: {
                url: imageUrl,
                public_id: publicId
            },
            message: 'Imagem do produto enviada com sucesso!'
        });
    } catch (error) {
        console.error('❌ Erro no upload da imagem do produto:', error);
        res.status(500).json({ success: false, error: 'Erro ao enviar imagem do produto' });
    }
});

// ============================================================
//  ROTAS DE ESTATÍSTICAS (DASHBOARD)
// ============================================================

app.get('/api/stats/orders', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({
                success: false,
                error: 'Tenant não encontrado'
            });
        }

        console.log('📊 Buscando estatísticas para tenant:', tenantId);

        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE tenant_id = ?',
            [tenantId]
        );

        const total = orders.length;
        const pending = orders.filter(o =>
            o.status === 'pending' || o.status === 'Pendente'
        ).length;

        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => {
            if (!o.created_at) return false;
            const date = new Date(o.created_at);
            return date.toISOString().split('T')[0] === today;
        });
        const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        const avgTicket = total > 0 ? orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) / total : 0;

        res.json({
            success: true,
            data: {
                total,
                pending,
                todayRevenue,
                avgTicket,
                recentOrders: orders.slice(0, 10).map(o => ({
                    ...o,
                    items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
                }))
            }
        });
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao carregar estatísticas: ' + error.message
        });
    }
});

// ============================================================
//  ROTA DE DASHBOARD - ESTATÍSTICAS AVANÇADAS (NOVA)
// ============================================================
app.get('/api/stats/dashboard', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({
                success: false,
                error: 'Tenant não encontrado'
            });
        }

        const { period = 'today' } = req.query;
        console.log(`📊 Dashboard - Período: ${period}, Tenant: ${tenantId}`);

        let startDate = new Date();

        switch (period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                const day = startDate.getDay();
                startDate.setDate(startDate.getDate() - day);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'all':
                startDate = new Date(0);
                break;
            default:
                startDate.setHours(0, 0, 0, 0);
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        console.log(`📅 Data inicial: ${startDateStr}`);

        const [orders] = await pool.query(
            `SELECT * FROM orders 
             WHERE tenant_id = ? 
               AND DATE(created_at) >= ? 
             ORDER BY created_at DESC`,
            [tenantId, startDateStr]
        );

        console.log(`📦 Pedidos encontrados: ${orders.length}`);

        const salesMap = {};
        orders.forEach(order => {
            const date = new Date(order.created_at).toISOString().split('T')[0];
            if (!salesMap[date]) {
                salesMap[date] = { date, total: 0, orders: 0 };
            }
            salesMap[date].total += parseFloat(order.total || 0);
            salesMap[date].orders += 1;
        });

        const salesData = Object.values(salesMap).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        if (salesData.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            salesData.push({ date: today, total: 0, orders: 0 });
        }

        const statusCount = {};
        orders.forEach(order => {
            const status = order.status || 'pending';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        const statusMap = {
            'pending': '🟡 Pendente',
            'confirmado': '🟢 Confirmado',
            'entregue': '✅ Entregue',
            'cancelado': '❌ Cancelado'
        };

        const statusData = Object.entries(statusCount).map(([key, value]) => ({
            name: statusMap[key] || key,
            value
        }));

        if (statusData.length === 0) {
            statusData.push({ name: '🟡 Pendente', value: 0 });
        }

        const productSales = {};
        orders.forEach(order => {
            let items = order.items;
            if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch (e) { items = []; }
            }
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const name = item.name || 'Produto';
                    if (!productSales[name]) {
                        productSales[name] = { name, quantity: 0 };
                    }
                    productSales[name].quantity += item.qty || 1;
                });
            }
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        if (topProducts.length === 0) {
            topProducts.push({ name: 'Nenhum produto vendido', quantity: 0 });
        }

        res.json({
            success: true,
            data: {
                salesData,
                statusData,
                topProducts
            }
        });

    } catch (error) {
        console.error('❌ Erro no dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao carregar dados do dashboard: ' + error.message
        });
    }
});

// ============================================================
//  ROTAS DE TENANT
// ============================================================

app.get('/api/tenant', (req, res) => {
    const tenant = req.tenantId;
    if (!tenant) {
        return res.status(404).json({
            success: false,
            error: 'Tenant não encontrado'
        });
    }
    res.json({
        success: true,
        data: {
            subdomain: tenant,
            url: `https://${tenant}.smartdelivery.com`
        }
    });
});

// ============================================================
//  ROTAS DE ARQUIVOS ESTÁTICOS (VERSÃO RENDER - CORRIGIDA)
// ============================================================

const PROJECT_ROOT = path.join(__dirname, '..');

console.log('📁 PROJECT_ROOT:', PROJECT_ROOT);
console.log('📁 __dirname:', __dirname);

const REACT_BUILD_PATH = path.join(__dirname, '../frontend-react/dist');
if (fs.existsSync(REACT_BUILD_PATH)) {
    console.log('📦 Servindo build do React:', REACT_BUILD_PATH);
    app.use(express.static(REACT_BUILD_PATH));

    app.get('/admin*', (req, res) => {
        res.sendFile(path.join(REACT_BUILD_PATH, 'index.html'));
    });

    app.get('/', (req, res) => {
        res.sendFile(path.join(REACT_BUILD_PATH, 'index.html'));
    });

    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/') &&
            !req.path.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
            res.sendFile(path.join(REACT_BUILD_PATH, 'index.html'));
        }
    });
} else {
    console.log('⚠️ Build do React não encontrado. Servindo Vanilla.');
}

app.get('/register.html', (req, res) => {
    const filePath = path.join(PROJECT_ROOT, 'frontend/public/register.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Página não encontrada');
    }
});

app.get('/login.html', (req, res) => {
    const filePath = path.join(PROJECT_ROOT, 'frontend/public/login.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Página não encontrada');
    }
});

app.use(express.static(path.join(PROJECT_ROOT, 'frontend/public')));
app.use('/admin', express.static(path.join(PROJECT_ROOT, 'frontend/admin')));

app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, error: 'Endpoint não encontrado' });
    }
    const reactIndexPath = path.join(REACT_BUILD_PATH, 'index.html');
    if (fs.existsSync(reactIndexPath)) {
        res.sendFile(reactIndexPath);
    } else {
        const vanillaPath = path.join(PROJECT_ROOT, 'frontend/public/index.html');
        res.sendFile(vanillaPath, (err) => {
            if (err) res.status(404).send('Página não encontrada');
        });
    }
});

// ============================================================
//  RATE LIMITING
// ============================================================

const tenantLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req) => {
        return req.tenantId || req.ip;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Muitas requisições. Tente novamente em alguns segundos.'
        });
    }
});

app.use('/api/', tenantLimiter);

// ============================================================
//  ROTA DE DELETE DE IMAGEM (CORRIGIDA - ÚNICA VERSÃO)
// ============================================================
app.post('/api/upload/delete', verifyToken, async (req, res) => {
    try {
        const { public_id, config_key } = req.body;
        const tenantId = req.tenantId;

        if (!public_id) {
            return res.status(400).json({ success: false, error: 'public_id é obrigatório' });
        }

        console.log('🗑️ Deletando imagem:', public_id);

        await deleteImage(public_id);

        if (config_key) {
            await pool.query(
                `UPDATE config SET config_value = NULL 
                 WHERE tenant_id = ? AND config_key = ?`,
                [tenantId, config_key]
            );
        }

        res.json({ success: true, message: 'Imagem removida com sucesso!' });
    } catch (error) {
        console.error('❌ Erro ao deletar imagem:', error);
        res.status(500).json({ success: false, error: 'Erro ao deletar imagem: ' + error.message });
    }
});

// ============================================================
//  WEBSOCKET - NOTIFICAÇÕES EM TEMPO REAL
// ============================================================

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:5173', 'https://smart-delivery-saas.onrender.com'],
        credentials: true
    }
});

io.use((socket, next) => {
    const tenant = socket.handshake.query.tenant;
    if (!tenant) {
        return next(new Error('Tenant não informado'));
    }
    socket.tenant = tenant;
    next();
});

io.on('connection', (socket) => {
    const tenant = socket.tenant;
    console.log(`🔌 Cliente conectado ao tenant: ${tenant}`);

    socket.join(`tenant-${tenant}`);

    socket.emit('connected', {
        message: 'Conectado ao servidor de notificações',
        tenant: tenant
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado ao tenant: ${tenant}`);
    });
});

app.set('io', io);

// ============================================================
//  INICIAR SERVIDOR COM WEBSOCKET
// ============================================================

testDatabaseConnection().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Servidor Smart Delivery SaaS rodando em http://localhost:${PORT}`);
        console.log(`📱 Cliente: http://localhost:${PORT}`);
        console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
        console.log(`🔌 WebSocket ativo para notificações em tempo real`);
        console.log('🏷️ Multi-tenant habilitado');
        console.log('⚡ Rate Limiting: 100 req/min por tenant');
        console.log('🔒 Conexão SSL com TiDB Cloud ativada');
        console.log('☁️ Cloudinary integrado para upload de imagens');
        console.log('✅ Server ready!');
    });
});