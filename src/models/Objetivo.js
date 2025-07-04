import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Paciente from './Paciente.js';
import Psicologo from './Psicologo.js';

const Objetivo = sequelize.define('Objetivo', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    fechaLimite: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('activo', 'completado', 'pausado', 'cancelado'),
        defaultValue: 'activo',
        allowNull: false
    },
    prioridad: {
        type: DataTypes.ENUM('baja', 'media', 'alta'),
        defaultValue: 'media',
        allowNull: false
    },
    progreso: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        }
    },
    idPaciente: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Paciente,
            key: 'id'
        }
    },
    idPsicologo: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Psicologo,
            key: 'id'
        }
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'objetivos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['idPaciente']
        },
        {
            fields: ['idPsicologo']
        },
        {
            fields: ['estado']
        }
    ]
});

export default Objetivo;
