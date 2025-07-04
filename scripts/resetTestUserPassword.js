/**
 * Reset password for test user
 */
import { UserRepository } from '../src/repositories/UserRepository.js';
import { hashPassword } from '../src/utils/authUtils.js';

async function resetTestUserPassword() {
    try {
        const userRepository = new UserRepository();
        
        // Find the test user
        const user = await userRepository.findByEmail('test@test.com');
        if (!user) {
            console.log('❌ Test user not found');
            return;
        }
        
        console.log('Found test user:', user.email);
        
        // Set new password
        const newPassword = '123456';
        const hashedPassword = await hashPassword(newPassword);
        
        // Update the user's password
        await userRepository.update(user.id, {
            password: hashedPassword
        });
        
        console.log('✅ Test user password updated successfully!');
        console.log('Email: test@test.com');
        console.log('New Password: 123456');
        
    } catch (error) {
        console.error('❌ Error resetting test user password:', error);
    }
}

resetTestUserPassword().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
