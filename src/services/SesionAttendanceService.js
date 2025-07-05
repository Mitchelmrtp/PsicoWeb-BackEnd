export class SesionAttendanceService {
  constructor(sesionRepository) {
    this.sesionRepository = sesionRepository;
  }

  /**
   * Marca la asistencia a una sesión.
   * @param {string} id - ID de la sesión
   * @param {Object} data - Datos como notas y horaFin
   * @returns {Promise<Sesion>}
   */
  async registrarAsistencia(id, data = {}) {
    const sesion = await this.sesionRepository.findById(id);
    if (!sesion) {
      throw new Error(`Sesión con ID ${id} no encontrada`);
    }

    if (sesion.estado === "completada") {
      throw new Error("La asistencia ya fue registrada.");
    }

    sesion.estado = "completada";
    if (data.notas !== undefined) sesion.notas = data.notas;
    if (data.horaFin !== undefined) sesion.horaFin = data.horaFin;

    await sesion.save();
    return sesion;
  }
}
