import { BaseRepository } from './BaseRepository.js';
import { RegistroEmocion, Paciente, Psicologo, Sesion, User } from '../models/index.js';
import { Op } from 'sequelize';

export class RegistroEmocionRepository extends BaseRepository {
  constructor() {
    super(RegistroEmocion);
  }

  /**
   * Obtiene todos los registros de emociones de un paciente específico
   */
  async findByPacienteId(pacienteId, options = {}) {
    try {
      console.log('🔍 DEBUG - findByPacienteId:');
      console.log('  - pacienteId:', pacienteId);
      console.log('  - options:', options);
      
      const result = await this.model.findAll({
        where: { idPaciente: pacienteId },
        include: [
          {
            model: Psicologo,
            as: 'psicologo',
            include: [{
              model: User,
              attributes: ['name', 'first_name', 'last_name']
            }]
          },
          {
            model: Sesion,
            as: 'sesion',
            required: false
          }
        ],
        order: [['fechaRegistro', 'DESC']],
        ...options
      });
      
      console.log('  - registros encontrados en DB:', result?.length || 0);
      if (result && result.length > 0) {
        console.log('  - primer registro de DB:', {
          id: result[0].id,
          idPaciente: result[0].idPaciente,
          fechaRegistro: result[0].fechaRegistro,
          emociones: result[0].emociones
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error in findByPacienteId:', error);
      throw new Error(`Error finding emotion records by patient ID: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los registros de emociones creados por un psicólogo
   */
  async findByPsicologoId(psicologoId, options = {}) {
    try {
      return await this.model.findAll({
        where: { idPsicologo: psicologoId },
        include: [
          {
            model: Paciente,
            as: 'paciente',
            include: [{
              model: User,
              attributes: ['name', 'first_name', 'last_name']
            }]
          },
          {
            model: Sesion,
            as: 'sesion',
            required: false
          }
        ],
        order: [['fechaRegistro', 'DESC']],
        ...options
      });
    } catch (error) {
      throw new Error(`Error finding emotion records by psychologist ID: ${error.message}`);
    }
  }

  /**
   * Obtiene registros de emociones por rango de fechas
   */
  async findByDateRange(pacienteId, startDate, endDate, options = {}) {
    try {
      return await this.model.findAll({
        where: {
          idPaciente: pacienteId,
          fechaRegistro: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: Psicologo,
            as: 'psicologo',
            include: [{
              model: User,
              attributes: ['name', 'first_name', 'last_name']
            }]
          },
          {
            model: Sesion,
            as: 'sesion',
            required: false
          }
        ],
        order: [['fechaRegistro', 'ASC']],
        ...options
      });
    } catch (error) {
      throw new Error(`Error finding emotion records by date range: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas de emociones para un paciente
   */
  async getEstadisticasPaciente(pacienteId, options = {}) {
    try {
      const registros = await this.findByPacienteId(pacienteId, options);
      
      if (registros.length === 0) {
        return {
          totalRegistros: 0,
          promedioIntensidad: 0,
          emocionMasFrecuente: null,
          estadoGeneralPromedio: null,
          registrosPorMes: {},
          evolucionEmocional: []
        };
      }

      // Calcular estadísticas
      const totalRegistros = registros.length;
      const promedioIntensidad = registros.reduce((sum, reg) => sum + parseFloat(reg.intensidadPromedio), 0) / totalRegistros;
      
      // Encontrar emoción más frecuente
      const todasEmociones = {};
      registros.forEach(registro => {
        Object.entries(registro.emociones).forEach(([emocion, intensidad]) => {
          if (!todasEmociones[emocion]) todasEmociones[emocion] = [];
          todasEmociones[emocion].push(intensidad);
        });
      });

      const emocionMasFrecuente = Object.keys(todasEmociones).reduce((a, b) => 
        todasEmociones[a].length > todasEmociones[b].length ? a : b
      );

      // Estado general más común
      const estadosGenerales = registros.map(r => r.estadoGeneral);
      const estadoGeneralPromedio = estadosGenerales.sort((a, b) =>
        estadosGenerales.filter(v => v === a).length - estadosGenerales.filter(v => v === b).length
      ).pop();

      // Registros por mes
      const registrosPorMes = {};
      registros.forEach(registro => {
        const mes = registro.fechaRegistro.toISOString().substring(0, 7); // YYYY-MM
        registrosPorMes[mes] = (registrosPorMes[mes] || 0) + 1;
      });

      return {
        totalRegistros,
        promedioIntensidad: Math.round(promedioIntensidad * 100) / 100,
        emocionMasFrecuente,
        estadoGeneralPromedio,
        registrosPorMes,
        evolucionEmocional: registros.map(r => ({
          fecha: r.fechaRegistro,
          intensidadPromedio: r.intensidadPromedio,
          estadoGeneral: r.estadoGeneral,
          emociones: r.emociones
        }))
      };
    } catch (error) {
      throw new Error(`Error getting patient emotion statistics: ${error.message}`);
    }
  }

  /**
   * Crea un nuevo registro de emoción calculando automáticamente la intensidad promedio
   */
  async create(data) {
    try {
      // Calcular intensidad promedio de las emociones
      const emociones = data.emociones;
      const intensidades = Object.values(emociones);
      const intensidadPromedio = intensidades.reduce((sum, val) => sum + val, 0) / intensidades.length;

      const registroData = {
        ...data,
        intensidadPromedio: Math.round(intensidadPromedio * 100) / 100,
        // Convert empty string to null for UUID fields
        idSesion: data.idSesion || null
      };

      return await super.create(registroData);
    } catch (error) {
      throw new Error(`Error creating emotion record: ${error.message}`);
    }
  }

  /**
   * Obtiene el último registro de emociones de un paciente
   */
  async findLatestByPacienteId(pacienteId) {
    try {
      return await this.model.findOne({
        where: { idPaciente: pacienteId },
        include: [
          {
            model: Psicologo,
            as: 'psicologo',
            include: [{
              model: User,
              attributes: ['name', 'first_name', 'last_name']
            }]
          }
        ],
        order: [['fechaRegistro', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Error finding latest emotion record: ${error.message}`);
    }
  }
}
