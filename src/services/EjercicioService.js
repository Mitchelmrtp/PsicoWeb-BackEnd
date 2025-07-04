/**
 * Servicio para gestión de ejercicios
 * Implementa lógica de negocio y reglas específicas del dominio
 */
import EjercicioRepository from '../repositories/EjercicioRepository.js';
import ObjetivoRepository from '../repositories/ObjetivoRepository.js';

class EjercicioService {
  constructor() {
    this.ejercicioRepository = new EjercicioRepository();
    this.objetivoRepository = new ObjetivoRepository();
  }

  /**
   * Obtiene todos los ejercicios de un objetivo
   * @param {string} objetivoId - ID del objetivo
   * @returns {Promise<Array>} Lista de ejercicios del objetivo
   */
  async getEjerciciosByObjetivo(objetivoId) {
    try {
      return await this.ejercicioRepository.getByObjetivoId(objetivoId);
    } catch (error) {
      console.error('Error in EjercicioService.getEjerciciosByObjetivo:', error);
      throw new Error('Error al obtener ejercicios del objetivo');
    }
  }

  /**
   * Obtiene todos los ejercicios asignados a un paciente
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<Array>} Lista de ejercicios del paciente
   */
  async getEjerciciosByPaciente(pacienteId) {
    try {
      return await this.ejercicioRepository.getByPacienteId(pacienteId);
    } catch (error) {
      console.error('Error in EjercicioService.getEjerciciosByPaciente:', error);
      throw new Error('Error al obtener ejercicios del paciente');
    }
  }

