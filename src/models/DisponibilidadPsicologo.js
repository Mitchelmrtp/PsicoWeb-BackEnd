import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Psicologo from './Psicologo.js';

const DisponibilidadPsicologo = sequelize.define('DisponibilidadPsicologo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idPsicologo: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Psicologo,
            key: 'id'
        }
    },
    diaSemana: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']]
        }
    },
    horaInicio: {
        type: DataTypes.TIME,
        allowNull: false
    },
    horaFin: {
        type: DataTypes.TIME,
        allowNull: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    fechaCreacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'disponibilidad_psicologo',
    timestamps: true,
    createdAt: 'fechaCreacion',
    updatedAt: false
});

export default DisponibilidadPsicologo;