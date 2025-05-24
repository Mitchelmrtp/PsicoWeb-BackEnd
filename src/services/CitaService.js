import Cita from "../models/cita.js";

const crearCita = async (data) => {
  return await Cita.create(data);
};

export default {
  crearCita,
};
