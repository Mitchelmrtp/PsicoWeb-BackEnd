import sequelize from '../src/config/database.js';
import { User } from '../src/models/index.js';
import { comparePassword } from '../src/utils/authUtils.js';
import bcrypt from 'bcryptjs';

async function testNewPacienteLogin() {
    try {
        await sequelize.authenticate();
        console.log('Conectado a la base de datos');

        // Check if the user exists
        const user = await User.findOne({
            where: { email: 'paciente@test.com' }
        });

        if (!user) {
            console.log('❌ Usuario paciente@test.com no encontrado en la base de datos');
            return;
        }

        console.log('✅ Usuario encontrado:');
        console.log('- ID:', user.id);
        console.log('- Email:', user.email);
        console.log('- Name:', user.name);
        console.log('- Role:', user.role);
        console.log('- Password hash:', user.password);
        console.log('- Created at:', user.createdAt);

        // Test password comparison
        const testPassword = '123456';
        console.log('\n🔑 Probando comparación de contraseña:');
        console.log('- Contraseña a probar:', testPassword);

        // Method 1: Using our authUtils function
        try {
            const isValidAuthUtils = await comparePassword(testPassword, user.password);
            console.log('- comparePassword (authUtils):', isValidAuthUtils ? '✅ Válida' : '❌ Inválida');
        } catch (error) {
            console.log('- comparePassword (authUtils): ❌ Error -', error.message);
        }

        // Method 2: Using bcrypt directly
        try {
            const isValidBcrypt = await bcrypt.compare(testPassword, user.password);
            console.log('- bcrypt.compare (directo):', isValidBcrypt ? '✅ Válida' : '❌ Inválida');
        } catch (error) {
            console.log('- bcrypt.compare (directo): ❌ Error -', error.message);
        }

        // Method 3: Check if hash format is correct
        console.log('\n🔍 Análisis del hash:');
        const hashInfo = {
            length: user.password.length,
            startsWithBcrypt: user.password.startsWith('$2'),
            parts: user.password.split('$').length,
            format: user.password.substring(0, 4)
        };
        console.log('- Información del hash:', hashInfo);

        // Test with a fresh hash
        console.log('\n🆕 Creando hash fresco para comparación:');
        const freshHash = await bcrypt.hash(testPassword, 10);
        console.log('- Hash fresco:', freshHash);
        const freshCompare = await bcrypt.compare(testPassword, freshHash);
        console.log('- Comparación con hash fresco:', freshCompare ? '✅ Válida' : '❌ Inválida');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

testNewPacienteLogin();
