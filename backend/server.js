require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//  CONFIGURAÇÃO DO BANCO DE DADOS
// ============================================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER || '39E87ruqfSzYfRX.root',
    password: process.env.DB_PASSWORD || '8inwhBgD2ePqz8HH',
    database: 'smart_delivery_saas',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: true }
});

const promisePool = pool.promise();

// ============================================================
//  REDIS (CACHE) - OPCIONAL
// ============================================================
let client = null;
let redisAvailable = false;

try {
    const redis = require('redis');
    client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
            connectTimeout: 3000,
            reconnectStrategy: false
        }
    });
    
    client.on('error', () => {
        if (redisAvailable) {
            redisAvailable = false;
            console.log('⚠️ Redis desconectado - cache desabilitado');
        }
    });
    
    client.on('connect', () => {
        redisAvailable = true;
        console.log('✅ Redis conectado');
    });
    
    client.connect().catch(() => {
        redisAvailable = false;
    });
    
    setTimeout(() => {
        if (!redisAvailable) {
            console.log('⚠️ Redis não disponível - cache desabilitado');
        }
    }, 2000);
    
} catch (e) {
    console.log('⚠️ Redis não instalado - cache desabilitado');
}

// ============================================================
//  MIDDLEWARE DE TENANT
// ============================================================
async function getTenantId(req) {
    if (req.headers['x-tenant-id']) {
        return req.headers['x-tenant-id'];
    }
    const host = req.headers.host || '';
    const parts = host.split('.');
    if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'smart-delivery') {
        return parts[0];
    }
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_saas_secret');
            return decoded.tenant_id;
        } catch (e) {}
    }
    throw new Error('Tenant não identificado');
}

// ============================================================
//  MIDDLEWARES
// ============================================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting - Configuração simplificada
const tenantLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    // Usar apenas o tenant ID como chave
    keyGenerator: (req) => {
        return req.headers['x-tenant-id'] || 'anonymous';
    },
    skip: (req) => {
        // Pular rate limit para rotas de health check
        return req.path === '/api/health';
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Muitas requisições. Tente novamente em alguns segundos.'
        });
    }
});
app.use('/api', tenantLimiter);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

// ============================================================
//  ROTA DE TESTE
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Smart Delivery SaaS API rodando!' });
});

