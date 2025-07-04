import sequelize from '../src/config/database.js';
import { User, Paciente } from '../src/models/index.js';

async function cleanupTestUser() {
    try {
        await sequelize.authenticate();
        console.log('🗑️ Cleaning up test user...');

        // Find the user first
        const user = await User.findOne({ where: { email: 'testuser2@test.com' } });
        
        if (!user) {
            console.log('ℹ️ No test user found to delete');
            return;
        }

        // Delete from paciente table first (foreign key constraint)
        await Paciente.destroy({
            where: { id: user.id }
        });

        // Delete from user table
        const deleted = await User.destroy({
            where: { email: 'testuser2@test.com' }
        });

        if (deleted > 0) {
            console.log('✅ Test user deleted successfully');
        } else {
            console.log('ℹ️ No test user found to delete');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

cleanupTestUser();
