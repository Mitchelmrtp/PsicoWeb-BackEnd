import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Psicologo from './Psicologo.js';
import Paciente from './Paciente.js';

const Chat = sequelize.define('Chat', {
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
    titulo: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Chat de Consulta'
    },
    estado: {
        type: DataTypes.ENUM('activo', 'archivado', 'bloqueado'),
        defaultValue: 'activo',
        allowNull: false
    },
    ultimaActividad: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    tableName: 'chat',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at',
    paranoid: true,
    indexes: [
        {
            unique: true,
            fields: ['idPsicologo', 'idPaciente']
        },
        {
            fields: ['ultimaActividad']
        }
    ]
});

export default Chat;
