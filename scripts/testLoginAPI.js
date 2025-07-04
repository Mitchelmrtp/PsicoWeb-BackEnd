/**
 * Test login API directly
 */

async function testLoginAPI() {
    const testCredentials = [
        { email: 'mitchel.mrtp@gmail.com', password: '123456' },
        { email: 'test@test.com', password: '123456' }
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
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const data = await response.text();
            console.log('Response body:', data);

            if (response.ok) {
                const jsonData = JSON.parse(data);
                console.log('✅ Login successful!');
                console.log('Token present:', !!jsonData.data?.token);
                console.log('User data:', jsonData.data?.user?.email);
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

testLoginAPI();
