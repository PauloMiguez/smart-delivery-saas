// ============================================================
// SMART DELIVERY SAAS - SERVER COMPLETO (COM CLOUDINARY)
// ============================================================
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

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
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 30000,
    acquireTimeout: 30000,
    timeout: 30000
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
//  TENANT MIDDLEWARE
// ============================================================
app.use((req, res, next) => {
    // Ignorar rotas públicas
    const publicRoutes = ['/api/health', '/api/auth/login', '/api/auth/register', '/api/test-db'];
    if (publicRoutes.includes(req.path)) {
        return next();
    }

    // 1. Tentar da query string
    if (req.query.tenant) {
        req.tenantId = req.query.tenant;
        console.log('🏷️ Tenant da query:', req.tenantId);
        return next();
    }

    // 2. Tentar do header
    if (req.headers['x-tenant-id']) {
        req.tenantId = req.headers['x-tenant-id'];
        console.log('🏷️ Tenant do header:', req.tenantId);
        return next();
    }

    // 3. Tentar do subdomínio
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

    // 4. Para requisições de arquivos estáticos, passar sem tenant
    if (req.path.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
        return next();
    }

    // 5. Fallback - retornar erro para rotas de API
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

// Gerar token JWT
function generateToken(userId, tenantId) {
    return jwt.sign({ userId, tenantId }, JWT_SECRET, { expiresIn: '7d' });
}

// Middleware para verificar token
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
//  ROTAS DE AUTENTICAÇÃO (CORRIGIDAS - COLUNA 'password')
// ============================================================

// Login
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
        
        // USANDO 'password' (NÃO 'password_hash')
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

// Registro
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

        // Validações
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

        // Verificar se subdomínio já existe
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

        // Verificar se email já está cadastrado
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

        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // INICIAR TRANSAÇÃO
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Criar o tenant
            await connection.query(
                `INSERT INTO tenants (id, name, subdomain, email, phone, plan, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [subdomain, restaurantName, subdomain, email, phone || null, 'free', 'active']
            );

            // 2. Inserir o usuário
            const [result] = await connection.query(
                `INSERT INTO users (tenant_id, name, email, phone, password, role) 
                 VALUES (?, ?, ?, ?, ?, 'admin')`,
                [subdomain, ownerName, email, phone || null, passwordHash]
            );

            // 3. Criar configurações padrão (usando config_key / config_value)
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

// Listar produtos
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

// Criar produto
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

// Atualizar produto
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

// Deletar produto
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

// Listar categorias
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

// Criar categoria
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

// Atualizar categoria
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

// Deletar categoria
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

// Listar pedidos
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

// Criar pedido - CORRIGIDO COM SUBTOTAL
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

        const orderNumber = '#' + Date.now().toString().slice(-6);

        const [result] = await pool.query(
            `INSERT INTO orders (
                tenant_id, order_number, customer_name, customer_phone, 
                customer_address, items, subtotal, total, delivery_fee, 
                payment_method, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
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
                payment_method
            ]
        );

        console.log('✅ Pedido criado:', orderNumber);

        res.status(201).json({
            success: true,
            data: { id: result.insertId, order_number: orderNumber },
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

// Atualizar status do pedido
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

        res.json({ success: true, message: 'Status atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar status' });
    }
});

// ============================================================
//  ROTAS DE CONFIGURAÇÕES (CHAVE-VALOR) - CORRIGIDA
// ============================================================

// Obter configurações
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

        // Verificar se o tenant existe
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

        // Buscar configurações
        console.log('🔍 [CONFIG] Buscando configurações...');
        const [rows] = await pool.query(
            'SELECT config_key, config_value FROM config WHERE tenant_id = ?',
            [tenantId]
        );

        console.log('📊 [CONFIG] Linhas encontradas:', rows.length);

        // Converter array de chave-valor para objeto
        const config = {};
        rows.forEach(row => {
            config[row.config_key] = row.config_value;
        });

        // Adicionar valores padrão se não existirem
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

        // Mesclar com valores do banco
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

// Atualizar configurações
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
                // Converter booleanos para string
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

// Upload de Banner
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

        // Salvar também o public_id para futura remoção
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

// Upload de Logo
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

// Upload de Imagem de Produto
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
//  ROTAS DE ARQUIVOS ESTÁTICOS (VERSÃO RENDER)
// ============================================================

const PROJECT_ROOT = path.join(__dirname, '..');

console.log('📁 PROJECT_ROOT:', PROJECT_ROOT);
console.log('📁 __dirname:', __dirname);

// Servir arquivos estáticos do frontend (cliente)
app.use(express.static(path.join(PROJECT_ROOT, 'frontend/public')));

// Servir arquivos estáticos do admin
app.use('/admin', express.static(path.join(PROJECT_ROOT, 'frontend/admin')));

// Rota para admin (com e sem barra)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'frontend/admin/index.html'));
});

app.get('/admin/', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'frontend/admin/index.html'));
});

// Rota para login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'frontend/public/login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'frontend/public/login.html'));
});

// Rota para register.html
app.get('/register', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'frontend/public/register.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'frontend/public/register.html'));
});

// Rota para index.html (cliente)
app.get('/', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'frontend/public/index.html'));
});

// Rota para qualquer outra página HTML (fallback)
app.get('/*.html', (req, res) => {
    const fileName = req.path.split('/').pop();
    const filePath = path.join(PROJECT_ROOT, 'frontend/public', fileName);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('Página não encontrada');
        }
    });
});

// ============================================================
//  RATE LIMITING (CORRIGIDO)
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
//  FALLBACK PARA ROTAS NÃO ENCONTRADAS (ÚLTIMA ROTA)
// ============================================================

app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'Endpoint não encontrado'
        });
    }
    const indexPath = path.join(PROJECT_ROOT, 'frontend/public/index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(404).send('Página não encontrada');
        }
    });
});

// ============================================================
//  SERVE REACT BUILD (SE EXISTIR)
// ============================================================
const REACT_BUILD_PATH = path.join(__dirname, '../frontend-react/dist');
if (fs.existsSync(REACT_BUILD_PATH)) {
    console.log('📦 Servindo build do React:', REACT_BUILD_PATH);
    app.use(express.static(REACT_BUILD_PATH));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/') && !req.path.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
            res.sendFile(path.join(REACT_BUILD_PATH, 'index.html'));
        }
    });
}

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

        // Deletar do Cloudinary usando a função do upload.js
        await deleteImage(public_id);

        // Remover do banco (se tiver config_key)
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
//  INICIAR SERVIDOR
// ============================================================

testDatabaseConnection().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor Smart Delivery SaaS rodando em http://localhost:${PORT}`);
        console.log(`📱 Cliente: http://localhost:${PORT}`);
        console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
        console.log('🏷️ Multi-tenant habilitado');
        console.log('⚡ Rate Limiting: 100 req/min por tenant');
        console.log('🔒 Conexão SSL com TiDB Cloud ativada');
        console.log('☁️ Cloudinary integrado para upload de imagens');
        console.log('✅ Server ready!');
    });
});