import http from 'http';

async function testUpdatedUserLogin() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            email: 'paciente@test.com',
            password: '123456'
        });

        const options = {
            hostname: 'localhost',
            port: 3005,
            path: '/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('🔐 Testing login for updated paciente@test.com...');

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.success) {
                        console.log('✅ Login successful!');
                        console.log('- User:', response.data.user.email);
                        console.log('- Role:', response.data.user.role);
                        console.log('- Token received:', response.data.token ? 'Yes' : 'No');
                    } else {
                        console.log('❌ Login failed:', response.message);
                    }
                    resolve();
                } catch (error) {
                    console.log('❌ Parse Error:', error.message);
                    console.log('- Raw response:', data);
                    resolve();
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request Error:', error.message);
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

testUpdatedUserLogin();
