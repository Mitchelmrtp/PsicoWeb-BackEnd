import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';  // Configuración de la base de datos

const Informe = sequelize.define('Informe', {
  id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
  nombre_paciente: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nombre_psicologo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hora_inicio: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hora_fin: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha_sesion: {
    type: DataTypes.STRING,  // Cambiado a STRING para almacenar la fecha como texto
    allowNull: false,
  },
  motivo_consulta: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  objetivo_sesion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  comentario_sesion: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'informes_sesion',  // Nombre de la tabla en la base de datos
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'modified_at',
  deletedAt: 'deleted_at',
});

export default Informe;
