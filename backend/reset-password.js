const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 4000,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // 1. Verificar usuários existentes
        const [users] = await pool.query(
            'SELECT id, name, email, tenant_id FROM users ORDER BY id'
        );
        
        console.log('=========================================');
        console.log('👤 USUÁRIOS CADASTRADOS');
        console.log('=========================================');
        
        if (users.length === 0) {
            console.log('❌ NENHUM usuário encontrado!');
            console.log('');
            console.log('Você precisa criar um usuário admin primeiro.');
            console.log('Use o registro: http://localhost:5173/register');
            await pool.end();
            process.exit(0);
        }
        
        users.forEach((user, index) => {
            console.log(`📌 ${index + 1}. ID: ${user.id}`);
            console.log(`   Nome: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Tenant: ${user.tenant_id}`);
            console.log('');
        });
        
        // 2. Solicitar qual usuário resetar
        console.log('=========================================');
        console.log('🔑 RESETAR SENHA');
        console.log('=========================================');
        console.log('Digite o ID do usuário para resetar a senha:');
        console.log('(ou pressione Enter para resetar o primeiro usuário)');
        console.log('');
        
        // Por simplicidade, vamos resetar o primeiro usuário
        const userId = users[0].id;
        const userEmail = users[0].email;
        const userName = users[0].name;
        
        console.log(`🔄 Resetando senha para: ${userName} (${userEmail})`);
        console.log('');
        
        // 3. Gerar nova senha
        const newPassword = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        // 4. Atualizar senha
        await pool.query(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [passwordHash, userId]
        );
        
        console.log('✅ SENHA RESETADA COM SUCESSO!');
        console.log('');
        console.log('📋 NOVAS CREDENCIAIS:');
        console.log(`   Email: ${userEmail}`);
        console.log(`   Senha: ${newPassword}`);
        console.log('');
        console.log('⚠️  Altere a senha após o primeiro login!');
        
        await pool.end();
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

resetPassword();
