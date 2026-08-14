const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSubscriptions() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 4000,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Verificar todas as subscriptions
        const [subscriptions] = await pool.query(
            'SELECT id, tenant_id, subscription, created_at FROM push_subscriptions ORDER BY created_at DESC'
        );
        
        console.log('=========================================');
        console.log('📱 SUBSCRIPTIONS PUSH NO BANCO');
        console.log('=========================================');
        console.log(`Total: ${subscriptions.length} subscriptions\n`);
        
        if (subscriptions.length === 0) {
            console.log('❌ NENHUMA subscription encontrada!');
            console.log('');
            console.log('Para receber notificações push:');
            console.log('1. Abra o admin: http://localhost:5173/admin?tenant=fireburger');
            console.log('2. Clique no ícone 🔔 no canto inferior');
            console.log('3. Aceite as notificações');
            console.log('4. Recarregue a página');
            console.log('5. Execute este script novamente');
        } else {
            // Mostrar detalhes
            subscriptions.forEach((sub, index) => {
                console.log(`📌 Subscription #${index + 1}:`);
                console.log(`   ID: ${sub.id}`);
                console.log(`   Tenant: ${sub.tenant_id}`);
                console.log(`   Criado em: ${sub.created_at}`);
                try {
                    const parsed = JSON.parse(sub.subscription);
                    console.log(`   Endpoint: ${parsed.endpoint?.substring(0, 60)}...`);
                } catch (e) {
                    console.log('   Endpoint: (erro ao parsear)');
                }
                console.log('');
            });
            
            console.log('✅ Subscriptions encontradas!');
            console.log('');
            console.log('Para testar notificações:');
            console.log('1. No admin, atualize o status de um pedido');
            console.log('2. Ou execute: node test-push-manual.js');
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkSubscriptions();
