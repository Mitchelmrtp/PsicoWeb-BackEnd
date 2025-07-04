/**
 * Servicio para gestión de objetivos
 * Implementa lógica de negocio y reglas específicas del dominio
 */
import ObjetivoRepository from '../repositories/ObjetivoRepository.js';
import EjercicioRepository from '../repositories/EjercicioRepository.js';
import { CreateObjetivoDTO, UpdateObjetivoDTO, ObjetivoResponseDTO } from '../dto/ObjetivoDTO.js';

class ObjetivoService {
  constructor() {
    this.objetivoRepository = new ObjetivoRepository();
    this.ejercicioRepository = new EjercicioRepository();
  }

  /**
   * Obtiene todos los objetivos de un paciente
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<Array>} Lista de objetivos del paciente
   */
  async getObjetivosByPaciente(pacienteId) {
    try {
      const objetivos = await this.objetivoRepository.getByPacienteId(pacienteId);
      return objetivos.map(objetivo => ObjetivoResponseDTO.fromModel(objetivo));
    } catch (error) {
      console.error('Error in ObjetivoService.getObjetivosByPaciente:', error);
      throw new Error('Error al obtener objetivos del paciente');
    }
  }

  /**
   * Obtiene todos los objetivos creados por un psicólogo
   * @param {string} psicologoId - ID del psicólogo
   * @returns {Promise<Array>} Lista de objetivos del psicólogo
   */
  async getObjetivosByPsicologo(psicologoId) {
    try {
      const objetivos = await this.objetivoRepository.getByPsicologoId(psicologoId);
      return objetivos.map(objetivo => ObjetivoResponseDTO.fromModel(objetivo));
    } catch (error) {
      console.error('Error in ObjetivoService.getObjetivosByPsicologo:', error);
      throw new Error('Error al obtener objetivos del psicólogo');
    }
  }

