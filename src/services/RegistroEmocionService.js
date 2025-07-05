import { RegistroEmocionRepository } from '../repositories/RegistroEmocionRepository.js';
import { PacienteRepository } from '../repositories/PacienteRepository.js';
import { PsicologoRepository } from '../repositories/PsicologoRepository.js';
import { SesionRepository } from '../repositories/SesionRepository.js';
import { RegistroEmocionDTO, EstadisticasEmocionDTO } from '../dto/RegistroEmocionDTO.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { Paciente, Psicologo, Sesion } from '../models/index.js';

export class RegistroEmocionService {
  constructor() {
    this.registroEmocionRepository = new RegistroEmocionRepository();
    this.pacienteRepository = new PacienteRepository();
    this.psicologoRepository = new PsicologoRepository();
    this.sesionRepository = new SesionRepository();
  }

  /**
   * Obtiene todos los registros de emociones de un paciente
   */
  async getRegistrosByPaciente(pacienteId, options = {}) {
    try {
      console.log('🔍 DEBUG - getRegistrosByPaciente:');
      console.log('  - pacienteId:', pacienteId);
      console.log('  - options:', options);
      
      const registros = await this.registroEmocionRepository.findByPacienteId(pacienteId, options);
      console.log('  - registros encontrados:', registros?.length || 0);
      
      if (registros && registros.length > 0) {
        console.log('  - primer registro:', {
          id: registros[0].id,
          fechaRegistro: registros[0].fechaRegistro,
          emociones: registros[0].emociones,
          idPaciente: registros[0].idPaciente
        });
      }
      
      const registrosDTO = RegistroEmocionDTO.fromArray(registros);
      console.log('  - registros DTO creados:', registrosDTO?.length || 0);
      
      const registrosResponse = registrosDTO.map(dto => dto.toResponse());
      console.log('  - primer registro response:', registrosResponse[0]);
      
      return createSuccessResponse({
        registros: registrosResponse,
        total: registros.length
      });
    } catch (error) {
      console.error('Error in RegistroEmocionService.getRegistrosByPaciente:', error);
      return createErrorResponse('Error al obtener registros de emociones', 500);
    }
  }

  /**
   * Obtiene todos los registros de emociones creados por un psicólogo
   */
  async getRegistrosByPsicologo(psicologoId, options = {}) {
    try {
      const registros = await this.registroEmocionRepository.findByPsicologoId(psicologoId, options);
      const registrosDTO = RegistroEmocionDTO.fromArray(registros);
      
      return createSuccessResponse({
        registros: registrosDTO.map(dto => dto.toResponse()),
        total: registros.length
      });
    } catch (error) {
      console.error('Error in RegistroEmocionService.getRegistrosByPsicologo:', error);
      return createErrorResponse('Error al obtener registros de emociones', 500);
    }
  }

  /**
   * Crea un nuevo registro de emoción
   */
  async createRegistro(data, psicologoId) {
    try {
      // Validar que el paciente existe
      const paciente = await this.pacienteRepository.findById(data.idPaciente);
      if (!paciente) {
        return createErrorResponse('Paciente no encontrado', 404);
      }

      // Validar que el psicólogo existe
      const psicologo = await this.psicologoRepository.findById(psicologoId);
      if (!psicologo) {
        return createErrorResponse('Psicólogo no encontrado', 404);
      }

      // Validar sesión si se proporciona
      if (data.idSesion) {
        const sesion = await this.sesionRepository.findById(data.idSesion);
        if (!sesion) {
          return createErrorResponse('Sesión no encontrada', 404);
        }
      }

      // Validar estructura de emociones
      if (!this.validateEmociones(data.emociones)) {
        return createErrorResponse('Estructura de emociones inválida', 400);
      }

      const registroData = {
        ...data,
        idPsicologo: psicologoId,
        fechaRegistro: new Date()
      };

      const nuevoRegistro = await this.registroEmocionRepository.create(registroData);
      const registroCompleto = await this.registroEmocionRepository.findById(nuevoRegistro.id, {
        include: [
          { model: Paciente, as: 'paciente' },
          { model: Psicologo, as: 'psicologo' },
          { model: Sesion, as: 'sesion' }
        ]
      });

      const registroDTO = new RegistroEmocionDTO(registroCompleto);

      return createSuccessResponse({
        message: 'Registro de emociones creado exitosamente',
        registro: registroDTO.toResponse()
      }, 201);
    } catch (error) {
      console.error('Error in RegistroEmocionService.createRegistro:', error);
      return createErrorResponse('Error al crear registro de emociones', 500);
    }
  }

