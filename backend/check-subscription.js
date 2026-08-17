const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 4000,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Buscar o device_token do último pedido
        const [order] = await pool.query(
            'SELECT device_token FROM orders ORDER BY id DESC LIMIT 1'
        );
        
        if (order.length === 0 || !order[0].device_token) {
            console.log('❌ Nenhum device_token encontrado');
            await pool.end();
            return;
        }

        const deviceToken = order[0].device_token;
        console.log('📱 Device token do último pedido:');
        console.log('  ' + deviceToken.substring(0, 60) + '...');

        // Buscar subscription com este device_token
        const [subs] = await pool.query(
            'SELECT id, subscription FROM push_subscriptions WHERE subscription LIKE ?',
            ['%' + deviceToken + '%']
        );

        if (subs.length === 0) {
            console.log('');
            console.log('❌ NENHUMA subscription encontrada para este device_token');
            console.log('   Isso explica por que a notificação não chegou!');
            console.log('');
            console.log('🔧 O dispositivo precisa autorizar as notificações novamente.');
            console.log('   Acesse: https://fireburgerpetropolis.com.br/?tenant=fireburger');
        } else {
            console.log('');
            console.log('✅ Subscription encontrada!');
            console.log('   ID:', subs[0].id);
            console.log('   A notificação deve funcionar.');
            
            // Verificar se há mais subscriptions
            if (subs.length > 1) {
                console.log('');
                console.log('⚠️ ATENÇÃO: ' + subs.length + ' subscriptions encontradas para este device_token!');
                console.log('   Isso pode causar notificações duplicadas.');
            }
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
    
    await pool.end();
}

check();
