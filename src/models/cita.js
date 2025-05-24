import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Cita = sequelize.define(
  "Cita",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pacienteNombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pacienteTelefono: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    diagnostico: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metodoPago: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
    },
    fecha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hora: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "user",
        key: "id",
      },
    },
  },
  {
    tableName: "cita",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "modified_at",
  }
);

export default Cita;
