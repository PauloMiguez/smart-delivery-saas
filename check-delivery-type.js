const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '39E87ruqfSzYfRX.root',
    password: '8inwhBgD2ePqz8HH',
    database: 'smart_delivery_saas',
    ssl: { rejectUnauthorized: false }
});

async function checkColumn() {
    let connection;
    try {
        connection = await pool.getConnection();
        
        console.log('📊 Verificando coluna delivery_type:');
        const [columns] = await connection.query(
            "SHOW COLUMNS FROM orders LIKE 'delivery_type'"
        );
        
        if (columns.length > 0) {
            console.log('✅ Coluna delivery_type existe');
            console.table(columns);
            
            // Verificar se há pedidos com delivery_type
            const [orders] = await connection.query(
                "SELECT id, order_number, delivery_type, delivery_fee FROM orders ORDER BY id DESC LIMIT 5"
            );
            console.log('\n📊 Últimos 5 pedidos:');
            console.table(orders);
            
        } else {
            console.log('❌ Coluna delivery_type NÃO existe');
            console.log('📝 Criando coluna delivery_type...');
            await connection.query(
                "ALTER TABLE orders ADD COLUMN delivery_type VARCHAR(20) DEFAULT 'fixa'"
            );
            console.log('✅ Coluna delivery_type criada!');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

checkColumn();
