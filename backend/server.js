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
//  CONFIGURAR FUSO HORÁRIO PARA BRASIL (UTC-3)
// ============================================================
process.env.TZ = 'America/Sao_Paulo';
console.log(`🕐 Fuso horário configurado: ${process.env.TZ}`);
console.log(`🕐 Hora atual: ${new Date().toLocaleString('pt-BR')}`);

// ============================================================
//  IMPORTS CLOUDINARY
// ============================================================
const { uploadBanner, uploadLogo, uploadProduct, deleteImage } = require('./upload');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// ============================================================
//  FUNÇÕES AUXILIARES PARA DATA COM FUSO HORÁRIO LOCAL
// ============================================================
function getTodayLocal() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function createLocalDate(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// ============================================================
//  FUNÇÃO PARA CALCULAR TAXA DE ENTREGA DINÂMICA
// ============================================================
// ============================================================
//  FUNÇÃO PARA CALCULAR TAXA DE ENTREGA DINÂMICA - CORRIGIDA
// ============================================================
function calcularTaxaEntrega(tenantId, endereco, config) {
    // Se for fixa, retorna o valor fixo
    if (config.delivery_type === 'fixa') {
        return { fee: parseFloat(config.delivery_fee) || 0, found: true };
    }

    // Se for manual, retorna 0 (será definido depois)
    if (config.delivery_type === 'manual') {
        return { fee: 0, found: false, message: 'Taxa informada após o pedido' };
    }

    // Se for dinâmica, buscar por bairro
    if (config.delivery_type === 'dinamica') {
        try {
            const zones = JSON.parse(config.delivery_zones || '[]');

            if (zones.length === 0) {
                return { fee: 0, found: false, message: 'Nenhum bairro cadastrado' };
            }

            // Extrair bairro do endereço
            const addressParts = endereco.split(',');
            let bairro = '';
            if (addressParts.length >= 2) {
                const parts = addressParts.map(p => p.trim());
                // O bairro geralmente é o penúltimo elemento
                if (parts.length >= 3) {
                    bairro = parts[parts.length - 2];
                } else if (parts.length === 2) {
                    bairro = parts[1];
                }
            }

            console.log(`🔍 Buscando bairro: "${bairro}" em ${zones.length} zonas`);

            // Buscar zona que corresponde ao bairro (case insensitive)
            const zone = zones.find(z =>
                z.bairro && bairro.toLowerCase().includes(z.bairro.toLowerCase())
            );

            if (zone) {
                console.log(`✅ Bairro encontrado: ${zone.bairro} - Taxa: R$ ${zone.valor}`);
                return { fee: parseFloat(zone.valor) || 0, found: true };
            }

            // ❌ Bairro não encontrado - retornar 0 com mensagem
            console.log(`❌ Bairro "${bairro}" não encontrado na lista`);
            return { fee: 0, found: false, message: 'Bairro não cadastrado - taxa será informada após o pedido' };
        } catch (error) {
            console.error('Erro ao calcular taxa dinâmica:', error);
            return { fee: 0, found: false, message: 'Erro ao calcular taxa' };
        }
    }

    return { fee: parseFloat(config.delivery_fee) || 0, found: true };
}
// ============================================================
//  FUNÇÃO PARA VERIFICAR SE A LOJA ESTÁ ABERTA AGORA
// ============================================================
async function checkStoreOpenNow(tenantId) {
    try {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentTime = now.toTimeString().split(' ')[0];

        const [configRows] = await pool.query(
            'SELECT config_value FROM config WHERE tenant_id = ? AND config_key = ?',
            [tenantId, 'is_open']
        );

        const isManuallyOpen = configRows.length > 0 && configRows[0].config_value === 'true';
        if (!isManuallyOpen) {
            console.log('🏪 Loja desativada manualmente');
            return false;
        }

        const [operatingHours] = await pool.query(
            `SELECT * FROM operating_hours 
             WHERE tenant_id = ? AND day_of_week = ? AND is_open = 1`,
            [tenantId, dayOfWeek]
        );

        if (operatingHours.length === 0) {
            console.log('🏪 Sem horário configurado para hoje');
            return false;
        }

        const hours = operatingHours[0];

        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        const [openHour, openMinute] = hours.open_time.split(':').map(Number);
        const [closeHour, closeMinute] = hours.close_time.split(':').map(Number);

        const currentMinutes = currentHour * 60 + currentMinute;
        const openMinutes = openHour * 60 + openMinute;
        let closeMinutes = closeHour * 60 + closeMinute;

        if (closeMinutes <= openMinutes) {
            closeMinutes += 24 * 60;
        }

        const isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;

        let isBreak = false;
        if (hours.break_start && hours.break_end) {
            const [breakHour, breakMinute] = hours.break_start.split(':').map(Number);
            const [breakEndHour, breakEndMinute] = hours.break_end.split(':').map(Number);
            const breakStartMinutes = breakHour * 60 + breakMinute;
            const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

            isBreak = currentMinutes >= breakStartMinutes && currentMinutes <= breakEndMinutes;
        }

        const result = isOpen && !isBreak;
        console.log(`🏪 Loja ${result ? 'ABERTA' : 'FECHADA'} agora`);
        return result;
    } catch (error) {
        console.error('❌ Erro ao verificar status da loja:', error);
        return false;
    }
}

// ============================================================
//  VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// ============================================================
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:', missingVars.join(', '));
    console.error('⚠️  Configure o arquivo .env com todas as variáveis necessárias');
    if (isProduction) {
        console.error('🚨 Servidor encerrado em produção por falta de variáveis');
        process.exit(1);
    }
}

