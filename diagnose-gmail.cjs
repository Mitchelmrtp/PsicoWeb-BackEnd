require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 DIAGNÓSTICO DETALLADO DE GMAIL');
console.log('=================================');

// 1. Verificar variables de entorno
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || 'NO CONFIGURADO');
console.log('🔑 EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'NO CONFIGURADO');
console.log('🔑 EMAIL_PASS chars:', process.env.EMAIL_PASS || 'NO CONFIGURADO');

// 2. Crear configuración del transporter
const config = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    debug: true, // Habilitar debug
    logger: true // Habilitar logging
};

console.log('\n🔧 Configuración del transporter:');
console.log('Service:', config.service);
console.log('User:', config.auth.user);
console.log('Pass length:', config.auth.pass ? config.auth.pass.length : 'undefined');

// 3. Crear transporter
const transporter = nodemailer.createTransport(config);

// 4. Verificar conexión con más detalles
console.log('\n⏳ Verificando conexión...');

transporter.verify((error, success) => {
    if (error) {
        console.log('❌ ERROR DETALLADO:');
        console.log('Code:', error.code);
        console.log('Response:', error.response);
        console.log('ResponseCode:', error.responseCode);
        console.log('Command:', error.command);
        console.log('\n📋 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que 2FA esté activado en Gmail');
        console.log('2. Revocar contraseña actual y generar nueva');
        console.log('3. Usar "Correo" como nombre de aplicación al generar');
        console.log('4. Esperar 5-10 minutos para propagación');
        console.log('5. Verificar que no hay espacios extra en la contraseña');
    } else {
        console.log('✅ Conexión exitosa! Gmail está configurado correctamente.');
        
        // Enviar correo de prueba
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Enviar a ti mismo
            subject: 'Prueba de configuración - PsicoWeb',
            html: `
                <h2>¡Configuración exitosa!</h2>
                <p>El servicio de correo de PsicoWeb está funcionando correctamente.</p>
                <p>Fecha de prueba: ${new Date().toLocaleString()}</p>
            `
        };
        
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log('❌ Error enviando correo de prueba:', err.message);
            } else {
                console.log('📧 Correo de prueba enviado exitosamente!');
                console.log('Message ID:', info.messageId);
            }
        });
    }
});
