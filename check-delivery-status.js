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
        
        console.log('📊 Verificando coluna delivery_status:');
        const [columns] = await connection.query(
            "SHOW COLUMNS FROM orders LIKE 'delivery_status'"
        );
        
        if (columns.length > 0) {
            console.log('✅ Coluna delivery_status existe');
            console.table(columns);
        } else {
            console.log('❌ Coluna delivery_status NÃO existe');
            console.log('📝 Criando coluna delivery_status...');
            
            await connection.query(
                "ALTER TABLE orders ADD COLUMN delivery_status VARCHAR(20) DEFAULT 'calculated'"
            );
            console.log('✅ Coluna delivery_status criada com sucesso!');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

checkColumn();
