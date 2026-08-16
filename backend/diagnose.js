#!/usr/bin/env node
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = (msg, color = 'reset') => console.log(COLORS[color] + msg + COLORS.reset);
const ok = (msg) => log('✅ ' + msg, 'green');
const fail = (msg) => log('❌ ' + msg, 'red');
const warn = (msg) => log('⚠️  ' + msg, 'yellow');
const info = (msg) => log('ℹ️  ' + msg, 'blue');
const title = (msg) => log('\n📌 ' + msg, 'cyan');

let pool = null;

async function fetchWithTimeout(url, options = {}, timeout = 3000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function main() {
  console.log(COLORS.bold + '═══════════════════════════════════════════' + COLORS.reset);
  console.log(COLORS.bold + '  🔍 SMART DELIVERY - DIAGNÓSTICO' + COLORS.reset);
  console.log(COLORS.bold + '═══════════════════════════════════════════' + COLORS.reset);
  console.log('');

  try {
    // 1. Conectar ao banco
    title('1. CONEXÃO COM O BANCO');
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 4000,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false },
      });
      await pool.query('SELECT 1');
      ok('Conexão com banco estabelecida');
    } catch (err) {
      fail('Falha ao conectar ao banco: ' + err.message);
      process.exit(1);
    }

    // 2. Verificar variáveis de ambiente
    title('2. VARIÁVEIS DE AMBIENTE');
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'];
    required.forEach(v => {
      const val = process.env[v];
      if (val) {
        const masked = v.includes('KEY') ? val.substring(0, 10) + '...' : 'definido';
        ok(`${v}: ${masked}`);
      } else {
        fail(`${v}: não definido`);
      }
    });

    // 3. Verificar domínios personalizados
    title('3. DOMÍNIOS PERSONALIZADOS');
    const domainMapping = process.env.TENANT_DOMAINS || '';
    if (domainMapping) {
      ok(`TENANT_DOMAINS: ${domainMapping}`);
      const pairs = domainMapping.split(',').map(p => p.trim());
      pairs.forEach(p => {
        const [domain, tenant] = p.split(':');
        info(`  ${domain} → ${tenant}`);
      });
    } else {
      warn('TENANT_DOMAINS não configurado');
    }

    // 4. Verificar estrutura da tabela orders
    title('4. ESTRUTURA DA TABELA orders');
    try {
      const [cols] = await pool.query('DESCRIBE orders');
      const columnNames = cols.map(c => c.Field);
      const requiredColumns = ['id', 'tenant_id', 'order_number', 'customer_name', 'total', 'device_token'];
      requiredColumns.forEach(col => {
        if (columnNames.includes(col)) {
          ok(`coluna '${col}' existe`);
        } else {
          fail(`coluna '${col}' não existe`);
        }
      });
    } catch (err) {
      fail('Erro ao verificar estrutura: ' + err.message);
    }

    // 5. Verificar device_token nos últimos pedidos
    title('5. DEVICE_TOKEN NOS PEDIDOS');
    try {
      const [orders] = await pool.query(
        'SELECT order_number, device_token FROM orders WHERE device_token IS NOT NULL ORDER BY id DESC LIMIT 5'
      );
      if (orders.length > 0) {
        ok(`${orders.length} pedidos com device_token`);
        orders.forEach(o => {
          const token = o.device_token || '';
          info(`  #${o.order_number}: ${token.substring(0, 40)}...`);
        });
      } else {
        warn('Nenhum pedido com device_token encontrado');
      }
    } catch (err) {
      fail('Erro ao consultar device_token: ' + err.message);
    }

    // 6. Verificar inscrições push
    title('6. INSCRIÇÕES PUSH');
    try {
      const [subs] = await pool.query('SELECT COUNT(*) as total FROM push_subscriptions');
      if (subs[0].total > 0) {
        ok(`${subs[0].total} inscrições encontradas`);
        const [list] = await pool.query('SELECT id, tenant_id, created_at FROM push_subscriptions ORDER BY created_at DESC');
        list.forEach(s => {
          info(`  ID: ${s.id} | Tenant: ${s.tenant_id} | Criado: ${s.created_at}`);
        });
      } else {
        warn('Nenhuma inscrição push encontrada');
      }
    } catch (err) {
      fail('Erro ao consultar inscrições: ' + err.message);
    }

    // 7. Verificar rotas da API (health check)
    title('7. API - HEALTH CHECK');
    const port = process.env.PORT || 3000;
    const baseUrl = `http://localhost:${port}`;
    try {
      const res = await fetchWithTimeout(`${baseUrl}/api/health`, { method: 'GET' });
      const data = await res.json();
      if (res.ok && data.success) {
        ok(`API respondendo em ${baseUrl}/api/health`);
        info(`  Ambiente: ${data.environment}`);
      } else {
        fail('Health check não retornou sucesso');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        warn(`API não respondeu em ${baseUrl}/api/health (timeout)`);
        info(`  Certifique-se de que o servidor está rodando (npm start)`);
      } else if (err.code === 'ECONNREFUSED') {
        warn(`Servidor não está rodando em ${baseUrl}`);
        info(`  Execute: npm start`);
      } else {
        fail(`Erro ao acessar health check: ${err.message}`);
      }
    }

    // 8. Verificar VAPID endpoint
    title('8. VAPID PUBLIC KEY');
    try {
      const res = await fetchWithTimeout(`${baseUrl}/api/notifications/vapid-public-key`, { method: 'GET' });
      const data = await res.json();
      if (res.ok && data.publicKey) {
        ok('VAPID public key disponível');
        info(`  Public key: ${data.publicKey.substring(0, 20)}...`);
      } else {
        fail('VAPID public key não retornada');
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ECONNREFUSED') {
        warn('Não foi possível verificar VAPID (servidor não disponível)');
      } else {
        fail('Erro ao acessar VAPID endpoint: ' + err.message);
      }
    }

    // 9. Verificar Subscribe endpoint
    title('9. SUBSCRIBE ENDPOINT');
    try {
      const res = await fetchWithTimeout(`${baseUrl}/api/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: { endpoint: 'test' }, tenant: 'fireburger' }),
      });
      if (res.status === 400) {
        warn('Endpoint /subscribe retornou 400 (subscription inválida) - OK (esperado)');
      } else {
        ok('Endpoint /subscribe respondeu com status: ' + res.status);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ECONNREFUSED') {
        warn('Não foi possível testar /subscribe (servidor não disponível)');
      } else {
        fail('Erro ao testar /subscribe: ' + err.message);
      }
    }

    // 10. Redirecionamento (instrução)
    title('10. REDIRECIONAMENTO - DOMÍNIO PERSONALIZADO');
    const host = process.env.DOMAIN || 'smart-delivery-saas.onrender.com';
    info(`  Domínio base: ${host}`);
    info(`  Verifique se ao acessar ${host}/?tenant=fireburger`);
    info(`  você é redirecionado para fireburgerpetropolis.com.br`);

    // 11. Verificar service-worker
    title('11. SERVICE WORKER');
    const buildPath = '../frontend-react/dist/service-worker.js';
    const swPath = path.join(__dirname, buildPath);
    if (fs.existsSync(swPath)) {
      ok('service-worker.js existe em dist');
      const content = fs.readFileSync(swPath, 'utf8');
      if (content.includes('notificationclick')) {
        ok('  Evento notificationclick encontrado');
      } else {
        warn('  Evento notificationclick NÃO encontrado');
      }
      if (content.includes('orderId') && content.includes('token')) {
        ok('  Redirecionamento com orderId e token presente');
      } else {
        warn('  Redirecionamento pode estar incompleto');
      }
    } else {
      warn('service-worker.js não encontrado no build');
      info(`  Verifique se o frontend foi construído: cd ../frontend-react && npm run build`);
    }

    // 12. Verificar package.json - type commonjs
    title('12. PACKAGE.JSON');
    const pkgPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.type === 'commonjs') {
        ok('type: commonjs definido');
      } else {
        warn('type: commonjs NÃO definido (atual: ' + (pkg.type || 'indefinido') + ')');
      }
    }

    // 13. Resumo
    console.log('\n' + COLORS.bold + '═══════════════════════════════════════════' + COLORS.reset);
    console.log(COLORS.bold + '  ✅ DIAGNÓSTICO CONCLUÍDO' + COLORS.reset);
    console.log(COLORS.bold + '═══════════════════════════════════════════' + COLORS.reset);
    console.log('');
    info('Verifique os itens com ❌ ou ⚠️ para corrigir.');
    console.log('');
    console.log('Próximos passos recomendados:');
    console.log('  - Certifique-se de que o servidor está rodando: npm start');
    console.log('  - Verifique se o frontend foi construído: cd ../frontend-react && npm run build');
    console.log('  - Após alterações, reinicie o servidor e recarregue a página.');
    console.log('  - Verifique se o redirecionamento está funcionando acessando a URL raiz com tenant.');

    await pool.end();
  } catch (err) {
    console.error('Erro geral:', err);
    if (pool) await pool.end();
    process.exit(1);
  }
}

main();
