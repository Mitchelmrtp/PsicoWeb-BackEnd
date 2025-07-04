/**
 * Debug script to check users in database
 */
import { UserRepository } from '../src/repositories/UserRepository.js';

async function checkUsers() {
    try {
        const userRepository = new UserRepository();
        const users = await userRepository.findAll();
        
        console.log('=== Users in Database ===');
        console.log('Total users:', users.length);
        
        users.forEach(user => {
            console.log(`
ID: ${user.id}
Email: ${user.email}
Name: ${user.name}
Role: ${user.role}
Created: ${user.createdAt}
---`);
        });
        
        // Try to find the test user specifically
        const testUser = await userRepository.findByEmail('test@test.com');
        if (testUser) {
            console.log('\n=== Test User Found ===');
            console.log('Test user exists:', testUser.email);
            console.log('Password hash length:', testUser.password?.length || 'No password');
        } else {
            console.log('\n❌ Test user not found');
        }
        
    } catch (error) {
        console.error('❌ Error checking users:', error);
    }
}

checkUsers().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