  /**
   * Actualiza un registro de emoción
   */
  async updateRegistro(id, data, psicologoId) {
    try {
      const registro = await this.registroEmocionRepository.findByIdSafe(id);
      if (!registro) {
        return createErrorResponse('Registro no encontrado', 404);
      }

      // Verificar que el psicólogo que intenta actualizar es el que creó el registro
      if (registro.idPsicologo !== psicologoId) {
        return createErrorResponse('No tienes permisos para actualizar este registro', 403);
      }

      // Validar estructura de emociones si se proporciona
      if (data.emociones && !this.validateEmociones(data.emociones)) {
        return createErrorResponse('Estructura de emociones inválida', 400);
      }

      const registroActualizado = await this.registroEmocionRepository.update(id, data);
      const registroCompleto = await this.registroEmocionRepository.findById(id, {
        include: [
          { model: Paciente, as: 'paciente' },
          { model: Psicologo, as: 'psicologo' },
          { model: Sesion, as: 'sesion' }
        ]
      });

      const registroDTO = new RegistroEmocionDTO(registroCompleto);

      return createSuccessResponse({
        message: 'Registro de emociones actualizado exitosamente',
        registro: registroDTO.toResponse()
      });
    } catch (error) {
      console.error('Error in RegistroEmocionService.updateRegistro:', error);
      return createErrorResponse('Error al actualizar registro de emociones', 500);
    }
  }

  /**
   * Elimina un registro de emoción
   */
  async deleteRegistro(id, psicologoId) {
    try {
      const registro = await this.registroEmocionRepository.findByIdSafe(id);
      if (!registro) {
        return createErrorResponse('Registro no encontrado', 404);
      }

      // Verificar que el psicólogo que intenta eliminar es el que creó el registro
      if (registro.idPsicologo !== psicologoId) {
        return createErrorResponse('No tienes permisos para eliminar este registro', 403);
      }

      await this.registroEmocionRepository.delete(id);

      return createSuccessResponse({
        message: 'Registro de emociones eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error in RegistroEmocionService.deleteRegistro:', error);
      return createErrorResponse('Error al eliminar registro de emociones', 500);
    }
  }

  /**
   * Obtiene estadísticas de emociones para un paciente
   */
  async getEstadisticasPaciente(pacienteId, startDate = null, endDate = null) {
    try {
      const paciente = await this.pacienteRepository.findById(pacienteId);
      if (!paciente) {
        return createErrorResponse('Paciente no encontrado', 404);
      }

      let registros;
      if (startDate && endDate) {
        registros = await this.registroEmocionRepository.findByDateRange(pacienteId, startDate, endDate);
      } else {
        registros = await this.registroEmocionRepository.findByPacienteId(pacienteId);
      }

      const estadisticas = await this.registroEmocionRepository.getEstadisticasPaciente(pacienteId);

      const estadisticasDTO = new EstadisticasEmocionDTO(estadisticas);

      return createSuccessResponse({
        estadisticas: estadisticasDTO.toResponse(),
        periodo: {
          inicio: startDate,
          fin: endDate,
          totalRegistros: registros.length
        }
      });
    } catch (error) {
      console.error('Error in RegistroEmocionService.getEstadisticasPaciente:', error);
      return createErrorResponse('Error al obtener estadísticas de emociones', 500);
    }
  }

  /**
   * Obtiene el último registro de emociones de un paciente
   */
  async getUltimoRegistro(pacienteId) {
    try {
      const registro = await this.registroEmocionRepository.findLatestByPacienteId(pacienteId);
      
      if (!registro) {
        return createSuccessResponse({
          message: 'No hay registros de emociones para este paciente',
          registro: null
        });
      }

      const registroDTO = new RegistroEmocionDTO(registro);

      return createSuccessResponse({
        registro: registroDTO.toResponse()
      });
    } catch (error) {
      console.error('Error in RegistroEmocionService.getUltimoRegistro:', error);
      return createErrorResponse('Error al obtener último registro de emociones', 500);
    }
  }

  /**
   * Valida la estructura de las emociones
   */
  validateEmociones(emociones) {
    if (!emociones || typeof emociones !== 'object') {
      return false;
    }

    const emocionesPermitidas = ['ansiedad', 'tristeza', 'alegria', 'ira', 'estres', 'calma', 'miedo', 'sorpresa'];
    
    for (const [emocion, intensidad] of Object.entries(emociones)) {
      // Verificar que la emoción esté permitida
      if (!emocionesPermitidas.includes(emocion)) {
        return false;
      }
      
      // Verificar que la intensidad esté en el rango 1-10
      if (typeof intensidad !== 'number' || intensidad < 1 || intensidad > 10) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtiene registros de emociones por rango de fechas
   */
  async getRegistrosByDateRange(pacienteId, startDate, endDate) {
    try {
      const registros = await this.registroEmocionRepository.findByDateRange(pacienteId, startDate, endDate);
      const registrosDTO = RegistroEmocionDTO.fromArray(registros);
      
      return createSuccessResponse({
        registros: registrosDTO.map(dto => dto.toResponse()),
        total: registros.length,
        periodo: { inicio: startDate, fin: endDate }
      });
    } catch (error) {
      console.error('Error in RegistroEmocionService.getRegistrosByDateRange:', error);
      return createErrorResponse('Error al obtener registros por rango de fechas', 500);
    }
  }
}