// ============================================================
//  MIDDLEWARES - CORS CONFIGURADO
// ============================================================
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://smart-delivery-saas.onrender.com',
        'http://localhost:3000'
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================
//  CONEXÃO COM O BANCO DE DADOS
// ============================================================
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 60000
});

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
console.log('   Host:', process.env.DB_HOST);
console.log('   Database:', process.env.DB_NAME);
console.log('   User:', process.env.DB_USER);

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
    const publicRoutes = [
        '/api/health',
        '/api/auth/login',
        '/api/auth/register',
        '/api/test-db',
        '/api/orders/available-slots'
    ];

    const isTrackingRoute = req.path.includes('/api/orders/') && req.query.token;

    if (publicRoutes.includes(req.path)) {
        return next();
    }

    if (isTrackingRoute) {
        console.log('🔓 Rota de tracking liberada (sem tenant):', req.path);
        return next();
    }

    if (req.query.tenant) {
        req.tenantId = req.query.tenant;
        console.log('🏷️ Tenant da query:', req.tenantId);
        return next();
    }

    if (req.headers['x-tenant-id']) {
        req.tenantId = req.headers['x-tenant-id'];
        console.log('🏷️ Tenant do header:', req.tenantId);
        return next();
    }

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

    if (req.path.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
        return next();
    }

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
        timestamp: new Date().toISOString(),
        environment: NODE_ENV
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
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET não definido no .env');
    if (isProduction) {
        console.error('🚨 Servidor encerrado em produção por falta de JWT_SECRET');
        process.exit(1);
    }
}

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
                 (?, 'is_open', 'true'),
                 (?, 'delivery_type', 'fixa'),
                 (?, 'delivery_zones', '[]')`,
                [subdomain, restaurantName, subdomain, subdomain, subdomain]
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
//  1. ENDPOINT PARA VERIFICAR HORÁRIOS DISPONÍVEIS - CORRIGIDO
// ============================================================
app.get('/api/orders/available-slots', async (req, res) => {
    const tenantId = req.query.tenant || req.tenantId;

    try {
        if (!tenantId) {
            return res.status(404).json({
                success: false,
                error: 'Tenant não encontrado. Use ?tenant=seu_subdominio'
            });
        }

        const { date } = req.query;
        if (!date) {
            return res.status(400).json({
                success: false,
                error: 'Data é obrigatória'
            });
        }

        console.log(`📅 Buscando slots para: ${date}, tenant: ${tenantId}`);

        const [year, month, day] = date.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const dayOfWeek = selectedDate.getDay();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        console.log(`📅 Data selecionada: ${dateStr}, Dia da semana: ${dayOfWeek}`);

        // ✅ CORREÇÃO: Verificar limite de 2 dias usando apenas datas (sem hora)
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const maxDay = new Date();
        maxDay.setDate(maxDay.getDate() + 2);
        maxDay.setHours(0, 0, 0, 0);

        const requestedDay = new Date(year, month - 1, day);
        requestedDay.setHours(0, 0, 0, 0);

        console.log(`📅 Hoje: ${today.toISOString().split('T')[0]}`);
        console.log(`📅 Máximo: ${maxDay.toISOString().split('T')[0]}`);
        console.log(`📅 Solicitado: ${requestedDay.toISOString().split('T')[0]}`);

        if (requestedDay < today || requestedDay > maxDay) {
            console.log(`❌ Data fora do limite`);
            return res.json({
                success: true,
                data: {
                    date: dateStr,
                    day_of_week: dayOfWeek,
                    available: false,
                    message: 'Apenas é possível agendar para hoje, amanhã ou depois de amanhã',
                    slots: []
                }
            });
        }

        // Buscar horários de funcionamento
        const [operatingHours] = await pool.query(
            `SELECT * FROM operating_hours 
             WHERE tenant_id = ? AND day_of_week = ? AND is_open = 1`,
            [tenantId, dayOfWeek]
        );

        console.log(`📊 Horários encontrados: ${operatingHours.length}`);

        let openTime = '09:00:00';
        let closeTime = '22:00:00';
        let breakStart = null;
        let breakEnd = null;

        if (operatingHours.length > 0) {
            openTime = operatingHours[0].open_time;
            closeTime = operatingHours[0].close_time;
            breakStart = operatingHours[0].break_start;
            breakEnd = operatingHours[0].break_end;
        } else {
            return res.json({
                success: true,
                data: {
                    date: dateStr,
                    day_of_week: dayOfWeek,
                    available: false,
                    message: 'Restaurante fechado neste dia',
                    slots: []
                }
            });
        }

        console.log(`⏰ Horário de funcionamento: ${openTime} - ${closeTime}`);

        // Gerar slots de 30 em 30 minutos
        const availableSlots = [];

        const [openHour, openMinute] = openTime.split(':').map(Number);
        const [closeHour, closeMinute] = closeTime.split(':').map(Number);

        let startMinutes = openHour * 60 + openMinute;
        let endMinutes = closeHour * 60 + closeMinute;

        if (endMinutes === 0) {
            endMinutes = 24 * 60;
            console.log(`   🔄 Ajustando fechamento para 24:00 (${endMinutes} min)`);
        }

        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60;
        }

        const isToday = dateStr === today.toISOString().split('T')[0];
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

        console.log(`🔄 Gerando slots de ${startMinutes} até ${endMinutes} minutos`);
        console.log(`📅 É hoje? ${isToday}`);
        console.log(`🕐 Horário atual: ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} (${currentTimeMinutes} min)`);

        let startFromMinutes = startMinutes;
        if (isToday) {
            const nextSlotMinutes = Math.ceil(currentTimeMinutes / 30) * 30;
            startFromMinutes = Math.max(startMinutes, nextSlotMinutes);
            console.log(`   🔄 Ajustando início para o próximo slot: ${startFromMinutes} min`);
        }

        let slotCount = 0;
        for (let minutes = startFromMinutes; minutes < endMinutes; minutes += 30) {
            let adjustedMinutes = minutes;
            if (minutes >= 24 * 60) {
                adjustedMinutes = minutes - 24 * 60;
            }

            const hours = Math.floor(adjustedMinutes / 60);
            const mins = adjustedMinutes % 60;
            const displayTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

            let isBreak = false;
            if (breakStart && breakEnd) {
                const [breakHour, breakMinute] = breakStart.split(':').map(Number);
                const [breakEndHour, breakEndMinute] = breakEnd.split(':').map(Number);
                let breakStartMinutes = breakHour * 60 + breakMinute;
                let breakEndMinutes = breakEndHour * 60 + breakEndMinute;

                if (breakEndMinutes === 0) {
                    breakEndMinutes = 24 * 60;
                }
                if (breakEndMinutes <= breakStartMinutes) {
                    breakEndMinutes += 24 * 60;
                }

                if (minutes >= breakStartMinutes && minutes <= breakEndMinutes) {
                    isBreak = true;
                    console.log(`⏸️ Pulando horário de almoço: ${displayTime}`);
                }
            }

            if (!isBreak) {
                availableSlots.push({
                    time: displayTime,
                    available: true,
                    remaining: 999
                });
                slotCount++;
            }
        }
        console.log(`✅ ${slotCount} slots disponíveis gerados`);

        res.json({
            success: true,
            data: {
                date: dateStr,
                day_of_week: dayOfWeek,
                available: availableSlots.length > 0,
                open_time: openTime.substring(0, 5),
                close_time: closeTime.substring(0, 5),
                slots: availableSlots,
                limits: {
                    max_days_ahead: 2,
                    max_orders_per_slot: 999
                }
            }
        });
    } catch (error) {
        console.error('❌ Erro ao buscar horários disponíveis:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar horários: ' + error.message
        });
    }
});

// ============================================================
//  2. ROTA GET /api/orders/:id - COM VALIDAÇÃO DE TOKEN
// ============================================================
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const accessToken = req.query.token;
        const customerName = req.query.name;
        const customerPhone = req.query.phone;

        console.log(`📦 Buscando pedido ID: ${orderId}`);
        console.log(`🔑 Token: ${accessToken?.substring(0, 20)}...`);

        if (!accessToken) {
            console.log('❌ Token não fornecido');
            return res.status(401).json({
                success: false,
                error: 'Token de acesso necessário'
            });
        }

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

        await pool.query(
            'UPDATE orders SET tracking_views = tracking_views + 1 WHERE id = ?',
            [orderId]
        );

        const orderResponse = {
            ...order,
            items: typeof order.items === 'string' ?
                JSON.parse(order.items) : order.items,
            access_token: undefined,
            tenant_id: order.tenant_id
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
//  3. ROTA GET /api/orders - LISTAR TODOS OS PEDIDOS
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
//  4. ROTA POST /api/orders - CRIAR PEDIDO (COM AGENDAMENTO E TAXA)
// ============================================================
app.post('/api/orders', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({ success: false, error: 'Tenant não encontrado' });
        }

        const {
            customer_name,
            customer_email,
            customer_phone,
            customer_address,
            items,
            subtotal,
            total,
            delivery_fee = 0,
            discount = 0,
            payment_method = 'dinheiro',
            delivery_type = 'delivery',
            notes = '',
            scheduled_time,
            is_scheduled = false
        } = req.body;

        console.log('📦 Pedido recebido:', {
            tenantId,
            customer_name,
            items: items?.length,
            subtotal,
            total,
            is_scheduled,
            scheduled_time
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
        //  BUSCAR CONFIGURAÇÕES PARA CALCULAR TAXA DE ENTREGA
        // ============================================================
        const [configRows] = await pool.query(
            'SELECT config_key, config_value FROM config WHERE tenant_id = ?',
            [tenantId]
        );

        const config = {};
        configRows.forEach(row => {
            config[row.config_key] = row.config_value;
        });

        const deliveryType = config.delivery_type || 'fixa';
        let calculatedDeliveryFee = 0;
        let deliveryFound = true;

        if (deliveryType === 'fixa') {
            calculatedDeliveryFee = parseFloat(config.delivery_fee) || 0;
        } else if (deliveryType === 'manual') {
            calculatedDeliveryFee = 0;
        } else if (deliveryType === 'dinamica') {
            const result = calcularTaxaEntrega(tenantId, customer_address, config);
            calculatedDeliveryFee = result.fee || 0;
            deliveryFound = result.found !== undefined ? result.found : true;
        }

        // ✅ Se não encontrou o bairro, taxa = 0 (será definida manualmente depois)
        const finalDeliveryFee = (deliveryType === 'manual' || !deliveryFound) ? 0 : (delivery_fee || calculatedDeliveryFee);
        const finalTotal = parseFloat(total)

        console.log(`🚚 Taxa de entrega: ${finalDeliveryFee} (tipo: ${deliveryType}, encontrado: ${deliveryFound})`);

        // ============================================================
        //  VALIDAÇÃO DO AGENDAMENTO
        // ============================================================
        let finalScheduledTime = null;
        let finalStatus = 'pending';
        let finalScheduledStatus = 'pending';

        if (is_scheduled && scheduled_time) {
            if (typeof scheduled_time !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Data/hora inválida. Use o formato YYYY-MM-DDTHH:MM:SS'
                });
            }

            const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
            if (!dateRegex.test(scheduled_time)) {
                return res.status(400).json({
                    success: false,
                    error: 'Formato de data/hora inválido. Use YYYY-MM-DDTHH:MM:SS'
                });
            }

            const parts = scheduled_time.split('T');
            const dateParts = parts[0].split('-').map(Number);
            const timeParts = parts[1].split(':').map(Number);

            const year = dateParts[0];
            const month = dateParts[1];
            const day = dateParts[2];
            const hour = timeParts[0];
            const minute = timeParts[1];

            if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
                return res.status(400).json({
                    success: false,
                    error: 'Data/hora inválida'
                });
            }

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const maxDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
            const scheduledDay = new Date(year, month - 1, day);

            if (scheduledDay < today || scheduledDay > maxDay) {
                return res.status(400).json({
                    success: false,
                    error: 'O agendamento só pode ser feito para hoje, amanhã ou depois de amanhã'
                });
            }

            const isAvailable = await checkSlotAvailability(tenantId, scheduled_time);
            if (!isAvailable) {
                return res.status(400).json({
                    success: false,
                    error: 'Horário indisponível. Escolha outro horário ou dia.'
                });
            }

            finalScheduledTime = scheduled_time;
            finalStatus = 'scheduled';
            finalScheduledStatus = 'pending';
        }

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

        const accessToken = crypto.randomBytes(32).toString('hex');

        // Calcular delivery_status
        const deliveryStatus = deliveryFound ? 'calculated' : 'pending';

        const [result] = await pool.query(
            `INSERT INTO orders (
        tenant_id, order_number, customer_name, customer_email,
        customer_phone, customer_address, items, subtotal,
        delivery_fee, discount, total, payment_method,
        delivery_type, notes, is_scheduled, scheduled_time,
        scheduled_status, status, access_token, delivery_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tenantId,
                orderNumber,
                customer_name,
                customer_email || null,
                customer_phone || null,
                customer_address,
                JSON.stringify(items),
                parseFloat(subtotal || 0),
                finalDeliveryFee,
                parseFloat(discount || 0),
                finalTotal,
                payment_method,
                deliveryType,  // ✅ USE deliveryType (da config), NÃO delivery_type do body
                notes || null,
                is_scheduled ? 1 : 0,
                finalScheduledTime,
                finalScheduledStatus,
                finalStatus,
                accessToken,
                deliveryStatus
            ]
        );
        console.log(`✅ Pedido criado: ${orderNumber} ${is_scheduled ? '(Agendado para ' + scheduled_time + ')' : ''}`);

        const io = req.app.get('io');
        if (io) {
            const orderData = {
                id: result.insertId,
                orderNumber: orderNumber,
                customer_name: customer_name,
                total: finalTotal,
                items: items,
                status: finalStatus,
                is_scheduled: is_scheduled,
                scheduled_time: finalScheduledTime
            };

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
                access_token: accessToken,
                is_scheduled: is_scheduled,
                scheduled_time: finalScheduledTime,
                delivery_fee: finalDeliveryFee,
                delivery_type: deliveryType
            },
            message: is_scheduled ? 'Pedido agendado com sucesso!' : 'Pedido criado com sucesso!'
        });
    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao criar pedido: ' + error.message
        });
    }
});

