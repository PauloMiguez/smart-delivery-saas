// ============================================================
// SMART DELIVERY SAAS - SERVER COMPLETO (VERSÃO RENDER - CORRIGIDA)
// ============================================================
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//  MIDDLEWARES
// ============================================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================
//  CONEXÃO COM O BANCO DE DADOS (VERSÃO RENDER - CORRIGIDA)
// ============================================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER || '39E87ruqfSzYfRX.root',
    password: process.env.DB_PASSWORD || '8inwhBgD2ePqz8HH',
    database: process.env.DB_NAME || 'smart_delivery_saas',
    ssl: {
        rejectUnauthorized: false // Permite conexão mesmo com certificado auto-assinado
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// ============================================================
//  TESTE DE CONEXÃO COM O BANCO
// ============================================================
async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
        console.log('📊 Banco:', process.env.DB_NAME || 'smart_delivery_saas');
        console.log('📍 Host:', process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco de dados:');
        console.error('   Mensagem:', error.message);
        console.error('   Código:', error.code);
        console.error('   Detalhes:', error);
        return false;
    }
}

// ============================================================
//  TENANT MIDDLEWARE
// ============================================================
app.use((req, res, next) => {
    // Ignorar rotas públicas
    const publicRoutes = ['/api/health', '/api/auth/login', '/api/auth/register'];
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
//  ROTAS DE AUTENTICAÇÃO
// ============================================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
        }

        console.log('🔐 Tentativa de login:', email);

        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log('❌ Usuário não encontrado:', email);
            return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            console.log('❌ Senha inválida para:', email);
            return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });
        }

        console.log('✅ Login bem-sucedido:', email);

        const token = generateToken(user.id, user.tenant_id);
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
        res.status(500).json({ success: false, error: 'Erro interno do servidor: ' + error.message });
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
            'SELECT * FROM users WHERE tenant_id = ?',
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

        // Inserir usuário
        const [result] = await pool.query(
            `INSERT INTO users (tenant_id, name, email, phone, password_hash, role) 
             VALUES (?, ?, ?, ?, ?, 'admin')`,
            [subdomain, ownerName, email, phone || null, passwordHash]
        );

        // Criar configurações padrão para a loja
        await pool.query(
            `INSERT INTO config (tenant_id, store_name, is_open) 
             VALUES (?, ?, 'true')`,
            [subdomain, restaurantName]
        );

        console.log('✅ Registro concluído:', email);

        // Gerar token
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
            `INSERT INTO products (tenant_id, name, description, price, category, active, image) 
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
             SET name = ?, description = ?, price = ?, category = ?, active = ?, image = ?
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
            `SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC`,
            [tenantId]
        );

        // Processar items JSON
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

// Criar pedido
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
            total,
            delivery_fee = 0,
            payment_method = 'dinheiro'
        } = req.body;

        if (!customer_name || !customer_address || !items || !total) {
            return res.status(400).json({
                success: false,
                error: 'Nome, endereço, itens e total são obrigatórios'
            });
        }

        // Gerar número do pedido
        const orderNumber = '#' + Date.now().toString().slice(-6);

        const [result] = await pool.query(
            `INSERT INTO orders (
                tenant_id, order_number, customer_name, customer_phone, 
                customer_address, items, total, delivery_fee, 
                payment_method, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [
                tenantId,
                orderNumber,
                customer_name,
                customer_phone || null,
                customer_address,
                JSON.stringify(items),
                total,
                delivery_fee,
                payment_method
            ]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId, order_number: orderNumber },
            message: 'Pedido criado com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar pedido' });
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
//  ROTAS DE CONFIGURAÇÕES
// ============================================================

// Obter configurações
app.get('/api/config', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({ success: false, error: 'Tenant não encontrado' });
        }

        let [config] = await pool.query(
            'SELECT * FROM config WHERE tenant_id = ?',
            [tenantId]
        );

        if (config.length === 0) {
            // Criar configurações padrão
            await pool.query(
                `INSERT INTO config (tenant_id, store_name, is_open) VALUES (?, 'Minha Loja', 'true')`,
                [tenantId]
            );
            [config] = await pool.query(
                'SELECT * FROM config WHERE tenant_id = ?',
                [tenantId]
            );
        }

        res.json({ success: true, data: config[0] });
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        res.status(500).json({ success: false, error: 'Erro ao carregar configurações' });
    }
});

// Atualizar configurações
app.put('/api/config', verifyToken, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const {
            store_name,
            store_phone,
            store_address,
            delivery_fee,
            open_time,
            close_time,
            is_open,
            banner_image,
            logo_image
        } = req.body;

        const [result] = await pool.query(
            `UPDATE config SET
                store_name = ?,
                store_phone = ?,
                store_address = ?,
                delivery_fee = ?,
                open_time = ?,
                close_time = ?,
                is_open = ?,
                banner_image = ?,
                logo_image = ?,
                updated_at = NOW()
             WHERE tenant_id = ?`,
            [
                store_name || null,
                store_phone || null,
                store_address || null,
                delivery_fee || '0.00',
                open_time || '09:00',
                close_time || '22:00',
                is_open || 'true',
                banner_image || null,
                logo_image || null,
                tenantId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Configurações não encontradas' });
        }

        res.json({ success: true, message: 'Configurações salvas com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        res.status(500).json({ success: false, error: 'Erro ao salvar configurações' });
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

        // Buscar todos os pedidos do tenant
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE tenant_id = ?',
            [tenantId]
        );

        const total = orders.length;
        
        // Pedidos pendentes (status 'pending' ou 'Pendente')
        const pending = orders.filter(o => 
            o.status === 'pending' || o.status === 'Pendente'
        ).length;
        
        // Faturamento de hoje
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => {
            if (!o.created_at) return false;
            const date = new Date(o.created_at);
            return date.toISOString().split('T')[0] === today;
        });
        const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        
        // Ticket médio
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

// __dirname no Render está em /opt/render/project/src/backend
// Precisamos subir um nível para a raiz do projeto
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
        // Usar o tenant ID se disponível, senão o IP
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
    // Se for uma requisição de API, retornar 404 JSON
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'Endpoint não encontrado'
        });
    }
    // Para rotas HTML não encontradas, servir o index.html (SPA)
    const indexPath = path.join(PROJECT_ROOT, 'frontend/public/index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(404).send('Página não encontrada');
        }
    });
});

// ============================================================
//  INICIAR SERVIDOR
// ============================================================

// Testar conexão com o banco antes de iniciar
testDatabaseConnection().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor Smart Delivery SaaS rodando em http://localhost:${PORT}`);
        console.log(`📱 Cliente: http://localhost:${PORT}`);
        console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
        console.log('🏷️ Multi-tenant habilitado');
        console.log('⚡ Rate Limiting: 100 req/min por tenant');
        console.log('🔒 Conexão SSL com TiDB Cloud ativada');
        console.log('✅ Server ready!');
    });
});