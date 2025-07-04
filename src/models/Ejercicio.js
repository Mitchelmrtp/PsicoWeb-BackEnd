import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Objetivo from './Objetivo.js';

const Ejercicio = sequelize.define('Ejercicio', {
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
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    instrucciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fechaAsignacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    fechaLimite: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    fechaCompletado: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_progreso', 'completado', 'vencido'),
        defaultValue: 'pendiente',
        allowNull: false
    },
    dificultad: {
        type: DataTypes.ENUM('facil', 'intermedio', 'dificil'),
        defaultValue: 'intermedio',
        allowNull: false
    },
    duracionEstimada: {
        type: DataTypes.INTEGER, // en minutos
        allowNull: true,
        validate: {
            min: 1
        }
    },
    idObjetivo: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Objetivo,
            key: 'id'
        }
    },
    notasPaciente: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    notasPsicologo: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'ejercicios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['idObjetivo']
        },
        {
            fields: ['estado']
        },
        {
            fields: ['fechaLimite']
        }
    ]
});

// Add virtual field for frontend compatibility
Ejercicio.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    values.completado = this.estado === 'completado';
    return values;
};

export default Ejercicio;
