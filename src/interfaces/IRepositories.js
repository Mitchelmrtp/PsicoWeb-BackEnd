/**
 * Base Repository Interface
 * Aplica el principio de Dependency Inversion (SOLID)
 */
export class IBaseRepository {
  async findAll(options = {}) {
    throw new Error('Method findAll must be implemented');
  }

  async findById(id, options = {}) {
    throw new Error('Method findById must be implemented');
  }

  async create(data) {
    throw new Error('Method create must be implemented');
  }

  async update(id, data) {
    throw new Error('Method update must be implemented');
  }

  async delete(id) {
    throw new Error('Method delete must be implemented');
  }

  async findByCondition(condition, options = {}) {
    throw new Error('Method findByCondition must be implemented');
  }
}

/**
 * User Repository Interface
 */
export class IUserRepository extends IBaseRepository {
  async findByEmail(email) {
    throw new Error('Method findByEmail must be implemented');
  }

  async findByRole(role) {
    throw new Error('Method findByRole must be implemented');
  }
}

/**
 * Sesion Repository Interface
 */
export class ISesionRepository extends IBaseRepository {
  async findByPsicologoId(psicologoId, options = {}) {
    throw new Error('Method findByPsicologoId must be implemented');
  }

  async findByPacienteId(pacienteId, options = {}) {
    throw new Error('Method findByPacienteId must be implemented');
  }

  async findByDateRange(startDate, endDate, options = {}) {
    throw new Error('Method findByDateRange must be implemented');
  }

  async findByEstado(estado, options = {}) {
    throw new Error('Method findByEstado must be implemented');
  }
}

/**
 * Paciente Repository Interface
 */
export class IPacienteRepository extends IBaseRepository {
  async findByPsicologoId(psicologoId) {
    throw new Error('Method findByPsicologoId must be implemented');
  }

  async findWithUser(id) {
    throw new Error('Method findWithUser must be implemented');
  }
}

/**
 * Psicologo Repository Interface
 */
export class IPsicologoRepository extends IBaseRepository {
  async findWithUser(id) {
    throw new Error('Method findWithUser must be implemented');
  }

  async findByEspecialidad(especialidad) {
    throw new Error('Method findByEspecialidad must be implemented');
  }
}

/**
 * Prueba Repository Interface
 */
export class IPruebaRepository extends IBaseRepository {
  async findAllWithPreguntas() {
    throw new Error('Method findAllWithPreguntas must be implemented');
  }

  async findByIdWithPreguntas(id) {
    throw new Error('Method findByIdWithPreguntas must be implemented');
  }
}

/**
 * Pregunta Repository Interface
 */
export class IPreguntaRepository extends IBaseRepository {
  async findByPruebaId(pruebaId) {
    throw new Error('Method findByPruebaId must be implemented');
  }

  async deleteByPruebaId(pruebaId) {
    throw new Error('Method deleteByPruebaId must be implemented');
  }
}

/**
 * ResultadoPrueba Repository Interface
 */
export class IResultadoPruebaRepository extends IBaseRepository {
  async findByPacienteId(pacienteId) {
    throw new Error('Method findByPacienteId must be implemented');
  }

  async findByPruebaId(pruebaId) {
    throw new Error('Method findByPruebaId must be implemented');
  }

  async findByPacienteAndPrueba(pacienteId, pruebaId) {
    throw new Error('Method findByPacienteAndPrueba must be implemented');
  }
}

/**
 * Disponibilidad Repository Interface
 */
export class IDisponibilidadRepository extends IBaseRepository {
  async findByPsicologoId(psicologoId) {
    throw new Error('Method findByPsicologoId must be implemented');
  }

  async findActivasByPsicologoId(psicologoId) {
    throw new Error('Method findActivasByPsicologoId must be implemented');
  }

  async findConflictingSchedule(psicologoId, diaSemana, horaInicio, horaFin, excludeId) {
    throw new Error('Method findConflictingSchedule must be implemented');
  }
}

/**
 * Calendario Repository Interface
 */
export class ICalendarioRepository extends IBaseRepository {
  async findByUsuarioId(usuarioId) {
    throw new Error('Method findByUsuarioId must be implemented');
  }

  async findByDateRange(fechaInicio, fechaFin, usuarioId) {
    throw new Error('Method findByDateRange must be implemented');
  }
}

/**
 * Notificacion Repository Interface
 */
export class INotificacionRepository extends IBaseRepository {
  async findByUserId(userId, options = {}) {
    throw new Error('Method findByUserId must be implemented');
  }

  async findUnreadByUserId(userId, options = {}) {
    throw new Error('Method findUnreadByUserId must be implemented');
  }

  async markAsRead(id) {
    throw new Error('Method markAsRead must be implemented');
  }

  async markAllAsReadByUserId(userId) {
    throw new Error('Method markAllAsReadByUserId must be implemented');
  }

  async findByType(tipo, options = {}) {
    throw new Error('Method findByType must be implemented');
  }
}
