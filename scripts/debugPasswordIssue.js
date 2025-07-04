import sequelize from '../src/config/database.js';
import { User } from '../src/models/index.js';
import { hashPassword, comparePassword } from '../src/utils/authUtils.js';
import bcrypt from 'bcryptjs';

async function testPasswordIssue() {
    try {
        await sequelize.authenticate();
        console.log('Conectado a la base de datos');

        // Get the problematic user
        const user = await User.findOne({
            where: { email: 'paciente@test.com' }
        });

        if (!user) {
            console.log('❌ Usuario no encontrado');
            return;
        }

        console.log('👤 Usuario:', user.email);
        console.log('🔐 Hash almacenado:', user.password);
        
        // Test with various password possibilities
        const possiblePasswords = [
            '123456',
            'password',
            'paciente123',
            '123456\n',
            '123456\r',
            '123456 ',
            ' 123456',
            'password123'
        ];

        console.log('\n🔍 Probando diferentes contraseñas:');
        for (const pwd of possiblePasswords) {
            try {
                const isValid = await comparePassword(pwd, user.password);
                console.log(`- "${pwd}" (${pwd.length} chars):`, isValid ? '✅ Válida' : '❌ Inválida');
            } catch (error) {
                console.log(`- "${pwd}": ❌ Error -`, error.message);
            }
        }

        // Test the registration flow manually
        console.log('\n🧪 Simulando proceso de registro:');
        const testPassword = '123456';
        const newHash = await hashPassword(testPassword);
        console.log('- Nueva contraseña hasheada:', newHash);
        
        const newComparison = await comparePassword(testPassword, newHash);
        console.log('- Comparación con nuevo hash:', newComparison ? '✅ Válida' : '❌ Inválida');

        // Let's update the user with a fresh hash
        console.log('\n🔄 Actualizando usuario con nuevo hash:');
        await User.update(
            { password: newHash },
            { where: { email: 'paciente@test.com' } }
        );
        
        console.log('- Hash actualizado en la base de datos');
        
        // Test again
        const updatedUser = await User.findOne({
            where: { email: 'paciente@test.com' }
        });
        
        const finalTest = await comparePassword(testPassword, updatedUser.password);
        console.log('- Test final con hash actualizado:', finalTest ? '✅ Válida' : '❌ Inválida');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

testPasswordIssue();
