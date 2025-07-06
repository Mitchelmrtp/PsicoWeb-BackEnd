import dotenv from 'dotenv';
import EmailService from './src/services/EmailService.js';

// Cargar variables de entorno
dotenv.config();

console.log('🧪 Enviando correo de prueba para verificar funcionalidad...');

const emailPrueba = process.env.EMAIL_USER || 'psicomentespsicologia@gmail.com';

const correoPrueba = `🧪 CORREO DE PRUEBA - PsicoApp

Este es un correo de prueba para verificar que el sistema de notificaciones está funcionando correctamente.

📋 DETALLES DE LA PRUEBA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 Fecha y hora: ${new Date().toLocaleString("es-PE", {
  dateStyle: "full",
  timeStyle: "short",
})}
📧 Email configurado: ${emailPrueba}
🔧 Estado del sistema: Operativo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Si recibes este correo, significa que:
✅ Las credenciales de Gmail están configuradas correctamente
✅ El servicio de correo está funcionando
✅ Los correos automáticos deberían enviarse cuando se reserve una cita

El sistema está listo para enviar notificaciones automáticas a pacientes y psicólogos.

Atentamente,
El equipo técnico de PsicoApp

═══════════════════════════════════════════════════════════════════════════════
Este correo fue generado automáticamente para pruebas del sistema.
═══════════════════════════════════════════════════════════════════════════════`;

EmailService.enviarCorreo(
  emailPrueba,
  "🧪 Prueba del sistema de correos - PsicoApp",
  correoPrueba
)
.then(() => {
  console.log('✅ ¡Correo de prueba enviado exitosamente!');
  console.log(`📧 Revisa la bandeja de entrada de: ${emailPrueba}`);
  console.log('🎯 Si recibes el correo, el sistema está listo para enviar notificaciones automáticas.');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ Error enviando correo de prueba:', error);
  process.exit(1);
});
