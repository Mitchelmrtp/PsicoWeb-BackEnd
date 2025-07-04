/**
 * Repository para gestión de ejercicios
 * Implementa el patrón Repository para encapsular acceso a datos
 */
import { BaseRepository } from './BaseRepository.js';
import { Ejercicio, Objetivo, Paciente, Psicologo, User } from '../models/index.js';

class EjercicioRepository extends BaseRepository {
  constructor() {
    super(Ejercicio);
  }

  /**
   * Obtiene todos los ejercicios de un objetivo específico
   * @param {string} objetivoId - ID del objetivo
   * @returns {Promise<Array>} Lista de ejercicios del objetivo
   */
  async getByObjetivoId(objetivoId) {
    try {
      return await this.model.findAll({
        where: { idObjetivo: objetivoId },
        include: [
          {
            model: Objetivo,
            as: 'objetivo',
            attributes: ['id', 'titulo', 'descripcion']
          }
        ],
        order: [['fechaAsignacion', 'DESC']]
      });
    } catch (error) {
      console.error('Error in EjercicioRepository.getByObjetivoId:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los ejercicios asignados a un paciente
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<Array>} Lista de ejercicios del paciente
   */
  async getByPacienteId(pacienteId) {
    try {
      return await this.model.findAll({
        include: [
          {
            model: Objetivo,
            as: 'objetivo',
            where: { idPaciente: pacienteId },
            attributes: ['id', 'titulo', 'descripcion', 'progreso'],
            include: [
              {
                model: Paciente,
                as: 'paciente',
                attributes: ['id'],
                include: [
                  {
                    model: User,
                    attributes: ['name', 'first_name', 'last_name', 'email']
                  }
                ]
              }
            ]
          }
        ],
        order: [['fechaAsignacion', 'DESC']]
      });
    } catch (error) {
      console.error('Error in EjercicioRepository.getByPacienteId:', error);
      throw error;
    }
  }

  /**
   * Obtiene un ejercicio por ID con toda la información relacionada
   * @param {string} id - ID del ejercicio
   * @returns {Promise<Object|null>} Ejercicio con información completa
   */
  async getByIdWithRelations(id) {
    try {
      return await this.model.findByPk(id, {
        include: [
          {
            model: Objetivo,
            as: 'objetivo',
            attributes: ['id', 'titulo', 'descripcion', 'progreso'],
            include: [
              {
                model: Paciente,
                as: 'paciente',
                attributes: ['id'],
                include: [
                  {
                    model: User,
                    attributes: ['name', 'first_name', 'last_name', 'email']
                  }
                ]
              },
              {
                model: Psicologo,
                as: 'psicologo',
                attributes: ['id'],
                include: [
                  {
                    model: User,
                    attributes: ['name', 'first_name', 'last_name', 'email']
                  }
                ]
              }
            ]
          }
        ]
      });
    } catch (error) {
      console.error('Error in EjercicioRepository.getByIdWithRelations:', error);
      throw error;
    }
  }

  /**
   * Marca un ejercicio como completado
   * @param {string} id - ID del ejercicio
   * @param {Date} fechaCompletado - Fecha de completación
   * @returns {Promise<Object>} Ejercicio actualizado
   */
  async marcarCompletado(id, fechaCompletado = new Date()) {
    try {
      const ejercicio = await this.findByIdSafe(id);
      if (!ejercicio) {
        throw new Error('Ejercicio no encontrado');
      }

      ejercicio.estado = 'completado';
      ejercicio.fechaCompletado = fechaCompletado;
      await ejercicio.save();

      return await this.getByIdWithRelations(id);
    } catch (error) {
      console.error('Error in EjercicioRepository.marcarCompletado:', error);
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
      const ejercicio = await this.findByIdSafe(id);
      if (!ejercicio) {
        throw new Error('Ejercicio no encontrado');
      }

      ejercicio.estado = 'pendiente';
      ejercicio.fechaCompletado = null;
      await ejercicio.save();

      return await this.getByIdWithRelations(id);
    } catch (error) {
      console.error('Error in EjercicioRepository.marcarNoCompletado:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de ejercicios para un paciente
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<Object>} Estadísticas de ejercicios
   */
  async getEstadisticasPaciente(pacienteId) {
    try {
      const ejercicios = await this.getByPacienteId(pacienteId);
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const estadisticas = {
        total: ejercicios.length,
        completados: ejercicios.filter(ej => ej.estado === 'completado').length,
        pendientes: ejercicios.filter(ej => ej.estado === 'pendiente').length,
        vencidos: ejercicios.filter(ej => 
          ej.estado !== 'completado' && 
          ej.fechaLimite && 
          new Date(ej.fechaLimite) < hoy
        ).length,
        porVencer: ejercicios.filter(ej => {
          if (!ej.fechaLimite || ej.estado === 'completado') return false;
          const limite = new Date(ej.fechaLimite);
          const unDia = 24 * 60 * 60 * 1000;
          return limite.getTime() - hoy.getTime() <= unDia && limite.getTime() >= hoy.getTime();
        }).length,
        porcentajeCompletado: ejercicios.length > 0 
          ? Math.round((ejercicios.filter(ej => ej.estado === 'completado').length / ejercicios.length) * 100)
          : 0
      };

      return estadisticas;
    } catch (error) {
      console.error('Error in EjercicioRepository.getEstadisticasPaciente:', error);
      throw error;
    }
  }

  /**
   * Obtiene ejercicios próximos a vencer para un paciente
   * @param {string} pacienteId - ID del paciente
   * @param {number} dias - Número de días a verificar (por defecto 3)
   * @returns {Promise<Array>} Lista de ejercicios próximos a vencer
   */
  async getProximosAVencer(pacienteId, dias = 3) {
    try {
      const ejercicios = await this.getByPacienteId(pacienteId);
      const hoy = new Date();
      const limite = new Date();
      limite.setDate(hoy.getDate() + dias);

      return ejercicios.filter(ejercicio => {
        if (ejercicio.completado || !ejercicio.fechaLimite) return false;
        const fechaLimite = new Date(ejercicio.fechaLimite);
        return fechaLimite >= hoy && fechaLimite <= limite;
      });
    } catch (error) {
      console.error('Error in EjercicioRepository.getProximosAVencer:', error);
      throw error;
    }
  }

  /**
   * Busca ejercicios por tipo para un paciente
   * @param {string} pacienteId - ID del paciente
   * @param {string} tipo - Tipo de ejercicio
   * @returns {Promise<Array>} Lista de ejercicios del tipo especificado
   */
  async getByTipo(pacienteId, tipo) {
    try {
      return await this.model.findAll({
        where: { 
          pacienteId,
          tipo 
        },
        include: [
          {
            model: Objetivo,
            as: 'objetivo',
            attributes: ['id', 'titulo', 'descripcion']
          }
        ],
        order: [['fechaAsignacion', 'DESC']]
      });
    } catch (error) {
      console.error('Error in EjercicioRepository.getByTipo:', error);
      throw error;
    }
  }
}

export default EjercicioRepository;
