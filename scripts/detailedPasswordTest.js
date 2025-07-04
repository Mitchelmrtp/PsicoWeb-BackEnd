/**
 * Detailed password debugging
 */
import { UserRepository } from '../src/repositories/UserRepository.js';
import { hashPassword, comparePassword } from '../src/utils/authUtils.js';
import bcrypt from 'bcryptjs';

async function detailedPasswordTest() {
    try {
        const userRepository = new UserRepository();
        
        // Test 1: Get the user and check the stored hash
        console.log('=== Test 1: User Data ===');
        const user = await userRepository.findByEmail('mitchel.mrtp@gmail.com');
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log('User ID:', user.id);
        console.log('User Email:', user.email);
        console.log('Password Hash Length:', user.password?.length);
        console.log('Password Hash:', user.password);
        
        // Test 2: Direct bcrypt comparison
        console.log('\n=== Test 2: Direct bcrypt comparison ===');
        const testPassword = '123456';
        try {
            const directResult = await bcrypt.compare(testPassword, user.password);
            console.log(`Direct bcrypt.compare("${testPassword}", hash):`, directResult);
        } catch (error) {
            console.log('Direct bcrypt error:', error.message);
        }
        
        // Test 3: Our util function
        console.log('\n=== Test 3: Our comparePassword function ===');
        try {
            const utilResult = await comparePassword(testPassword, user.password);
            console.log(`comparePassword("${testPassword}", hash):`, utilResult);
        } catch (error) {
            console.log('comparePassword error:', error.message);
        }
        
        // Test 4: Create a new hash and test it
        console.log('\n=== Test 4: Fresh hash test ===');
        const freshHash = await hashPassword(testPassword);
        console.log('Fresh hash:', freshHash);
        
        const freshComparison = await comparePassword(testPassword, freshHash);
        console.log(`comparePassword("${testPassword}", freshHash):`, freshComparison);
        
        // Test 5: Update the user with the fresh hash
        console.log('\n=== Test 5: Update with fresh hash ===');
        await userRepository.update(user.id, { password: freshHash });
        console.log('✅ Updated user with fresh hash');
        
        // Test 6: Re-fetch and test
        console.log('\n=== Test 6: Re-fetch and test ===');
        const updatedUser = await userRepository.findByEmail('mitchel.mrtp@gmail.com');
        console.log('Updated password hash:', updatedUser.password);
        
        const finalTest = await comparePassword(testPassword, updatedUser.password);
        console.log(`Final test - comparePassword("${testPassword}", updatedHash):`, finalTest);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

detailedPasswordTest().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
