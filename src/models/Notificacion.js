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
    fechaNotificacion: {
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
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "modified_at",
    paranoid: true,
    indexes: [
      {
        fields: ["idUsuario", "created_at"],
      },
      {
        fields: ["leido"],
      },
    ],
  }
);

User.hasMany(Notificacion, { foreignKey: "idUsuario", as: "notificaciones" });
Notificacion.belongsTo(User, { foreignKey: "idUsuario", as: "usuario" });

export default Notificacion;