  /**
   * Obtiene un objetivo por ID
   * @param {string} id - ID del objetivo
   * @returns {Promise<Object>} Objetivo encontrado
   */
  async getObjetivoById(id) {
    try {
      const objetivo = await this.objetivoRepository.getByIdWithRelations(id);
      if (!objetivo) {
        throw new Error('Objetivo no encontrado');
      }
      return ObjetivoResponseDTO.fromModel(objetivo);
    } catch (error) {
      console.error('Error in ObjetivoService.getObjetivoById:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo objetivo
   * @param {Object} objetivoData - Datos del objetivo
   * @returns {Promise<Object>} Objetivo creado
   */
  async createObjetivo(objetivoData) {
    try {
      // Validar datos requeridos
      this.validateObjetivoData(objetivoData);

      // Preparar datos para la creación
      const dataToCreate = {
        titulo: objetivoData.titulo,
        descripcion: objetivoData.descripcion,
        idPaciente: objetivoData.pacienteId,
        idPsicologo: objetivoData.psicologoId,
        fechaCreacion: new Date(),
        fechaLimite: objetivoData.fechaLimite || null,
        prioridad: objetivoData.prioridad || 'media',
        progreso: 0
      };

      const objetivo = await this.objetivoRepository.create(dataToCreate);
      return await this.getObjetivoById(objetivo.id);
    } catch (error) {
      console.error('Error in ObjetivoService.createObjetivo:', error);
      throw error;
    }
  }

  /**
   * Actualiza un objetivo existente
   * @param {string} id - ID del objetivo
   * @param {Object} objetivoData - Datos actualizados
   * @returns {Promise<Object>} Objetivo actualizado
   */
  async updateObjetivo(id, objetivoData) {
    try {
      const objetivo = await this.objetivoRepository.findByIdSafe(id);
      if (!objetivo) {
        throw new Error('Objetivo no encontrado');
      }

      // Preparar datos para actualización
      const dataToUpdate = {};
      if (objetivoData.titulo !== undefined) dataToUpdate.titulo = objetivoData.titulo;
      if (objetivoData.descripcion !== undefined) dataToUpdate.descripcion = objetivoData.descripcion;
      if (objetivoData.fechaLimite !== undefined) dataToUpdate.fechaLimite = objetivoData.fechaLimite;
      if (objetivoData.prioridad !== undefined) dataToUpdate.prioridad = objetivoData.prioridad;

      await this.objetivoRepository.update(id, dataToUpdate);
      return await this.getObjetivoById(id);
    } catch (error) {
      console.error('Error in ObjetivoService.updateObjetivo:', error);
      throw error;
    }
  }

  /**
   * Elimina un objetivo
   * @param {string} id - ID del objetivo
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteObjetivo(id) {
    try {
      const objetivo = await this.objetivoRepository.findByIdSafe(id);
      if (!objetivo) {
        throw new Error('Objetivo no encontrado');
      }

      // Eliminar ejercicios relacionados primero
      const ejercicios = await this.ejercicioRepository.getByObjetivoId(id);
      for (const ejercicio of ejercicios) {
        await this.ejercicioRepository.delete(ejercicio.id);
      }

      await this.objetivoRepository.delete(id);
      return { message: 'Objetivo eliminado exitosamente' };
    } catch (error) {
      console.error('Error in ObjetivoService.deleteObjetivo:', error);
      throw error;
    }
  }

  /**
   * Actualiza el progreso de un objetivo
   * @param {string} id - ID del objetivo
   * @param {number} progreso - Nuevo progreso (0-100)
   * @returns {Promise<Object>} Objetivo con progreso actualizado
   */
  async updateProgreso(id, progreso) {
    try {
      if (progreso < 0 || progreso > 100) {
        throw new Error('El progreso debe estar entre 0 y 100');
      }

      const objetivoActualizado = await this.objetivoRepository.updateProgreso(id, progreso);
      return ObjetivoResponseDTO.fromModel(objetivoActualizado);
    } catch (error) {
      console.error('Error in ObjetivoService.updateProgreso:', error);
      throw error;
    }
  }

  /**
   * Calcula automáticamente el progreso basado en ejercicios completados
   * @param {string} objetivoId - ID del objetivo
   * @returns {Promise<Object>} Objetivo con progreso actualizado
   */
  async calcularProgreso(objetivoId) {
    try {
      const objetivoActualizado = await this.objetivoRepository.calcularYActualizarProgreso(objetivoId);
      return ObjetivoResponseDTO.fromModel(objetivoActualizado);
    } catch (error) {
      console.error('Error in ObjetivoService.calcularProgreso:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de objetivos para un paciente
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<Object>} Estadísticas de objetivos
   */
  async getEstadisticasPaciente(pacienteId) {
    try {
      return await this.objetivoRepository.getEstadisticasPaciente(pacienteId);
    } catch (error) {
      console.error('Error in ObjetivoService.getEstadisticasPaciente:', error);
      throw new Error('Error al obtener estadísticas de objetivos');
    }
  }

  /**
   * Valida los datos de un objetivo
   * @param {Object} objetivoData - Datos a validar
   * @throws {Error} Si los datos no son válidos
   */
  validateObjetivoData(objetivoData) {
    if (!objetivoData.titulo || objetivoData.titulo.trim().length < 3) {
      throw new Error('El título del objetivo debe tener al menos 3 caracteres');
    }

    if (!objetivoData.descripcion || objetivoData.descripcion.trim().length < 10) {
      throw new Error('La descripción del objetivo debe tener al menos 10 caracteres');
    }

    if (!objetivoData.pacienteId) {
      throw new Error('El ID del paciente es requerido');
    }

    if (!objetivoData.psicologoId) {
      throw new Error('El ID del psicólogo es requerido');
    }

    if (objetivoData.fechaLimite) {
      const fechaLimite = new Date(objetivoData.fechaLimite);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaLimite < hoy) {
        throw new Error('La fecha límite no puede ser anterior a hoy');
      }
    }

    const prioridadesValidas = ['baja', 'media', 'alta'];
    if (objetivoData.prioridad && !prioridadesValidas.includes(objetivoData.prioridad)) {
      throw new Error('La prioridad debe ser: baja, media o alta');
    }
  }
}

export default ObjetivoService;
