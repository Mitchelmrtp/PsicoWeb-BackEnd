/**
 * Reset password for existing user
 */
import { UserRepository } from '../src/repositories/UserRepository.js';
import { hashPassword } from '../src/utils/authUtils.js';

async function resetPassword() {
    try {
        const userRepository = new UserRepository();
        
        // Find the existing user
        const user = await userRepository.findByEmail('mitchel.mrtp@gmail.com');
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log('Found user:', user.email);
        
        // Set new password
        const newPassword = '123456';
        const hashedPassword = await hashPassword(newPassword);
        
        // Update the user's password
        await userRepository.update(user.id, {
            password: hashedPassword
        });
        
        console.log('✅ Password updated successfully!');
        console.log('Email: mitchel.mrtp@gmail.com');
        console.log('New Password: 123456');
        
    } catch (error) {
        console.error('❌ Error resetting password:', error);
    }
}

resetPassword().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
