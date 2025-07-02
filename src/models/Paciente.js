import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Psicologo from './Psicologo.js';

const Paciente = sequelize.define('Paciente', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    diagnosticoPreliminar: {
        type: DataTypes.TEXT
    },
    fechaRegistro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    motivoConsulta: {
        type: DataTypes.TEXT
    },
    diagnostico: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    idPsicologo: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: Psicologo,
            key: 'id'
        }
    }
}, {
    tableName: 'paciente',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at',
    paranoid: true
});


export default Paciente;