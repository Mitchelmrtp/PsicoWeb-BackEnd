import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING
    },
    last_name: {
        type: DataTypes.STRING
    },
    telephone: {
        type: DataTypes.STRING
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    modified_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'paciente',
        validate: {
            isIn: [['admin', 'psicologo', 'paciente']]
        }
    },
}, {
    tableName: 'user',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at',
    deletedAt: 'deleted_at', 
    paranoid: true
});

export default User;