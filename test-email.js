import dotenv from 'dotenv';
import EmailService from './src/services/EmailService.js';

// Cargar variables de entorno
dotenv.config();

console.log('🔍 Verificando credenciales de EmailService...');
console.log('📧 Email configurado:', process.env.EMAIL_USER || 'psicomentespsicologia@gmail.com');
console.log('🔑 Password configurado:', process.env.EMAIL_PASS ? '***configurado***' : 'no configurado');

// Probar la conexión
EmailService.verificarConexion()
  .then((resultado) => {
    if (resultado) {
      console.log('✅ ¡Credenciales ACEPTADAS! El EmailService está listo para enviar correos.');
    } else {
      console.log('❌ Credenciales RECHAZADAS. Necesitas configurar una contraseña de aplicación de Gmail.');
      console.log('');
      console.log('📋 PASOS PARA CONFIGURAR:');
      console.log('1. Ve a https://myaccount.google.com/security');
      console.log('2. Activa la verificación en 2 pasos');
      console.log('3. Busca "Contraseñas de aplicaciones"');
      console.log('4. Genera una nueva contraseña para "Correo"');
      console.log('5. Usa esa contraseña de 16 caracteres en EMAIL_PASS');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ Error al verificar credenciales:', error.message);
    process.exit(1);
  });