// ============================================================
//  FUNÇÃO PARA VERIFICAR DISPONIBILIDADE DE HORÁRIO
// ============================================================
async function checkSlotAvailability(tenantId, scheduledTime) {
    try {
        const scheduledDate = new Date(scheduledTime);
        const dateStr = scheduledDate.toISOString().split('T')[0];
        const timeStr = scheduledDate.toTimeString().split(' ')[0];
        const dayOfWeek = scheduledDate.getDay();

        console.log(`🔍 [checkSlotAvailability] Verificando horário`);
        console.log(`   Tenant: ${tenantId}`);
        console.log(`   Data: ${dateStr}`);
        console.log(`   Horário: ${timeStr}`);

        const now = new Date();
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 2);

        const today = getTodayLocal();
        const maxDay = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
        const scheduledDay = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());

        if (scheduledDay < today || scheduledDay > maxDay) {
            console.log(`❌ [checkSlotAvailability] Data fora do limite de 2 dias`);
            return false;
        }

        const [operatingHours] = await pool.query(
            `SELECT * FROM operating_hours 
             WHERE tenant_id = ? AND day_of_week = ? AND is_open = 1`,
            [tenantId, dayOfWeek]
        );

        console.log(`   Horários encontrados: ${operatingHours.length}`);

        let openTime = '09:00:00';
        let closeTime = '22:00:00';
        let breakStart = null;
        let breakEnd = null;

        if (operatingHours.length > 0) {
            openTime = operatingHours[0].open_time;
            closeTime = operatingHours[0].close_time;
            breakStart = operatingHours[0].break_start;
            breakEnd = operatingHours[0].break_end;
            console.log(`   Horário configurado: ${openTime} - ${closeTime}`);
        } else {
            console.log(`   ⚠️ Nenhum horário configurado, usando padrão: ${openTime} - ${closeTime}`);
        }

        console.log(`   Horário solicitado: ${timeStr}`);

        const [requestHour, requestMinute] = timeStr.split(':').map(Number);
        const [openHour, openMinute] = openTime.split(':').map(Number);
        const [closeHour, closeMinute] = closeTime.split(':').map(Number);

        const requestMinutes = requestHour * 60 + requestMinute;
        const openMinutes = openHour * 60 + openMinute;
        let closeMinutes = closeHour * 60 + closeMinute;

        if (closeMinutes <= openMinutes) {
            closeMinutes += 24 * 60;
            if (requestMinutes < openMinutes) {
                const adjustedRequestMinutes = requestMinutes + 24 * 60;
                console.log(`   🔄 Ajustando horário para o dia seguinte: ${timeStr} -> ${adjustedRequestMinutes} min`);

                const isOpenAdjusted = adjustedRequestMinutes >= openMinutes && adjustedRequestMinutes <= closeMinutes;
                if (isOpenAdjusted) {
                    console.log(`✅ [checkSlotAvailability] Horário DISPONÍVEL!`);
                    return true;
                }
                console.log(`❌ [checkSlotAvailability] Horário fora do expediente (${openTime} - ${closeTime})`);
                return false;
            }
        }

        console.log(`   Horário em minutos: solicitado=${requestMinutes}, abertura=${openMinutes}, fechamento=${closeMinutes}`);

        if (requestMinutes < openMinutes || requestMinutes > closeMinutes) {
            console.log(`❌ [checkSlotAvailability] Horário fora do expediente (${openTime} - ${closeTime})`);
            return false;
        }

        if (breakStart && breakEnd) {
            const [breakHour, breakMinute] = breakStart.split(':').map(Number);
            const [breakEndHour, breakEndMinute] = breakEnd.split(':').map(Number);
            const breakStartMinutes = breakHour * 60 + breakMinute;
            const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

            if (requestMinutes >= breakStartMinutes && requestMinutes <= breakEndMinutes) {
                console.log(`❌ [checkSlotAvailability] Horário de almoço (${breakStart} - ${breakEnd})`);
                return false;
            }
        }

        console.log(`✅ [checkSlotAvailability] Horário DISPONÍVEL!`);
        return true;
    } catch (error) {
        console.error('❌ [checkSlotAvailability] Erro:', error);
        return false;
    }
}

