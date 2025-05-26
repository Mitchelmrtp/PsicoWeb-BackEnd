import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Prueba from './Prueba.js';
import Paciente from './Paciente.js';

const ResultadoPrueba = sequelize.define('ResultadoPrueba', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    idPrueba: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Prueba,
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
    fechaRealizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    resultado: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    interpretacion: {
        type: DataTypes.TEXT
    },
    puntuacionTotal: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    puntuacionPromedio: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}, {
    tableName: 'resultado_prueba',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at',
    paranoid: true
});


export default ResultadoPrueba;