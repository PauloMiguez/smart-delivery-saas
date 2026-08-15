const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeDuplicates() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 4000,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const [subs] = await pool.query('SELECT id, subscription, created_at FROM push_subscriptions ORDER BY created_at DESC');
        
        console.log('📱 Total antes:', subs.length);
        
        const endpointMap = new Map();
        let deleted = 0;
        
        for (const s of subs) {
            try {
                const sub = JSON.parse(s.subscription);
                const endpoint = sub.endpoint;
                
                if (!endpoint) continue;
                
                if (endpointMap.has(endpoint)) {
                    // Já existe, deletar esta
                    await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [s.id]);
                    deleted++;
                    console.log('🗑️ Removida duplicata ID: ' + s.id);
                } else {
                    endpointMap.set(endpoint, s.id);
                }
            } catch(e) {
                console.log('⚠️ Erro ao parsear ID: ' + s.id);
            }
        }
        
        console.log('\n✅ Removidas: ' + deleted + ' duplicatas');
        
        const [remaining] = await pool.query('SELECT COUNT(*) as total FROM push_subscriptions');
        console.log('📱 Total agora:', remaining[0].total);
        
        await pool.end();
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

removeDuplicates();