// ============================================================
//  5. ROTA PUT /api/orders/:id/status - ATUALIZAR STATUS
// ============================================================
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
//  ROTAS DE CONFIGURAÇÕES
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
            delivery_fee: '3.00',
            delivery_type: 'fixa',
            delivery_zones: '[]',
            store_address: '',
            store_phone: '',
            banner_image: '',
            logo_image: '',
            is_open: 'true'
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

// ============================================================
//  ENDPOINT PARA CALCULAR TAXA DE ENTREGA - CORRIGIDO
// ============================================================
app.post('/api/calculate-delivery', async (req, res) => {
    try {
        const { address, tenant } = req.body;

        if (!tenant) {
            return res.status(400).json({
                success: false,
                error: 'Tenant não informado'
            });
        }

        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Endereço não informado'
            });
        }

        // Buscar configurações
        const [configRows] = await pool.query(
            'SELECT config_key, config_value FROM config WHERE tenant_id = ?',
            [tenant]
        );

        const config = {};
        configRows.forEach(row => {
            config[row.config_key] = row.config_value;
        });

        const deliveryType = config.delivery_type || 'fixa';
        let result = { fee: 0, found: false, message: '' };

        if (deliveryType === 'fixa') {
            result = { fee: parseFloat(config.delivery_fee) || 0, found: true };
        } else if (deliveryType === 'manual') {
            result = { fee: 0, found: false, message: 'Taxa informada após o pedido' };
        } else if (deliveryType === 'dinamica') {
            result = calcularTaxaEntrega(tenant, address, config);
        }

        res.json({
            success: true,
            fee: result.fee,
            type: deliveryType,
            found: result.found,
            message: result.message || (result.found ? undefined : 'Bairro não cadastrado - taxa será informada após o pedido')
        });

    } catch (error) {
        console.error('❌ Erro ao calcular taxa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao calcular taxa de entrega'
        });
    }
});
// ============================================================
//  ENDPOINT PARA VERIFICAR STATUS DA LOJA
// ============================================================
app.get('/api/store/status', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(404).json({
                success: false,
                error: 'Tenant não encontrado'
            });
        }

        const [configRows] = await pool.query(
            'SELECT config_value FROM config WHERE tenant_id = ? AND config_key = ?',
            [tenantId, 'is_open']
        );

        const isManuallyOpen = configRows.length > 0 && configRows[0].config_value === 'true';

        if (!isManuallyOpen) {
            return res.json({
                success: true,
                data: {
                    is_open: false,
                    reason: 'Loja desativada manualmente',
                    manual_override: true
                }
            });
        }

        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentTime = now.toTimeString().split(' ')[0];

        const [operatingHours] = await pool.query(
            `SELECT * FROM operating_hours 
             WHERE tenant_id = ? AND day_of_week = ? AND is_open = 1`,
            [tenantId, dayOfWeek]
        );

        if (operatingHours.length === 0) {
            return res.json({
                success: true,
                data: {
                    is_open: false,
                    reason: 'Restaurante fechado hoje',
                    manual_override: false
                }
            });
        }

        const hours = operatingHours[0];

        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        const [openHour, openMinute] = hours.open_time.split(':').map(Number);
        const [closeHour, closeMinute] = hours.close_time.split(':').map(Number);

        const currentMinutes = currentHour * 60 + currentMinute;
        const openMinutes = openHour * 60 + openMinute;
        let closeMinutes = closeHour * 60 + closeMinute;

        if (closeMinutes <= openMinutes) {
            closeMinutes += 24 * 60;
        }

        const isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;

        let isBreak = false;
        if (hours.break_start && hours.break_end) {
            const [breakHour, breakMinute] = hours.break_start.split(':').map(Number);
            const [breakEndHour, breakEndMinute] = hours.break_end.split(':').map(Number);
            const breakStartMinutes = breakHour * 60 + breakMinute;
            const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

            isBreak = currentMinutes >= breakStartMinutes && currentMinutes <= breakEndMinutes;
        }

        const result = isOpen && !isBreak;

        res.json({
            success: true,
            data: {
                is_open: result,
                reason: result ? 'Aberto' : (isBreak ? 'Horário de almoço' : 'Fechado'),
                manual_override: false,
                day_of_week: dayOfWeek,
                current_time: currentTime,
                open_time: hours.open_time,
                close_time: hours.close_time,
                break_start: hours.break_start,
                break_end: hours.break_end
            }
        });
    } catch (error) {
        console.error('❌ Erro ao verificar status da loja:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar status da loja: ' + error.message
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
//  ENDPOINT PARA BUSCAR HORÁRIOS - PÚBLICO (SEM AUTENTICAÇÃO)
// ============================================================
app.get('/api/operating-hours', async (req, res) => {
    try {
        const tenantId = req.tenantId;
        console.log('🔍 Buscando horários para tenant:', tenantId);

        if (!tenantId) {
            return res.status(404).json({
                success: false,
                error: 'Tenant não encontrado'
            });
        }

        const [hours] = await pool.query(
            'SELECT * FROM operating_hours WHERE tenant_id = ? ORDER BY day_of_week',
            [tenantId]
        );

        if (hours.length === 0) {
            console.log('📝 Criando horários padrão para tenant:', tenantId);
            const defaultHours = [];
            for (let i = 0; i < 7; i++) {
                defaultHours.push({
                    day_of_week: i,
                    is_open: i !== 0 ? 1 : 0,
                    open_time: '09:00:00',
                    close_time: i === 0 ? '18:00:00' : '22:00:00'
                });
            }

            for (const h of defaultHours) {
                await pool.query(
                    `INSERT INTO operating_hours 
                     (tenant_id, day_of_week, is_open, open_time, close_time)
                     VALUES (?, ?, ?, ?, ?)`,
                    [tenantId, h.day_of_week, h.is_open, h.open_time, h.close_time]
                );
            }

            const [newHours] = await pool.query(
                'SELECT * FROM operating_hours WHERE tenant_id = ? ORDER BY day_of_week',
                [tenantId]
            );
            return res.json({ success: true, data: newHours });
        }

        res.json({ success: true, data: hours });
    } catch (error) {
        console.error('❌ Erro ao buscar horários:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar horários: ' + error.message });
    }
});

// ============================================================
//  ENDPOINT PARA ATUALIZAR HORÁRIOS - CORRIGIDO
// ============================================================
app.put('/api/operating-hours', verifyToken, async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { hours } = req.body;

        console.log('📝 Atualizando horários para tenant:', tenantId);

        if (!Array.isArray(hours) || hours.length !== 7) {
            return res.status(400).json({
                success: false,
                error: 'É necessário enviar os 7 dias da semana'
            });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (let i = 0; i < hours.length; i++) {
                const h = hours[i];

                const isOpen = h.is_open ? 1 : 0;
                const openTime = h.open_time || '09:00:00';
                const closeTime = h.close_time || '22:00:00';
                const breakStart = h.break_start || null;
                const breakEnd = h.break_end || null;

                console.log(`📝 Salvando dia ${h.day_of_week}: aberto=${isOpen}, ${openTime} - ${closeTime}`);

                const query = `
                    INSERT INTO operating_hours 
                    (tenant_id, day_of_week, is_open, open_time, close_time, break_start, break_end)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    is_open = VALUES(is_open),
                    open_time = VALUES(open_time),
                    close_time = VALUES(close_time),
                    break_start = VALUES(break_start),
                    break_end = VALUES(break_end)
                `;

                await connection.query(query, [
                    tenantId,
                    h.day_of_week,
                    isOpen,
                    openTime,
                    closeTime,
                    breakStart,
                    breakEnd
                ]);
            }

            await connection.commit();
            connection.release();

            const [updated] = await pool.query(
                'SELECT * FROM operating_hours WHERE tenant_id = ? ORDER BY day_of_week',
                [tenantId]
            );

            res.json({
                success: true,
                data: updated,
                message: 'Horários de funcionamento atualizados com sucesso!'
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar horários:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar horários: ' + error.message
        });
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

        // ✅ CORREÇÃO DEFINITIVA: Usar query SQL com CONVERT_TZ
        // O banco salva em UTC, precisamos converter para UTC-3 (Brasil)
        const now = new Date();
        const localDate = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const todayStr = localDate.toISOString().split('T')[0];

        console.log(`📅 Data local (Brasil): ${todayStr}`);
        console.log(`📅 Data UTC: ${now.toISOString().split('T')[0]}`);

        // Query com CONVERT_TZ para ajustar o fuso horário
        const [stats] = await pool.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('pending', 'Pendente') THEN 1 ELSE 0 END) as pending,
                SUM(CASE 
                    WHEN status IN ('entregue', 'Entregue') 
                    AND DATE(CONVERT_TZ(created_at, '+00:00', '-03:00')) = ? 
                    THEN total 
                    ELSE 0 
                END) as todayRevenue,
                AVG(total) as avgTicket
             FROM orders 
             WHERE tenant_id = ?`,
            [todayStr, tenantId]
        );

        // Buscar pedidos recentes com data local para debug
        const [recentOrders] = await pool.query(
            `SELECT *, 
             CONVERT_TZ(created_at, '+00:00', '-03:00') as created_at_local
             FROM orders 
             WHERE tenant_id = ? 
             ORDER BY created_at DESC 
             LIMIT 10`,
            [tenantId]
        );

        console.log('📊 Pedidos recentes (com data local):');
        recentOrders.forEach(o => {
            const localCreated = o.created_at_local;
            const dateStr = localCreated ? localCreated.toISOString().split('T')[0] : 'N/A';
            console.log(`   #${o.order_number}: status=${o.status}, data_local=${dateStr}, total=R$ ${parseFloat(o.total).toFixed(2)}`);
        });

        const result = {
            total: parseInt(stats[0].total) || 0,
            pending: parseInt(stats[0].pending) || 0,
            todayRevenue: parseFloat(stats[0].todayRevenue) || 0,
            avgTicket: parseFloat(stats[0].avgTicket) || 0,
            recentOrders: recentOrders.map(o => ({
                ...o,
                created_at_local: o.created_at_local,
                items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
            }))
        };

        console.log(`📊 Total: ${result.total}`);
        console.log(`📊 Pendentes: ${result.pending}`);
        console.log(`📊 Faturamento hoje (${todayStr}): R$ ${result.todayRevenue.toFixed(2)}`);

        res.json({
            success: true,
            data: result
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
//  ENDPOINT /stats/dashboard 
//  ✅ Considera apenas pedidos com status "entregue"
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

        // ✅ Usar data local (Brasil) para todos os períodos
        const now = new Date();
        const localDate = new Date(now.getTime() - (3 * 60 * 60 * 1000));

        let startDate;
        switch (period) {
            case 'today':
                startDate = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
                break;
            case 'week':
                const day = localDate.getDay();
                startDate = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate() - day);
                break;
            case 'month':
                startDate = new Date(localDate.getFullYear(), localDate.getMonth(), 1);
                break;
            case 'all':
                startDate = new Date(0);
                break;
            default:
                startDate = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        console.log(`📅 Data inicial: ${startDateStr}`);

        // ✅ BUSCAR APENAS PEDIDOS ENTREGUES
        const [orders] = await pool.query(
            `SELECT * FROM orders 
             WHERE tenant_id = ? 
               AND DATE(created_at) >= ? 
               AND status IN ('entregue', 'Entregue', 'delivered')
             ORDER BY created_at DESC`,
            [tenantId, startDateStr]
        );

        console.log(`📦 Pedidos entregues encontrados: ${orders.length}`);

        // ✅ Calcular vendas diárias (apenas entregues)
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

        // ✅ Status dos pedidos (todos os pedidos, não apenas entregues)
        const [allOrders] = await pool.query(
            `SELECT * FROM orders 
             WHERE tenant_id = ? 
               AND DATE(created_at) >= ? 
             ORDER BY created_at DESC`,
            [tenantId, startDateStr]
        );

        const statusCount = {};
        allOrders.forEach(order => {
            const status = order.status || 'pending';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        const statusMap = {
            'pending': '🟡 Pendente',
            'confirmado': '🟢 Confirmado',
            'preparando': '🟠 Preparando',
            'entregue': '✅ Entregue',
            'scheduled': '📅 Agendado',
            'cancelado': '❌ Cancelado'
        };

        const statusData = Object.entries(statusCount).map(([key, value]) => ({
            name: statusMap[key] || key,
            value
        }));

        if (statusData.length === 0) {
            statusData.push({ name: '🟡 Pendente', value: 0 });
        }

        // ✅ Top produtos (apenas de pedidos entregues)
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

        // ✅ Calcular métricas adicionais para os cards
        const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);
        const totalRevenue = salesData.reduce((sum, day) => sum + day.total, 0);
        const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const pendingOrders = statusData.find(s => s.name === '🟡 Pendente')?.value || 0;

        res.json({
            success: true,
            data: {
                salesData,
                statusData,
                topProducts,
                // ✅ Métricas para os cards
                total: totalOrders,
                revenue: totalRevenue,
                avgTicket: avgTicket,
                pending: pendingOrders
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
//  ROTAS DE ARQUIVOS ESTÁTICOS
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
        return req.tenantId || rateLimit.ipKeyGenerator(req);
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
//  ROTA DE DELETE DE IMAGEM
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
//  INICIAR SERVIDOR
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
        console.log('');
        console.log('📅 AGENDAMENTO:');
        console.log('   ✅ Limite de 2 dias para agendamento');
        console.log('   ✅ Horários configuráveis por dia');
        console.log('   ✅ Status "📅 Agendado" nos pedidos');
        console.log('');
        console.log('🚚 TAXA DE ENTREGA:');
        console.log('   ✅ Fixa - valor único para todos os pedidos');
        console.log('   ✅ Dinâmica - valor por bairro');
        console.log('   ✅ Manual - definida após o pedido');
    });
});