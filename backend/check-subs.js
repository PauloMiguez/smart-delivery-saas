const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 4000,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        });

        const [subs] = await pool.query('SELECT id, tenant_id, subscription, created_at FROM push_subscriptions ORDER BY created_at DESC');
        console.log('=========================================');
        console.log('📱 SUBSCRIÇÕES NO BANCO');
        console.log('=========================================');
        console.log(`Total: ${subs.length} subscriptions\n`);
        
        if (subs.length === 0) {
            console.log('❌ NENHUMA subscription encontrada!');
        } else {
            subs.forEach((s, index) => {
                console.log(`📌 Subscription #${index + 1}:`);
                console.log(`   ID: ${s.id}`);
                console.log(`   Tenant: ${s.tenant_id}`);
                console.log(`   Criado em: ${s.created_at}`);
                try {
                    const sub = JSON.parse(s.subscription);
                    console.log(`   Endpoint: ${sub.endpoint?.substring(0, 60)}...`);
                } catch(e) {
                    console.log('   Endpoint: (erro ao parsear)');
                }
                console.log('');
            });
            
            // Verificar se há endpoints duplicados
            const endpoints = [];
            subs.forEach(s => {
                try {
                    const sub = JSON.parse(s.subscription);
                    if (sub.endpoint) {
                        endpoints.push(sub.endpoint);
                    }
                } catch(e) {}
            });
            
            const uniqueEndpoints = new Set(endpoints);
            if (endpoints.length !== uniqueEndpoints.size) {
                console.log('⚠️ ATENÇÃO: Há endpoints duplicados!');
                console.log(`   Total: ${endpoints.length}`);
                console.log(`   Únicos: ${uniqueEndpoints.size}`);
                console.log('   Isso pode causar notificações em duplicidade.');
            } else {
                console.log('✅ Todos os endpoints são únicos.');
            }
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.log('\n📌 Tente executar: cd backend && node check-subs.js');
    }
}

check();
