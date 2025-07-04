/**
 * Test login with new users
 */

async function testNewUsers() {
    const testCredentials = [
        { email: 'mitchel.mrtp@gmail.com', password: '123456' },
        { email: 'paciente@test.com', password: '123456' },
        { email: 'psicologo_test@example.com', password: '123456' }
    ];

    for (const credentials of testCredentials) {
        console.log(`\n=== Testing Login: ${credentials.email} ===`);
        
        try {
            const response = await fetch('http://localhost:3005/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            console.log('Response status:', response.status);

            const data = await response.text();

            if (response.ok) {
                const jsonData = JSON.parse(data);
                console.log('✅ Login successful!');
                console.log('Token present:', !!jsonData.data?.token);
                console.log('User email:', jsonData.data?.user?.email);
                console.log('User role:', jsonData.data?.user?.role);
            } else {
                console.log('❌ Login failed');
                try {
                    const errorData = JSON.parse(data);
                    console.log('Error message:', errorData.message);
                } catch (e) {
                    console.log('Raw error:', data);
                }
            }
        } catch (error) {
            console.error('Network error:', error.message);
        }
    }
}

testNewUsers();
