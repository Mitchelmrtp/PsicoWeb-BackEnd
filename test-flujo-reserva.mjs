import dotenv from 'dotenv';
import { PagoService } from './src/services/PagoService.js';
import { SesionService } from './src/services/SesionService.js';

// Cargar variables de entorno
dotenv.config();

console.log('🧪 SIMULANDO FLUJO COMPLETO DE RESERVA DE CITA');
console.log('══════════════════════════════════════════════════════');

// Datos de prueba (necesitarás reemplazar con IDs reales de tu base de datos)
const datosPrueba = {
  // IDs que necesitas obtener de tu base de datos
  idSesion: '1', // ID de una sesión existente
  idPaciente: '1', // ID de un paciente existente
  monto: 100,
  montoTotal: 118,
  metodoPago: 'tarjeta'
};

console.log('📋 Datos de prueba:');
console.log('   - ID Sesión:', datosPrueba.idSesion);
console.log('   - ID Paciente:', datosPrueba.idPaciente);
console.log('   - Monto total:', datosPrueba.montoTotal);

const pagoService = new PagoService();

async function probarFlujoCompleto() {
  try {
    console.log('');
    console.log('🔄 Simulando procesamiento de pago...');
    
    const resultado = await pagoService.procesarPago(datosPrueba);
    
    console.log('✅ Pago procesado exitosamente');
    console.log('📧 Si no viste logs de envío de correos arriba, el problema está identificado.');
    
  } catch (error) {
    console.error('❌ Error en el flujo:', error.message);
    
    if (error.message.includes('no existe')) {
      console.log('');
      console.log('💡 NECESITAS DATOS REALES DE TU BASE DE DATOS:');
      console.log('   1. Ve a tu base de datos');
      console.log('   2. Encuentra una sesión existente (tabla sesions)');
      console.log('   3. Encuentra un paciente existente (tabla pacientes)');
      console.log('   4. Actualiza los IDs en este script');
      console.log('   5. Vuelve a ejecutar');
    }
  }
}

probarFlujoCompleto();
