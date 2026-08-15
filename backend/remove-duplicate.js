const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeDuplicate() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 4000,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        });

        // Buscar todas as subscriptions
        const [subs] = await pool.query('SELECT id, tenant_id, subscription, created_at FROM push_subscriptions ORDER BY created_at ASC');
        
        console.log('📱 Subscriptions encontradas:', subs.length);
        
        // Agrupar por endpoint
        const endpointMap = new Map();
        subs.forEach(s => {
            try {
                const sub = JSON.parse(s.subscription);
                const endpoint = sub.endpoint;
                if (endpoint) {
                    if (!endpointMap.has(endpoint)) {
                        endpointMap.set(endpoint, []);
                    }
                    endpointMap.get(endpoint).push({ id: s.id, created_at: s.created_at });
                }
            } catch(e) {}
        });
        
        let deleted = 0;
        for (const [endpoint, items] of endpointMap) {
            if (items.length > 1) {
                // Ordenar por data (mais antigo primeiro)
                items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                
                // Manter o mais recente, deletar os mais antigos
                const keep = items[items.length - 1];
                const remove = items.slice(0, -1);
                
                for (const item of remove) {
                    await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [item.id]);
                    deleted++;
                    console.log(`🗑️ Removida subscription ID: ${item.id} (criada em: ${item.created_at})`);
                }
                console.log(`✅ Mantida subscription ID: ${keep.id} (criada em: ${keep.created_at})`);
            }
        }
        
        console.log(`\n✅ ${deleted} subscription(s) duplicada(s) removida(s)!`);
        
        // Verificar resultado
        const [remaining] = await pool.query('SELECT COUNT(*) as total FROM push_subscriptions');
        console.log(`📱 Total restante: ${remaining[0].total} subscription(s)`);
        
        await pool.end();
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

removeDuplicate();
