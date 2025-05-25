import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Prueba from './Prueba.js';

const Pregunta = sequelize.define('Pregunta', {
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
    enunciado: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    opciones: {
        type: DataTypes.JSON,
        allowNull: false
    },
    pesoEvaluativo: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    tableName: 'pregunta',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at',
    paranoid: true
});


export default Pregunta;