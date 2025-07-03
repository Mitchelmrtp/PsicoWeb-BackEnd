import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Chat from './Chat.js';
import User from './User.js';

const Mensaje = sequelize.define('Mensaje', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    idChat: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Chat,
            key: 'id'
        }
    },
    idEmisor: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tipoMensaje: {
        type: DataTypes.ENUM('texto', 'archivo', 'imagen', 'pdf', 'documento'),
        defaultValue: 'texto',
        allowNull: false
    },
    nombreArchivo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rutaArchivo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tamanoArchivo: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    mimeType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    leido: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    fechaLectura: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'mensaje',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at',
    paranoid: true,
    indexes: [
        {
            fields: ['idChat', 'created_at']
        },
        {
            fields: ['idEmisor']
        },
        {
            fields: ['leido']
        }
    ]
});

export default Mensaje;
