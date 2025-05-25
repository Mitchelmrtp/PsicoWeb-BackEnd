import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Psicologo from './Psicologo.js';
import Paciente from './Paciente.js';

const Sesion = sequelize.define('Sesion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    idPsicologo: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Psicologo,
            key: 'id'
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
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    horaInicio: {
        type: DataTypes.TIME,
        allowNull: false
    },
    horaFin: {
        type: DataTypes.TIME,
        allowNull: false
    },
    notas: {
        type: DataTypes.TEXT
    },
    estado: {
        type: DataTypes.ENUM('programada', 'completada', 'cancelada'),
        defaultValue: 'programada'
    }
}, {
    tableName: 'sesion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at',
    paranoid: true
});


export default Sesion;