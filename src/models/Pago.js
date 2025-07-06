import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Sesion from './Sesion.js';
import Paciente from './Paciente.js';

const Pago = sequelize.define('Pago', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    idSesion: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Sesion,
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
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    montoImpuestos: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    montoTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    metodoPago: {
        type: DataTypes.ENUM('tarjeta', 'paypal', 'efectivo', 'transferencia'),
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'procesando', 'completado', 'fallido', 'reembolsado'),
        defaultValue: 'pendiente'
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ID de la transacción del proveedor de pago (PayPal, Stripe, etc.)'
    },
    detallesPago: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Detalles adicionales del pago en formato JSON'
    },
    fechaPago: {
        type: DataTypes.DATE,
        allowNull: true
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    numeroComprobante: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        comment: 'Número único del comprobante de pago'
    }
}, {
    tableName: 'pago',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'modified_at',
    paranoid: true,
    indexes: [
        {
            fields: ['idSesion']
        },
        {
            fields: ['idPaciente']
        },
        {
            fields: ['estado']
        },
        {
            fields: ['numeroComprobante'],
            unique: true
        }
    ]
});

export default Pago;
