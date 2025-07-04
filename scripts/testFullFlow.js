import http from 'http';

async function testRegistration() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            email: 'testuser2@test.com',
            password: '123456',
            name: 'Test User 2',
            first_name: 'Test',
            last_name: 'User 2',
            role: 'paciente'
        });

        const options = {
            hostname: 'localhost',
            port: 3005,
            path: '/api/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('📝 Testing registration for testuser2@test.com...');

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.success) {
                        console.log('✅ Registration successful!');
                        console.log('- User:', response.data.user?.email);
                        console.log('- Role:', response.data.user?.role);
                        
                        // Now test immediate login
                        setTimeout(() => {
                            testLogin();
                        }, 1000);
                    } else {
                        console.log('❌ Registration failed:', response.message);
                        resolve();
                    }
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

async function testLogin() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            email: 'testuser2@test.com',
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

        console.log('\n🔐 Testing immediate login for testuser2@test.com...');

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
                    } else {
                        console.log('❌ Login failed:', response.message);
                    }
                } catch (error) {
                    console.log('❌ Parse Error:', error.message);
                    console.log('- Raw response:', data);
                }
                resolve();
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

testRegistration();
