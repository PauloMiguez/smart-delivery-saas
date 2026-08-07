const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '39E87ruqfSzYfRX.root',
    password: '8inwhBgD2ePqz8HH',
    database: 'smart_delivery_saas',
    ssl: { rejectUnauthorized: false }
});

async function addColumn() {
    let connection;
    try {
        connection = await pool.getConnection();
        
        console.log('📊 Verificando coluna delivery_status...');
        const [columns] = await connection.query(
            "SHOW COLUMNS FROM orders LIKE 'delivery_status'"
        );
        
        if (columns.length > 0) {
            console.log('✅ Coluna delivery_status já existe');
        } else {
            console.log('📝 Criando coluna delivery_status...');
            await connection.query(
                "ALTER TABLE orders ADD COLUMN delivery_status VARCHAR(20) DEFAULT 'calculated'"
            );
            console.log('✅ Coluna delivery_status criada!');
            
            await connection.query(
                "UPDATE orders SET delivery_status = 'calculated' WHERE delivery_status IS NULL"
            );
            console.log('✅ Pedidos existentes atualizados');
        }
        
        // Verificar estrutura
        const [result] = await connection.query(
            "SHOW COLUMNS FROM orders LIKE 'delivery_status'"
        );
        console.table(result);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

addColumn();
