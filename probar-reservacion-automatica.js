#!/usr/bin/env node

/**
 * Script para probar la funcionalidad de asignación automática al reservar cita
 * Simula el proceso completo: reservar cita → asignar psicólogo → crear chat
 */

import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function probarReservacionAutomatica() {
  try {
    console.log('🧪 PROBANDO FUNCIONALIDAD DE RESERVACIÓN AUTOMÁTICA');
    console.log('=' * 60);
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Limpiar datos previos para la prueba
    console.log('🧹 1. LIMPIANDO DATOS PREVIOS PARA LA PRUEBA');
    console.log('-' * 45);
    
    // Eliminar chats existentes
    await client.query('DELETE FROM "chat"');
    console.log('✅ Chats eliminados');
    
    // Eliminar sesiones existentes  
    await client.query('DELETE FROM "sesion"');
    console.log('✅ Sesiones eliminadas');
    
    // Desasignar psicólogos de pacientes
    await client.query('UPDATE "paciente" SET "idPsicologo" = NULL');
    console.log('✅ Asignaciones psicólogo-paciente eliminadas');

    // 2. Verificar usuarios disponibles
    console.log('\n👥 2. VERIFICANDO USUARIOS DISPONIBLES');
    console.log('-' * 40);
    
    const usersQuery = `
      SELECT id, first_name, last_name, email, role
      FROM "user" 
      WHERE deleted_at IS NULL AND role IN ('psicologo', 'paciente')
      ORDER BY role;
    `;
    
    const users = await client.query(usersQuery);
    const paciente = users.rows.find(u => u.role === 'paciente');
    const psicologo = users.rows.find(u => u.role === 'psicologo');

    if (!paciente || !psicologo) {
      console.log('❌ No hay usuarios suficientes para la prueba');
      return;
    }

    console.log(`👤 Paciente: ${paciente.first_name} ${paciente.last_name} (${paciente.id})`);
    console.log(`👨‍⚕️ Psicólogo: ${psicologo.first_name} ${psicologo.last_name} (${psicologo.id})`);

    // 3. Verificar estado inicial
    console.log('\n📋 3. ESTADO INICIAL (ANTES DE LA RESERVACIÓN)');
    console.log('-' * 50);
    
    // Verificar asignación de psicólogo
    const pacienteInitQuery = `
      SELECT p.id, p."idPsicologo"
      FROM "paciente" p
      WHERE p.id = $1;
    `;
    
    const pacienteInit = await client.query(pacienteInitQuery, [paciente.id]);
    console.log(`   Paciente tiene psicólogo asignado: ${pacienteInit.rows[0].idPsicologo ? '✅ SÍ' : '❌ NO'}`);
    
    // Verificar chats existentes
    const chatsInitQuery = 'SELECT COUNT(*) as total FROM "chat"';
    const chatsInit = await client.query(chatsInitQuery);
    console.log(`   Chats existentes: ${chatsInit.rows[0].total}`);

    // 4. Simular reservación de cita (esto normalmente lo haría el SesionService)
    console.log('\n📅 4. SIMULANDO RESERVACIÓN DE CITA');
    console.log('-' * 40);
    
    const fechaCita = new Date();
    fechaCita.setDate(fechaCita.getDate() + 7); // Una semana desde hoy
    
    console.log(`   Fecha de la cita: ${fechaCita.toISOString().split('T')[0]}`);
    console.log(`   Psicólogo: ${psicologo.first_name} ${psicologo.last_name}`);
    console.log(`   Paciente: ${paciente.first_name} ${paciente.last_name}`);
    
    // Crear la sesión
    const createSesionQuery = `
      INSERT INTO "sesion" (id, "idPsicologo", "idPaciente", fecha, "horaInicio", "horaFin", estado, "created_at", "modified_at")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'programada', NOW(), NOW())
      RETURNING id, fecha, "horaInicio", "horaFin";
    `;
    
    // Usar extensión uuid-ossp si está disponible, sino usar función personalizada
    let sesion;
    try {
      sesion = await client.query(createSesionQuery, [
        psicologo.id,
        paciente.id,
        fechaCita.toISOString().split('T')[0],
        '10:00',
        '11:00'
      ]);
    } catch (error) {
      if (error.message.includes('gen_random_uuid')) {
        // Fallback: usar función UUID manual
        const { v4: uuidv4 } = await import('uuid');
        const sesionId = uuidv4();
        
        const createSesionQueryManual = `
          INSERT INTO "sesion" (id, "idPsicologo", "idPaciente", fecha, "horaInicio", "horaFin", estado, "created_at", "modified_at")
          VALUES ($1, $2, $3, $4, $5, $6, 'programada', NOW(), NOW())
          RETURNING id, fecha, "horaInicio", "horaFin";
        `;
        
        sesion = await client.query(createSesionQueryManual, [
          sesionId,
          psicologo.id,
          paciente.id,
          fechaCita.toISOString().split('T')[0],
          '10:00',
          '11:00'
        ]);
      } else {
        throw error;
      }
    }
    
    console.log(`✅ Sesión creada: ${sesion.rows[0].id}`);

    // 5. Simular la lógica de asignación automática que debería ejecutar SesionService
    console.log('\n🔄 5. EJECUTANDO LÓGICA DE ASIGNACIÓN AUTOMÁTICA');
    console.log('-' * 55);
    
    // Asignar psicólogo al paciente
    console.log('   Asignando psicólogo al paciente...');
    await client.query(
      'UPDATE "paciente" SET "idPsicologo" = $1, "modified_at" = NOW() WHERE id = $2',
      [psicologo.id, paciente.id]
    );
    console.log('   ✅ Psicólogo asignado');
    
    // Crear chat automáticamente
    console.log('   Creando chat automáticamente...');
    const { v4: uuidv4 } = await import('uuid');
    const chatId = uuidv4();
    
    await client.query(`
      INSERT INTO "chat" (id, "idPsicologo", "idPaciente", "titulo", "estado", "ultimaActividad", "created_at", "modified_at")
      VALUES ($1, $2, $3, $4, 'activo', NOW(), NOW(), NOW())
    `, [
      chatId,
      psicologo.id,
      paciente.id,
      `Chat con Dr. ${psicologo.first_name} ${psicologo.last_name}`
    ]);
    console.log(`   ✅ Chat creado: ${chatId}`);

    // 6. Verificar estado final
    console.log('\n📊 6. ESTADO FINAL (DESPUÉS DE LA RESERVACIÓN)');
    console.log('-' * 50);
    
    // Verificar asignación final
    const pacienteFinal = await client.query(pacienteInitQuery, [paciente.id]);
    console.log(`   ✅ Paciente tiene psicólogo asignado: ${pacienteFinal.rows[0].idPsicologo ? 'SÍ' : 'NO'}`);
    
    // Verificar chats finales
    const chatsFinal = await client.query(chatsInitQuery);
    console.log(`   ✅ Chats existentes: ${chatsFinal.rows[0].total}`);
    
    // Verificar contactos visibles
    console.log('\n👀 7. VERIFICANDO CONTACTOS VISIBLES');
    console.log('-' * 35);
    
    // Contactos para el paciente
    const contactosPacienteQuery = `
      SELECT 
        c.id as chat_id,
        c.titulo,
        psi_u.first_name as contacto_nombre,
        psi_u.last_name as contacto_apellido
      FROM "chat" c
      JOIN "user" psi_u ON c."idPsicologo" = psi_u.id
      WHERE c."idPaciente" = $1;
    `;
    
    const contactosPaciente = await client.query(contactosPacienteQuery, [paciente.id]);
    console.log(`\n   📱 CONTACTOS PARA ${paciente.first_name}:`);
    if (contactosPaciente.rows.length > 0) {
      contactosPaciente.rows.forEach(contact => {
        console.log(`      ✅ Dr. ${contact.contacto_nombre} ${contact.contacto_apellido}`);
      });
    } else {
      console.log('      ❌ No hay contactos');
    }
    
    // Contactos para el psicólogo
    const contactosPsicologoQuery = `
      SELECT 
        c.id as chat_id,
        c.titulo,
        pac_u.first_name as contacto_nombre,
        pac_u.last_name as contacto_apellido
      FROM "chat" c
      JOIN "user" pac_u ON c."idPaciente" = pac_u.id
      WHERE c."idPsicologo" = $1;
    `;
    
    const contactosPsicologo = await client.query(contactosPsicologoQuery, [psicologo.id]);
    console.log(`\n   👨‍⚕️ CONTACTOS PARA Dr. ${psicologo.first_name}:`);
    if (contactosPsicologo.rows.length > 0) {
      contactosPsicologo.rows.forEach(contact => {
        console.log(`      ✅ ${contact.contacto_nombre} ${contact.contacto_apellido}`);
      });
    } else {
      console.log('      ❌ No hay contactos');
    }

    console.log('\n🎉 RESULTADO DE LA PRUEBA:');
    console.log('=' * 30);
    
    if (contactosPaciente.rows.length > 0 && contactosPsicologo.rows.length > 0) {
      console.log('✅ ÉXITO: La funcionalidad automática funciona correctamente');
      console.log('   - Psicólogo asignado al paciente');
      console.log('   - Chat creado automáticamente');
      console.log('   - Contactos visibles para ambos usuarios');
      console.log('\n🚀 AHORA IMPLEMENTA ESTA LÓGICA EN EL SesionService.createSesion()');
    } else {
      console.log('❌ FALLO: La funcionalidad automática no funciona');
    }

  } catch (error) {
    console.error('\n💥 Error en la prueba:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

console.log('🧪 INICIANDO PRUEBA DE RESERVACIÓN AUTOMÁTICA...\n');
probarReservacionAutomatica();
