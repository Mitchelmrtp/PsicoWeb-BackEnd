import sequelize from '../src/config/database.js';

async function deleteTestUser() {
    try {
        await sequelize.authenticate();
        console.log('🗑️ Deleting test user directly...');

        // Delete from paciente table first
        await sequelize.query('DELETE FROM paciente WHERE id IN (SELECT id FROM "user" WHERE email = ?)', {
            replacements: ['testuser2@test.com']
        });

        // Delete from user table
        const [results, metadata] = await sequelize.query('DELETE FROM "user" WHERE email = ?', {
            replacements: ['testuser2@test.com']
        });

        console.log('✅ Deleted', metadata.rowCount || 0, 'user(s)');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

deleteTestUser();
