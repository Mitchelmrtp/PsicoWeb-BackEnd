import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const Notificacion = sequelize.define(
  "Notificacion",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idUsuario: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "user",
        key: "id",
      },
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    leido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "notificacion",
    timestamps: false,
  }
);

User.hasOne(Notificacion, { foreignKey: "idUsuario", as: "notificacion" });
Notificacion.belongsTo(User, { foreignKey: "idUsuario", as: "usuario" });

export default Notificacion;
