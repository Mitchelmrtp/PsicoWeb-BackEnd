import sequelize from '../config/database.js';
import User from './User.js';
import Psicologo from './Psicologo.js';
import Paciente from './Paciente.js';
import Calendario from './Calendario.js';
import Evento from './Evento.js';
import Sesion from './Sesion.js';
import Prueba from './Prueba.js';
import Pregunta from './Pregunta.js';
import ResultadoPrueba from './ResultadoPrueba.js';
import DisponibilidadPsicologo from './DisponibilidadPsicologo.js';
import Chat from './Chat.js';
import Mensaje from './Mensaje.js';

// Define associations between models

// One-to-One relationships
User.hasOne(Psicologo, { 
  foreignKey: 'id',
  onDelete: 'CASCADE'
});
Psicologo.belongsTo(User, { 
  foreignKey: 'id',
  onDelete: 'CASCADE'
});

User.hasOne(Paciente, { 
  foreignKey: 'id',
  onDelete: 'CASCADE' 
});
Paciente.belongsTo(User, { 
  foreignKey: 'id',
  onDelete: 'CASCADE'
});

User.hasOne(Calendario, { 
  foreignKey: 'idUsuario', 
  as: 'calendario',
  onDelete: 'CASCADE'
});
Calendario.belongsTo(User, { 
  foreignKey: 'idUsuario',
  onDelete: 'CASCADE'
});

// One-to-Many relationships
Calendario.hasMany(Evento, { 
  foreignKey: 'idCalendario', 
  as: 'eventos',
  onDelete: 'CASCADE'
});
Evento.belongsTo(Calendario, { 
  foreignKey: 'idCalendario',
  onDelete: 'CASCADE'
});

// Correct the relationship to match ER diagram (one-to-many)
Psicologo.hasMany(Paciente, { 
  foreignKey: 'idPsicologo',
  as: 'pacientes',
  onDelete: 'SET NULL'
});
Paciente.belongsTo(Psicologo, { 
  foreignKey: 'idPsicologo',
  as: 'psicologo',
  onDelete: 'SET NULL'
});

// Session relationships
Psicologo.hasMany(Sesion, { 
  foreignKey: 'idPsicologo',
  onDelete: 'CASCADE'
});
Sesion.belongsTo(Psicologo, { 
  foreignKey: 'idPsicologo',
  onDelete: 'CASCADE'
});

Paciente.hasMany(Sesion, { 
  foreignKey: 'idPaciente',
  onDelete: 'CASCADE'
});
Sesion.belongsTo(Paciente, { 
  foreignKey: 'idPaciente',
  onDelete: 'CASCADE'
});

// Test and questions relationships
Prueba.hasMany(Pregunta, { 
  foreignKey: 'idPrueba',
  as: 'Preguntas',  // El alias usado
  onDelete: 'CASCADE' 
});
Pregunta.belongsTo(Prueba, { 
  foreignKey: 'idPrueba',
  onDelete: 'CASCADE'
});

Prueba.hasMany(ResultadoPrueba, { 
  foreignKey: 'idPrueba',
  onDelete: 'CASCADE'
});
ResultadoPrueba.belongsTo(Prueba, { 
  foreignKey: 'idPrueba',
  onDelete: 'CASCADE'
});

Paciente.hasMany(ResultadoPrueba, { 
  foreignKey: 'idPaciente',
  onDelete: 'CASCADE'
});
ResultadoPrueba.belongsTo(Paciente, { 
  foreignKey: 'idPaciente',
  onDelete: 'CASCADE'
});

// Añadir la relación de disponibilidad
Psicologo.hasMany(DisponibilidadPsicologo, { 
  foreignKey: 'idPsicologo',
  as: 'disponibilidades',
  onDelete: 'CASCADE'
});
DisponibilidadPsicologo.belongsTo(Psicologo, { 
  foreignKey: 'idPsicologo',
  onDelete: 'CASCADE'
});

// Chat relationships
Psicologo.hasMany(Chat, { 
  foreignKey: 'idPsicologo',
  as: 'chatsPsicologo',
  onDelete: 'CASCADE'
});
Chat.belongsTo(Psicologo, { 
  foreignKey: 'idPsicologo',
  as: 'psicologo',
  onDelete: 'CASCADE'
});

Paciente.hasMany(Chat, { 
  foreignKey: 'idPaciente',
  as: 'chatsPaciente',
  onDelete: 'CASCADE'
});
Chat.belongsTo(Paciente, { 
  foreignKey: 'idPaciente',
  as: 'paciente',
  onDelete: 'CASCADE'
});

// Message relationships
Chat.hasMany(Mensaje, { 
  foreignKey: 'idChat',
  as: 'mensajes',
  onDelete: 'CASCADE'
});
Mensaje.belongsTo(Chat, { 
  foreignKey: 'idChat',
  as: 'chat',
  onDelete: 'CASCADE'
});

User.hasMany(Mensaje, { 
  foreignKey: 'idEmisor',
  as: 'mensajesEnviados',
  onDelete: 'CASCADE'
});
Mensaje.belongsTo(User, { 
  foreignKey: 'idEmisor',
  as: 'emisor',
  onDelete: 'CASCADE'
});

Psicologo.hasMany(Mensaje, {
  foreignKey: 'idPsicologo',
  onDelete: 'CASCADE'
});
Mensaje.belongsTo(Psicologo, {
  foreignKey: 'idPsicologo',
  onDelete: 'CASCADE'
});

Paciente.hasMany(Mensaje, {
  foreignKey: 'idPaciente',
  onDelete: 'CASCADE'
});
Mensaje.belongsTo(Paciente, {
  foreignKey: 'idPaciente',
  onDelete: 'CASCADE'
});

export {
  sequelize,
  User,
  Psicologo,
  Paciente,
  Calendario,
  Evento,
  Sesion,
  Prueba,
  Pregunta,
  ResultadoPrueba,
  DisponibilidadPsicologo,
  Chat,
  Mensaje
};
