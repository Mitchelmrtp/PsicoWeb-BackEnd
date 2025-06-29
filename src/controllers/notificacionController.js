import Notificacion from "../models/Notificacion.js";

export const getNotificacionesNoLeidas = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: {
        idUsuario: req.user.userId,
        leido: false,
      },
      order: [["fecha_creacion", "DESC"]],
    });

    res.status(200).json(notificaciones);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const marcarComoLeida = async (req, res) => {
  try {
    const notificacion = await Notificacion.findByPk(req.params.id);

    if (!notificacion) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    if (
      notificacion.idUsuario !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "No autorizado para modificar esta notificación" });
    }

    await notificacion.update({ leido: true });

    res.status(200).json({ message: "Notificación marcada como leída" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
