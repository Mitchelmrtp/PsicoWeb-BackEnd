import dotenv from 'dotenv';
import EmailService from './src/services/EmailService.js';

// Cargar variables de entorno
dotenv.config();

console.log('📧 PRUEBA DIRECTA DE ENVÍO DE CORREO DE CONFIRMACIÓN');
console.log('═══════════════════════════════════════════════════════════');

// Datos de prueba para simular una confirmación de cita
const datosPrueba = {
  emailPaciente: 'mitchel.mrtp@gmail.com', // El email del .env que sabemos que funciona
  nombrePaciente: 'Paciente de Prueba',
  nombrePsicologo: 'Dr. Psicólogo de Prueba',
  fechaCita: 'lunes, 6 de enero de 2025, 10:00',
  monto: 100
};

const correoPrueba = `Hola ${datosPrueba.nombrePaciente},

¡Gracias por reservar tu cita en PsicoApp! 🎉

Te confirmamos que has agendado exitosamente una sesión con el psicólogo ${datosPrueba.nombrePsicologo}.

📋 RESUMEN DE TU CITA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍⚕️ Psicólogo: ${datosPrueba.nombrePsicologo}
📅 Fecha y hora: ${datosPrueba.fechaCita}
💰 Monto pagado: S/. ${datosPrueba.monto}
💳 Método de pago: Tarjeta
💬 Chat disponible: Ya puedes comunicarte con tu psicólogo a través del chat
🏥 Plataforma: PsicoApp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este encuentro representa un paso importante en tu bienestar emocional y personal. Queremos que sepas que estás dando un gran paso al priorizar tu salud mental, y estaremos aquí para acompañarte en todo el proceso.

📌 RECOMENDACIONES IMPORTANTES:
• Conéctate unos minutos antes de la sesión
• Si necesitas reprogramar o cancelar, puedes hacerlo desde tu panel
• Utiliza el chat para cualquier consulta previa con tu psicólogo
• Prepara las preguntas o temas que te gustaría abordar

Ante cualquier duda o inconveniente, no dudes en contactarnos.
Nuestro equipo estará encantado de ayudarte.

¡Gracias por confiar en nosotros! 💙
El equipo de PsicoApp

═══════════════════════════════════════════════════════════════════════════════
Este correo fue generado automáticamente. Por favor, no responder a este mensaje.
═══════════════════════════════════════════════════════════════════════════════`;

console.log('📋 Enviando correo de confirmación de cita...');
console.log('📧 Destinatario:', datosPrueba.emailPaciente);

EmailService.enviarCorreo(
  datosPrueba.emailPaciente,
  "✅ Cita reservada y pago confirmado - PsicoApp",
  correoPrueba
)
.then(() => {
  console.log('✅ ¡Correo de confirmación enviado exitosamente!');
  console.log('📧 Revisa la bandeja de entrada de:', datosPrueba.emailPaciente);
  console.log('');
  console.log('🎯 Si recibes este correo, el problema NO es el EmailService.');
  console.log('🔍 El problema está en el flujo de reserva que no está llamando al envío de correos.');
  console.log('');
  console.log('📋 SIGUIENTE PASO: Revisar por qué no aparecen los logs de debugging');
  console.log('    cuando haces una reserva real desde el frontend.');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ Error enviando correo de confirmación:', error);
  console.log('');
  console.log('🔧 Si hay error aquí, el problema SÍ es el EmailService.');
  process.exit(1);
});
