import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

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
            model: 'prueba',
            key: 'id'
        }
    },
    enunciado: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    opciones: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const value = this.getDataValue('opciones');
            if (!value) return [];
            try {
                return JSON.parse(value);
            } catch (e) {
                console.error('Error parsing opciones:', e);
                return [];
            }
        },
        set(value) {
            if (Array.isArray(value)) {
                this.setDataValue('opciones', JSON.stringify(value));
            } else if (typeof value === 'string') {
                // Si ya es un string JSON, intentar verificar
                try {
                    JSON.parse(value);
                    this.setDataValue('opciones', value);
                } catch (e) {
                    // No es JSON válido, guardar como un array con un elemento
                    this.setDataValue('opciones', JSON.stringify([value]));
                }
            } else {
                this.setDataValue('opciones', JSON.stringify([]));
            }
        }
    },
    pesoEvaluativo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    tableName: 'pregunta',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at'
});

export default Pregunta;