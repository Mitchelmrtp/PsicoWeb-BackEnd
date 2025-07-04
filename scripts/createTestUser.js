/**
 * Script to create a test user for login testing
 * Run this script to add a test user to your database
 */

import { UserRepository } from '../src/repositories/UserRepository.js';
import { PacienteRepository } from '../src/repositories/PacienteRepository.js';
import { hashPassword } from '../src/utils/authUtils.js';

async function createTestUser() {
    try {
        const userRepository = new UserRepository();
        const pacienteRepository = new PacienteRepository();

        // Check if test user already exists
        const existingUser = await userRepository.findByEmail('test@test.com');
        if (existingUser) {
            console.log('Test user already exists!');
            console.log('Email: test@test.com');
            console.log('Password: 123456');
            return;
        }

        // Create test user
        const hashedPassword = await hashPassword('123456');
        const user = await userRepository.create({
            email: 'test@test.com',
            password: hashedPassword,
            name: 'Test User',
            first_name: 'Test',
            last_name: 'User',
            telephone: '1234567890',
            role: 'paciente'
        });

        // Create patient profile
        await pacienteRepository.create({
            id: user.id,
            motivoConsulta: 'Test consultation'
        });

        console.log('✅ Test user created successfully!');
        console.log('Email: test@test.com');
        console.log('Password: 123456');
        console.log('Role: paciente');
        
    } catch (error) {
        console.error('❌ Error creating test user:', error);
    }
}

// Run the script
createTestUser().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
