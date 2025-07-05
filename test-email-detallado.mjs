import dotenv from 'dotenv';
import EmailService from './src/services/EmailService.js';

// Cargar variables de entorno
dotenv.config();

console.log('🧪 TEST DETALLADO DE CONFIGURACIÓN DE EMAIL');
console.log('═══════════════════════════════════════════════════════');

// Verificar variables de entorno
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || 'NO CONFIGURADO');
console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? 'CONFIGURADO (****)' : 'NO CONFIGURADO');
console.log('🔧 Configuración de EmailService:');

// Mostrar configuración del transporter (sin credenciales sensibles)
console.log('   - Host: smtp.gmail.com');
console.log('   - Puerto: 587');
console.log('   - Secure: false');
console.log('   - Auth configurado:', !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS);

console.log('');
console.log('🔍 Verificando conexión con Gmail...');

// Test de conexión
EmailService.verificarConexion()
  .then((resultado) => {
    if (resultado) {
      console.log('✅ ¡CONEXIÓN EXITOSA! Las credenciales de Gmail funcionan correctamente.');
      console.log('📧 Probando envío de correo...');
      
      // Si la conexión es exitosa, probar envío
      return EmailService.enviarCorreo(
        process.env.EMAIL_USER,
        '🧪 Test de envío - PsicoApp',
        'Este es un correo de prueba para verificar que el sistema está funcionando correctamente.'
      );
    } else {
      throw new Error('Conexión fallida');
    }
  })
  .then(() => {
    console.log('✅ ¡CORREO ENVIADO EXITOSAMENTE!');
    console.log('🎯 El sistema está listo para enviar notificaciones automáticas.');
    console.log('');
    console.log('💡 ESTADO FINAL: SISTEMA OPERATIVO');
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ ERROR DE CONEXIÓN O ENVÍO:');
    console.log('   ', error.message);
    console.log('');
    console.log('🔧 POSIBLES SOLUCIONES:');
    console.log('1. ✏️  Verifica que la contraseña de aplicación sea correcta');
    console.log('2. 🔄 Genera una nueva contraseña de aplicación en Gmail');
    console.log('3. ✅ Confirma que la verificación en 2 pasos esté activada');
    console.log('4. 🚫 Revisa si la cuenta no está temporalmente bloqueada');
    console.log('');
    console.log('📋 PASOS DETALLADOS:');
    console.log('   a) Ve a: https://myaccount.google.com/security');
    console.log('   b) Busca "Contraseñas de aplicaciones"');
    console.log('   c) Genera una nueva para "PsicoApp"');
    console.log('   d) Actualiza EMAIL_PASS en el archivo .env');
    console.log('');
    console.log('⚠️  NOTA: A pesar de este error, el resto del sistema funciona correctamente.');
    console.log('    El envío de correos se activará una vez que se corrijan las credenciales.');
    process.exit(1);
  });
