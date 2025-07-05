import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RegistroEmocion = sequelize.define('RegistroEmocion', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  idPaciente: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user',
      key: 'id'
    }
  },
  idPsicologo: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user',
      key: 'id'
    }
  },
  idSesion: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sesion',
      key: 'id'
    }
  },
  fechaRegistro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  emociones: {
    type: DataTypes.JSONB, // Para PostgreSQL
    allowNull: false,
    comment: 'JSON con las emociones: {ansiedad: 7, tristeza: 3, alegria: 5, ira: 2, estres: 6, calma: 4}'
  },
  comentarios: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones del psicólogo sobre el estado emocional del paciente'
  },
  estadoGeneral: {
    type: DataTypes.ENUM('muy_malo', 'malo', 'regular', 'bueno', 'muy_bueno'),
    allowNull: false,
    defaultValue: 'regular'
  },
  intensidadPromedio: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    comment: 'Promedio de intensidad emocional calculado automáticamente'
  }
}, {
  tableName: 'registros_emociones',
  timestamps: true,
  indexes: [
    {
      fields: ['idPaciente', 'fechaRegistro']
    },
    {
      fields: ['idPsicologo']
    },
    {
      fields: ['fechaRegistro']
    }
  ]
});

export default RegistroEmocion;
