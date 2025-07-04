/**
 * Repository para gestión de objetivos
 * Implementa el patrón Repository para encapsular acceso a datos
 */
import { BaseRepository } from './BaseRepository.js';
import { Objetivo, Paciente, Psicologo, Ejercicio, User } from '../models/index.js';
import db from '../config/database.js';

class ObjetivoRepository extends BaseRepository {
  constructor() {
    super(Objetivo);
  }

  /**
   * Obtiene todos los objetivos de un paciente específico
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<Array>} Lista de objetivos del paciente
   */
  async getByPacienteId(pacienteId) {
    try {
      const objetivos = await this.model.findAll({
        where: { idPaciente: pacienteId },
        include: [
          {
            model: Paciente,
            as: 'paciente',
            include: [
              {
                model: User,
                attributes: ['name', 'email']
              }
            ]
          },
          {
            model: Psicologo,
            as: 'psicologo',
            include: [
              {
                model: User,
                attributes: ['name', 'email']
              }
            ]
          },
          {
            model: Ejercicio,
            as: 'ejercicios',
            attributes: ['id', 'titulo', 'descripcion', 'estado', 'fechaCompletado']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      return this._transformObjetivosWithCompletadoField(objetivos);
    } catch (error) {
      console.error('Error in ObjetivoRepository.getByPacienteId:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los objetivos creados por un psicólogo
   * @param {string} psicologoId - ID del psicólogo
   * @returns {Promise<Array>} Lista de objetivos del psicólogo
   */
  async getByPsicologoId(psicologoId) {
    try {
      const objetivos = await this.model.findAll({
        where: { idPsicologo: psicologoId },
        include: [
          {
            model: Paciente,
            as: 'paciente',
            include: [
              {
                model: User,
                attributes: ['name', 'email']
              }
            ]
          },
          {
            model: Psicologo,
            as: 'psicologo',
            include: [
              {
                model: User,
                attributes: ['name', 'email']
              }
            ]
          },
          {
            model: Ejercicio,
            as: 'ejercicios',
            attributes: ['id', 'titulo', 'descripcion', 'estado', 'fechaCompletado']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      return this._transformObjetivosWithCompletadoField(objetivos);
    } catch (error) {
      console.error('Error in ObjetivoRepository.getByPsicologoId:', error);
      throw error;
    }
  }

  /**
   * Obtiene un objetivo por ID con toda la información relacionada
   * @param {string} id - ID del objetivo
   * @returns {Promise<Object|null>} Objetivo con información completa
   */
  async getByIdWithRelations(id) {
    try {
      const objetivo = await this.model.findByPk(id, {
        include: [
          {
            model: Paciente,
            as: 'paciente',
            include: [
              {
                model: User,
                attributes: ['name', 'email']
              }
            ]
          },
          {
            model: Psicologo,
            as: 'psicologo',
            include: [
              {
                model: User,
                attributes: ['name', 'email']
              }
            ]
          },
          {
            model: Ejercicio,
            as: 'ejercicios',
            attributes: ['id', 'titulo', 'descripcion', 'instrucciones', 'estado', 'fechaAsignacion', 'fechaLimite', 'fechaCompletado']
          }
        ]
      });
      
      if (!objetivo) return null;
      
      return this._transformObjetivosWithCompletadoField(objetivo);
    } catch (error) {
      console.error('Error in ObjetivoRepository.getByIdWithRelations:', error);
      throw error;
    }
  }

  /**
   * Actualiza el progreso de un objetivo
   * @param {string} id - ID del objetivo
   * @param {number} progreso - Nuevo progreso (0-100)
   * @returns {Promise<Object>} Objetivo actualizado
   */
  async updateProgreso(id, progreso) {
    try {
      const objetivo = await this.findByIdSafe(id);
      if (!objetivo) {
        throw new Error('Objetivo no encontrado');
      }

      objetivo.progreso = Math.min(Math.max(progreso, 0), 100);
      await objetivo.save();

      return await this.getByIdWithRelations(id);
    } catch (error) {
      console.error('Error in ObjetivoRepository.updateProgreso:', error);
      throw error;
    }
  }

  /**
   * Calcula y actualiza automáticamente el progreso basado en ejercicios completados
   * @param {string} objetivoId - ID del objetivo
   * @returns {Promise<Object>} Objetivo con progreso actualizado
   */
  async calcularYActualizarProgreso(objetivoId) {
    try {
      const objetivo = await this.getByIdWithRelations(objetivoId);
      if (!objetivo) {
        throw new Error('Objetivo no encontrado');
      }

      const ejercicios = objetivo.ejercicios || [];
      if (ejercicios.length === 0) {
        return objetivo;
      }

      const ejerciciosCompletados = ejercicios.filter(e => e.estado === 'completado').length;
      const progresoCalculado = Math.round((ejerciciosCompletados / ejercicios.length) * 100);

      return await this.updateProgreso(objetivoId, progresoCalculado);
    } catch (error) {
      console.error('Error in ObjetivoRepository.calcularYActualizarProgreso:', error);
      throw error;
    }
  }

  /**
   * Transforma los objetivos para añadir el campo completado a los ejercicios
   * para compatibilidad con frontend
   * @param {Array|Object} objetivos - Objetivos a transformar
   * @returns {Array|Object} Objetivos transformados
   */
  _transformObjetivosWithCompletadoField(objetivos) {
    const transform = (objetivo) => {
      if (objetivo.ejercicios) {
        const ejerciciosWithCompletado = objetivo.ejercicios.map(ejercicio => ({
          ...ejercicio.toJSON ? ejercicio.toJSON() : ejercicio,
          completado: ejercicio.estado === 'completado'
        }));
        return {
          ...objetivo.toJSON ? objetivo.toJSON() : objetivo,
          ejercicios: ejerciciosWithCompletado
        };
      }
      return objetivo.toJSON ? objetivo.toJSON() : objetivo;
    };

    if (Array.isArray(objetivos)) {
      return objetivos.map(transform);
    }
    return transform(objetivos);
  }

  /**
   * Obtiene estadísticas de objetivos para un paciente
   * @param {string} pacienteId - ID del paciente
   * @returns {Promise<Object>} Estadísticas de objetivos
   */
  async getEstadisticasPaciente(pacienteId) {
    try {
      const objetivos = await this.getByPacienteId(pacienteId);
      
      const estadisticas = {
        total: objetivos.length,
        completados: objetivos.filter(obj => (obj.progreso || 0) >= 100).length,
        enProgreso: objetivos.filter(obj => (obj.progreso || 0) > 0 && (obj.progreso || 0) < 100).length,
        sinIniciar: objetivos.filter(obj => (obj.progreso || 0) === 0).length,
        progresoPromedio: objetivos.length > 0 
          ? Math.round(objetivos.reduce((acc, obj) => acc + (obj.progreso || 0), 0) / objetivos.length)
          : 0
      };

      return estadisticas;
    } catch (error) {
      console.error('Error in ObjetivoRepository.getEstadisticasPaciente:', error);
      throw error;
    }
  }
}

export default ObjetivoRepository;
