import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Psicologo = sequelize.define('Psicologo', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    especialidad: {
        type: DataTypes.STRING,
        allowNull: false
    },
    licencia: {
        type: DataTypes.STRING,
        allowNull: false
    },
    formacion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    biografia: {
        type: DataTypes.TEXT
    },
    anosExperiencia: {
        type: DataTypes.INTEGER
    },
    tarifaPorSesion: {
        type: DataTypes.DECIMAL(10, 2)
    }
}, {
    tableName: 'psicologo',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at',
    paranoid: true
});


export default Psicologo;