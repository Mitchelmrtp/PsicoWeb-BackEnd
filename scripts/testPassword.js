/**
 * Test password hashing and login
 */
import { UserRepository } from '../src/repositories/UserRepository.js';
import { hashPassword, comparePassword } from '../src/utils/authUtils.js';

async function testPasswordOperations() {
    try {
        const userRepository = new UserRepository();
        
        // Get the existing user
        const user = await userRepository.findByEmail('mitchel.mrtp@gmail.com');
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log('=== User Info ===');
        console.log('Email:', user.email);
        console.log('Password hash exists:', !!user.password);
        console.log('Password hash length:', user.password?.length || 0);
        console.log('Password hash preview:', user.password?.substring(0, 20) + '...' || 'No password');
        
        // Test different passwords
        const testPasswords = ['123456', 'password', 'Test123!', 'test'];
        
        console.log('\n=== Testing Passwords ===');
        for (const testPassword of testPasswords) {
            try {
                const isValid = await comparePassword(testPassword, user.password);
                console.log(`Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
            } catch (error) {
                console.log(`Password "${testPassword}": ❌ Error - ${error.message}`);
            }
        }
        
        // Test hashing a new password
        console.log('\n=== Testing Hash Function ===');
        const testPassword = '123456';
        const hashedPassword = await hashPassword(testPassword);
        console.log('New hash created:', hashedPassword.substring(0, 20) + '...');
        
        const isValidNew = await comparePassword(testPassword, hashedPassword);
        console.log('New hash validation:', isValidNew ? '✅ VALID' : '❌ Invalid');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testPasswordOperations().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