  /**
   * Obtiene un ejercicio por ID
   * @param {string} id - ID del ejercicio
   * @returns {Promise<Object>} Ejercicio encontrado
   */
  async getEjercicioById(id) {
    try {
      const ejercicio = await this.ejercicioRepository.getByIdWithRelations(id);
      if (!ejercicio) {
        throw new Error('Ejercicio no encontrado');
      }
      return ejercicio;
    } catch (error) {
      console.error('Error in EjercicioService.getEjercicioById:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo ejercicio
   * @param {Object} ejercicioData - Datos del ejercicio
   * @returns {Promise<Object>} Ejercicio creado
   */
  async createEjercicio(ejercicioData) {
    try {
      // Validar datos requeridos
      this.validateEjercicioData(ejercicioData);

      // Preparar datos para la creación
      const dataToCreate = {
        titulo: ejercicioData.titulo,
        descripcion: ejercicioData.descripcion,
        instrucciones: ejercicioData.instrucciones,
        tipo: ejercicioData.tipo || 'tarea',
        dificultad: ejercicioData.dificultad || 'intermedio',
        duracionEstimada: ejercicioData.duracionEstimada,
        idObjetivo: ejercicioData.objetivoId,
        fechaAsignacion: new Date(),
        fechaLimite: ejercicioData.fechaLimite || null,
        estado: 'pendiente',
        fechaCompletado: null
      };

      return await this.ejercicioRepository.create(dataToCreate);
    } catch (error) {
      console.error('Error in EjercicioService.createEjercicio:', error);
      throw error;
    }
  }

  /**
   * Asigna un ejercicio a un objetivo (alias para createEjercicio)
   * @param {Object} ejercicioData - Datos del ejercicio
   * @returns {Promise<Object>} Ejercicio asignado
   */
  async asignarEjercicio(ejercicioData) {
    try {
      const ejercicio = await this.createEjercicio(ejercicioData);
      
      // Recalcular progreso del objetivo
      if (ejercicioData.objetivoId) {
        await this.objetivoRepository.calcularYActualizarProgreso(ejercicioData.objetivoId);
      }
      
      return ejercicio;
    } catch (error) {
      console.error('Error in EjercicioService.asignarEjercicio:', error);
      throw error;
    }
  }

  /**
   * Actualiza un ejercicio existente
   * @param {string} id - ID del ejercicio
   * @param {Object} ejercicioData - Datos actualizados
   * @returns {Promise<Object>} Ejercicio actualizado
   */
  async updateEjercicio(id, ejercicioData) {
    try {
      const ejercicio = await this.ejercicioRepository.findByIdSafe(id);
      if (!ejercicio) {
        throw new Error('Ejercicio no encontrado');
      }

      // Preparar datos para actualización
      const dataToUpdate = {};
      if (ejercicioData.descripcion !== undefined) dataToUpdate.descripcion = ejercicioData.descripcion;
      if (ejercicioData.instrucciones !== undefined) dataToUpdate.instrucciones = ejercicioData.instrucciones;
      if (ejercicioData.tipo !== undefined) dataToUpdate.tipo = ejercicioData.tipo;
      if (ejercicioData.fechaLimite !== undefined) dataToUpdate.fechaLimite = ejercicioData.fechaLimite;

      await this.ejercicioRepository.update(id, dataToUpdate);
      return await this.getEjercicioById(id);
    } catch (error) {
      console.error('Error in EjercicioService.updateEjercicio:', error);
      throw error;
    }
  }

  /**
   * Elimina un ejercicio
   * @param {string} id - ID del ejercicio
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteEjercicio(id) {
    try {
      const ejercicio = await this.ejercicioRepository.findByIdSafe(id);
      if (!ejercicio) {
        throw new Error('Ejercicio no encontrado');
      }

      const objetivoId = ejercicio.idObjetivo;
      await this.ejercicioRepository.delete(id);

      // Recalcular progreso del objetivo
      if (objetivoId) {
        await this.objetivoRepository.calcularYActualizarProgreso(objetivoId);
      }

      return { message: 'Ejercicio eliminado exitosamente' };
    } catch (error) {
      console.error('Error in EjercicioService.deleteEjercicio:', error);
      throw error;
    }
  }

  /**
   * Marca un ejercicio como completado
   * @param {string} id - ID del ejercicio
   * @param {Object} completionData - Datos de completación adicionales
   * @returns {Promise<Object>} Ejercicio actualizado
   */
  async marcarCompletado(id, completionData = {}) {
    try {
      const fechaCompletado = completionData.fechaCompletado 
        ? new Date(completionData.fechaCompletado) 
        : new Date();

      const ejercicio = await this.ejercicioRepository.marcarCompletado(id, fechaCompletado);
      
      // Recalcular progreso del objetivo
      if (ejercicio.objetivo?.id) {
        await this.objetivoRepository.calcularYActualizarProgreso(ejercicio.objetivo.id);
      }

      return ejercicio;
    } catch (error) {
      console.error('Error in EjercicioService.marcarCompletado:', error);
      throw error;
    }
  }

  /**
   * Marca un ejercicio como no completado
   * @param {string} id - ID del ejercicio
   * @returns {Promise<Object>} Ejercicio actualizado
   */
  async marcarNoCompletado(id) {
    try {
      const ejercicio = await this.ejercicioRepository.marcarNoCompletado(id);
      
      // Recalcular progreso del objetivo
      if (ejercicio.objetivo?.id) {
        await this.objetivoRepository.calcularYActualizarProgreso(ejercicio.objetivo.id);
      }

      return ejercicio;
    } catch (error) {
      console.error('Error in EjercicioService.marcarNoCompletado:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de ejercicios para un paciente
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<Object>} Estadísticas de ejercicios
   */
  async getProgresoEjercicios(pacienteId) {
    try {
      return await this.ejercicioRepository.getEstadisticasPaciente(pacienteId);
    } catch (error) {
      console.error('Error in EjercicioService.getProgresoEjercicios:', error);
      throw new Error('Error al obtener progreso de ejercicios');
    }
  }

  /**
   * Asigna un ejercicio a un objetivo
   * @param {string} ejercicioId - ID del ejercicio
   * @param {string} objetivoId - ID del objetivo
   * @returns {Promise<Object>} Ejercicio actualizado
   */
  async asignarAObjetivo(ejercicioId, objetivoId) {
    try {
      // Verificar que el ejercicio existe
      const ejercicio = await this.ejercicioRepository.findByIdSafe(ejercicioId);
      if (!ejercicio) {
        throw new Error('Ejercicio no encontrado');
      }

      // Verificar que el objetivo existe
      const objetivo = await this.objetivoRepository.findByIdSafe(objetivoId);
      if (!objetivo) {
        throw new Error('Objetivo no encontrado');
      }

      // Actualizar el ejercicio para asignarlo al objetivo
      await this.ejercicioRepository.update(ejercicioId, { idObjetivo: objetivoId });

      // Recalcular progreso del objetivo
      await this.objetivoRepository.calcularYActualizarProgreso(objetivoId);

      return await this.getEjercicioById(ejercicioId);
    } catch (error) {
      console.error('Error in EjercicioService.asignarAObjetivo:', error);
      throw error;
    }
  }

  /**
   * Obtiene ejercicios próximos a vencer
   * @param {string} pacienteId - ID del paciente
   * @param {number} dias - Días a verificar
   * @returns {Promise<Array>} Ejercicios próximos a vencer
   */
  async getEjerciciosProximosAVencer(pacienteId, dias = 3) {
    try {
      return await this.ejercicioRepository.getProximosAVencer(pacienteId, dias);
    } catch (error) {
      console.error('Error in EjercicioService.getEjerciciosProximosAVencer:', error);
      throw new Error('Error al obtener ejercicios próximos a vencer');
    }
  }

  /**
   * Busca ejercicios por tipo para un paciente
   * @param {string} pacienteId - ID del paciente
   * @param {string} tipo - Tipo de ejercicio
   * @returns {Promise<Array>} Ejercicios del tipo especificado
   */
  async getEjerciciosByTipo(pacienteId, tipo) {
    try {
      return await this.ejercicioRepository.getByTipo(pacienteId, tipo);
    } catch (error) {
      console.error('Error in EjercicioService.getEjerciciosByTipo:', error);
      throw new Error('Error al obtener ejercicios por tipo');
    }
  }

  /**
   * Valida los datos de un ejercicio
   * @param {Object} ejercicioData - Datos a validar
   * @throws {Error} Si los datos no son válidos
   */
  validateEjercicioData(ejercicioData) {
    if (!ejercicioData.titulo || ejercicioData.titulo.trim().length < 3) {
      throw new Error('El título del ejercicio debe tener al menos 3 caracteres');
    }

    if (!ejercicioData.descripcion || ejercicioData.descripcion.trim().length < 5) {
      throw new Error('La descripción del ejercicio debe tener al menos 5 caracteres');
    }

    if (!ejercicioData.objetivoId) {
      throw new Error('El ID del objetivo es requerido');
    }

    const tiposValidos = ['reflexion', 'actividad', 'cuestionario', 'tarea'];
    if (ejercicioData.tipo && !tiposValidos.includes(ejercicioData.tipo)) {
      throw new Error(`El tipo de ejercicio debe ser uno de: ${tiposValidos.join(', ')}`);
    }

    const dificultadesValidas = ['facil', 'intermedio', 'dificil'];
    if (ejercicioData.dificultad && !dificultadesValidas.includes(ejercicioData.dificultad)) {
      throw new Error(`La dificultad debe ser una de: ${dificultadesValidas.join(', ')}`);
    }

    if (ejercicioData.fechaLimite) {
      const fechaLimite = new Date(ejercicioData.fechaLimite);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaLimite < hoy) {
        throw new Error('La fecha límite no puede ser anterior a hoy');
      }
    }
  }
}

export default EjercicioService;
