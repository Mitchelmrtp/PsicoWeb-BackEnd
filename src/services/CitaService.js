import Cita from "../models/cita.js";

const crearCita = async (data) => {
  return await Cita.create(data);
};

const reprogramarCita = async (citaId, userId, nuevaFecha, nuevaHora) => {
  const cita = await Cita.findOne({ where: { id: citaId, userId } });
  if (!cita) throw new Error("Cita no encontrada o acceso denegado");

  cita.fecha = nuevaFecha;
  cita.hora = nuevaHora;
  await cita.save();

  return cita;
};

export default {
  crearCita,
  reprogramarCita,
};