// ============================================================
//  ROTAS - AUTH
// ============================================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await promisePool.query(
            'SELECT u.*, t.id as tenant_id, t.subdomain, t.name as tenant_name FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = ?',
            [email]
        );
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
        }
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
        }
        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, role: user.role },
            process.env.JWT_SECRET || 'smart_saas_secret',
            { expiresIn: '7d' }
        );
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tenant_id: user.tenant_id,
                    tenant_name: user.tenant_name,
                    subdomain: user.subdomain
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, tenant_name, subdomain, phone } = req.body;
        const [existing] = await promisePool.query('SELECT id FROM tenants WHERE subdomain = ?', [subdomain]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Subdomínio já está em uso' });
        }
        const tenantId = uuidv4();
        await promisePool.query(
            'INSERT INTO tenants (id, name, subdomain, email, phone) VALUES (?, ?, ?, ?, ?)',
            [tenantId, tenant_name, subdomain, email, phone]
        );
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await promisePool.query(
            'INSERT INTO users (tenant_id, name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [tenantId, name, email, hashedPassword, phone, 'admin']
        );
        const userId = result.insertId;
        const defaultConfig = [
            ['store_name', tenant_name],
            ['store_phone', phone],
            ['delivery_fee', '3.00'],
            ['open_time', '09:00'],
            ['close_time', '22:00'],
            ['is_open', 'true']
        ];
        for (const [key, value] of defaultConfig) {
            await promisePool.query(
                'INSERT INTO config (tenant_id, config_key, config_value) VALUES (?, ?, ?)',
                [tenantId, key, value]
            );
        }
        const defaultCategories = ['Hambúrgueres', 'Adicionais', 'Acompanhamentos', 'Promoções', 'Bebidas'];
        for (let i = 0; i < defaultCategories.length; i++) {
            await promisePool.query(
                'INSERT INTO categories (tenant_id, name, display_order) VALUES (?, ?, ?)',
                [tenantId, defaultCategories[i], i + 1]
            );
        }
        const token = jwt.sign(
            { userId, tenantId, role: 'admin' },
            process.env.JWT_SECRET || 'smart_saas_secret',
            { expiresIn: '7d' }
        );
        res.status(201).json({
            success: true,
            data: {
                token,
                user: { id: userId, name, email, role: 'admin', tenant_id: tenantId }
            }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================
//  ROTAS - PRODUTOS (COM CACHE OPCIONAL)
// ============================================================
app.get('/api/products', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const { active_only } = req.query;
        const cacheKey = `products:${tenantId}:${active_only || 'all'}`;
        
        if (redisAvailable && client) {
            try {
                const cached = await client.get(cacheKey);
                if (cached) {
                    return res.json({ success: true, data: JSON.parse(cached), cached: true });
                }
            } catch (e) {}
        }
        
        let sql = 'SELECT * FROM products WHERE tenant_id = ?';
        const params = [tenantId];
        if (active_only === 'true') {
            sql += ' AND active = 1';
        }
        sql += ' ORDER BY id DESC';
        const [rows] = await promisePool.query(sql, params);
        
        if (redisAvailable && client) {
            try {
                await client.setEx(cacheKey, 300, JSON.stringify(rows));
            } catch (e) {}
        }
        
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const { name, description, price, category, active, image_url } = req.body;
        const [result] = await promisePool.query(
            'INSERT INTO products (tenant_id, name, description, price, category, active, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [tenantId, name, description, price, category, active !== undefined ? active : true, image_url || null]
        );
        const [rows] = await promisePool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
        
        if (redisAvailable && client) {
            try {
                const keys = await client.keys(`products:${tenantId}:*`);
                for (const key of keys) {
                    await client.del(key);
                }
            } catch (e) {}
        }
        
        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const { name, description, price, category, active, image_url } = req.body;
        const [result] = await promisePool.query(
            'UPDATE products SET name = ?, description = ?, price = ?, category = ?, active = ?, image_url = ? WHERE id = ? AND tenant_id = ?',
            [name, description, price, category, active !== undefined ? active : true, image_url || null, req.params.id, tenantId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado' });
        }
        const [rows] = await promisePool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        
        if (redisAvailable && client) {
            try {
                const keys = await client.keys(`products:${tenantId}:*`);
                for (const key of keys) {
                    await client.del(key);
                }
            } catch (e) {}
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const [result] = await promisePool.query(
            'DELETE FROM products WHERE id = ? AND tenant_id = ?',
            [req.params.id, tenantId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado' });
        }
        
        if (redisAvailable && client) {
            try {
                const keys = await client.keys(`products:${tenantId}:*`);
                for (const key of keys) {
                    await client.del(key);
                }
            } catch (e) {}
        }
        
        res.json({ success: true, message: 'Produto removido com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================
//  ROTAS - CATEGORIAS
// ============================================================
app.get('/api/categories', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const cacheKey = `categories:${tenantId}`;
        
        if (redisAvailable && client) {
            try {
                const cached = await client.get(cacheKey);
                if (cached) {
                    return res.json({ success: true, data: JSON.parse(cached), cached: true });
                }
            } catch (e) {}
        }
        
        const [rows] = await promisePool.query(
            'SELECT * FROM categories WHERE tenant_id = ? ORDER BY display_order ASC',
            [tenantId]
        );
        
        if (redisAvailable && client) {
            try {
                await client.setEx(cacheKey, 300, JSON.stringify(rows));
            } catch (e) {}
        }
        
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const { name, display_order } = req.body;
        const [existing] = await promisePool.query(
            'SELECT id FROM categories WHERE tenant_id = ? AND name = ?',
            [tenantId, name]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Categoria já existe' });
        }
        const [result] = await promisePool.query(
            'INSERT INTO categories (tenant_id, name, display_order) VALUES (?, ?, ?)',
            [tenantId, name, display_order || 0]
        );
        const [rows] = await promisePool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
        
        if (redisAvailable && client) {
            try {
                await client.del(`categories:${tenantId}`);
            } catch (e) {}
        }
        
        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const { name, display_order } = req.body;
        const [result] = await promisePool.query(
            'UPDATE categories SET name = ?, display_order = ? WHERE id = ? AND tenant_id = ?',
            [name, display_order || 0, req.params.id, tenantId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
        }
        const [rows] = await promisePool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        
        if (redisAvailable && client) {
            try {
                await client.del(`categories:${tenantId}`);
            } catch (e) {}
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const [result] = await promisePool.query(
            'DELETE FROM categories WHERE id = ? AND tenant_id = ?',
            [req.params.id, tenantId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
        }
        
        if (redisAvailable && client) {
            try {
                await client.del(`categories:${tenantId}`);
            } catch (e) {}
        }
        
        res.json({ success: true, message: 'Categoria removida com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================
//  ROTAS - ORDERS
// ============================================================
app.get('/api/orders', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const [rows] = await promisePool.query(
            'SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC',
            [tenantId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const orderData = req.body;
        const orderNumber = '#' + Date.now().toString().slice(-6);
        const [result] = await promisePool.query(
            `INSERT INTO orders (
                tenant_id, order_number, customer_name, customer_email, customer_phone, customer_address,
                items, subtotal, delivery_fee, discount, total, payment_method,
                delivery_type, scheduled_time, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tenantId, orderNumber,
                orderData.customer_name || 'Cliente',
                orderData.customer_email || '',
                orderData.customer_phone || '',
                orderData.customer_address || '',
                JSON.stringify(orderData.items || []),
                orderData.subtotal || 0,
                orderData.delivery_fee || 0,
                orderData.discount || 0,
                orderData.total || 0,
                orderData.payment_method || 'Dinheiro',
                orderData.delivery_type || 'delivery',
                orderData.scheduled_time || null,
                'pending',
                orderData.notes || ''
            ]
        );
        const [order] = await promisePool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, data: order[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const { status } = req.body;
        const [result] = await promisePool.query(
            'UPDATE orders SET status = ? WHERE id = ? AND tenant_id = ?',
            [status, req.params.id, tenantId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
        }
        const [rows] = await promisePool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================
//  ROTAS - CONFIG
// ============================================================
app.get('/api/config', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const [rows] = await promisePool.query(
            'SELECT config_key, config_value FROM config WHERE tenant_id = ?',
            [tenantId]
        );
        const config = {};
        rows.forEach(row => config[row.config_key] = row.config_value);
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/config', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const updates = req.body;
        for (const [key, value] of Object.entries(updates)) {
            const [existing] = await promisePool.query(
                'SELECT id FROM config WHERE tenant_id = ? AND config_key = ?',
                [tenantId, key]
            );
            if (existing.length > 0) {
                await promisePool.query(
                    'UPDATE config SET config_value = ? WHERE tenant_id = ? AND config_key = ?',
                    [value, tenantId, key]
                );
            } else {
                await promisePool.query(
                    'INSERT INTO config (tenant_id, config_key, config_value) VALUES (?, ?, ?)',
                    [tenantId, key, value]
                );
            }
        }
        const [rows] = await promisePool.query(
            'SELECT config_key, config_value FROM config WHERE tenant_id = ?',
            [tenantId]
        );
        const config = {};
        rows.forEach(row => config[row.config_key] = row.config_value);
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================
//  ROTAS - TENANT INFO
// ============================================================
app.get('/api/tenant', async (req, res) => {
    try {
        const tenantId = await getTenantId(req);
        const [rows] = await promisePool.query(
            'SELECT id, name, subdomain, cnpj, email, phone, plan, status, settings FROM tenants WHERE id = ?',
            [tenantId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tenant não encontrado' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================
//  ROTAS PRINCIPAIS
// ============================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});

// ============================================================
//  INICIAR SERVIDOR
// ============================================================
app.listen(PORT, () => {
    console.log('🚀 Servidor Smart Delivery SaaS rodando em http://localhost:' + PORT);
    console.log('📱 Cliente: http://localhost:' + PORT);
    console.log('🔐 Admin: http://localhost:' + PORT + '/admin');
    console.log('🏷️ Multi-tenant habilitado');
    console.log('⚡ Rate Limiting: 100 req/min por tenant');
    console.log(redisAvailable ? '✅ Cache Redis ativado' : '⚠️ Cache Redis desativado');
});
