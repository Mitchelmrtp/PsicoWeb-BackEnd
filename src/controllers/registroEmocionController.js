import { RegistroEmocionService } from '../services/RegistroEmocionService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import Joi from 'joi';

const registroEmocionService = new RegistroEmocionService();

// Esquemas de validación
const createRegistroSchema = Joi.object({
  idPaciente: Joi.string().uuid().required(),
  idPsicologo: Joi.string().uuid().required(),
  idSesion: Joi.string().uuid().optional().allow(null),
  emociones: Joi.object({
    ansiedad: Joi.number().min(1).max(10).optional(),
    tristeza: Joi.number().min(1).max(10).optional(),
    alegria: Joi.number().min(1).max(10).optional(),
    ira: Joi.number().min(1).max(10).optional(),
    estres: Joi.number().min(1).max(10).optional(),
    calma: Joi.number().min(1).max(10).optional(),
    miedo: Joi.number().min(1).max(10).optional(),
    sorpresa: Joi.number().min(1).max(10).optional()
  }).min(1).required(),
  comentarios: Joi.string().allow('').optional(),
  estadoGeneral: Joi.string().valid('muy_malo', 'malo', 'regular', 'bueno', 'muy_bueno').required()
});

const updateRegistroSchema = Joi.object({
  emociones: Joi.object({
    ansiedad: Joi.number().min(1).max(10).optional(),
    tristeza: Joi.number().min(1).max(10).optional(),
    alegria: Joi.number().min(1).max(10).optional(),
    ira: Joi.number().min(1).max(10).optional(),
    estres: Joi.number().min(1).max(10).optional(),
    calma: Joi.number().min(1).max(10).optional(),
    miedo: Joi.number().min(1).max(10).optional(),
    sorpresa: Joi.number().min(1).max(10).optional()
  }).min(1).optional(),
  comentarios: Joi.string().allow('').optional(),
  estadoGeneral: Joi.string().valid('muy_malo', 'malo', 'regular', 'bueno', 'muy_bueno').optional()
});

/**
 * Obtiene todos los registros de emociones filtrados por usuario
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getRegistros = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { pacienteId, startDate, endDate } = req.query;

    console.log('🔍 DEBUG - getRegistros:');
    console.log('  - userId:', userId);
    console.log('  - userRole:', userRole);
    console.log('  - pacienteId:', pacienteId);
    console.log('  - startDate:', startDate);
    console.log('  - endDate:', endDate);
    console.log('  - req.query:', req.query);

    let result;

    if (userRole === 'paciente') {
      // Si es paciente, solo puede ver sus propios registros
      if (startDate && endDate) {
        result = await registroEmocionService.getRegistrosByDateRange(userId, startDate, endDate);
      } else {
        result = await registroEmocionService.getRegistrosByPaciente(userId);
      }
    } else if (userRole === 'psicologo') {
      // Si es psicólogo, puede ver registros de sus pacientes o todos sus registros creados
      if (pacienteId) {
        console.log('🎯 Buscando registros para paciente:', pacienteId);
        if (startDate && endDate) {
          result = await registroEmocionService.getRegistrosByDateRange(pacienteId, startDate, endDate);
        } else {
          result = await registroEmocionService.getRegistrosByPaciente(pacienteId);
        }
      } else {
        result = await registroEmocionService.getRegistrosByPsicologo(userId);
      }
    } else {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
    }

    console.log('📊 Resultado del servicio:', result);
    handleServiceResponse(res, result);
  } catch (error) {
    console.error('Error in getRegistros:', error);
    handleServiceResponse(res, { success: false, message: 'Error interno del servidor', statusCode: 500 });
  }
};

/**
 * Crea un nuevo registro de emoción
 * @param {Object} req - Request object  
 * @param {Object} res - Response object
 */
export const createRegistro = async (req, res) => {
  try {
    const { error } = createRegistroSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Error de validación', details: error.details });
    }

    const psicologoId = req.user.userId;
    const userRole = req.user.role;

    // Solo psicólogos pueden crear registros de emociones
    if (userRole !== 'psicologo') {
      return res.status(403).json({ message: 'Solo los psicólogos pueden crear registros de emociones' });
    }

    const result = await registroEmocionService.createRegistro(req.body, psicologoId);
    handleServiceResponse(res, result);
  } catch (error) {
    console.error('Error in createRegistro:', error);
    handleServiceResponse(res, { success: false, message: 'Error interno del servidor', statusCode: 500 });
  }
};

/**
 * Actualiza un registro de emoción
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const updateRegistro = async (req, res) => {
  try {
    const { error } = updateRegistroSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Error de validación', details: error.details });
    }

    const { id } = req.params;
    const psicologoId = req.user.userId;
    const userRole = req.user.role;

    // Solo psicólogos pueden actualizar registros de emociones
    if (userRole !== 'psicologo') {
      return res.status(403).json({ message: 'Solo los psicólogos pueden actualizar registros de emociones' });
    }

    const result = await registroEmocionService.updateRegistro(parseInt(id), req.body, psicologoId);
    handleServiceResponse(res, result);
  } catch (error) {
    console.error('Error in updateRegistro:', error);
    handleServiceResponse(res, { success: false, message: 'Error interno del servidor', statusCode: 500 });
  }
};

/**
 * Elimina un registro de emoción
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const deleteRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const psicologoId = req.user.userId;
    const userRole = req.user.role;

    // Solo psicólogos pueden eliminar registros de emociones
    if (userRole !== 'psicologo') {
      return res.status(403).json({ message: 'Solo los psicólogos pueden eliminar registros de emociones' });
    }

    const result = await registroEmocionService.deleteRegistro(parseInt(id), psicologoId);
    handleServiceResponse(res, result);
  } catch (error) {
    console.error('Error in deleteRegistro:', error);
    handleServiceResponse(res, { success: false, message: 'Error interno del servidor', statusCode: 500 });
  }
};

/**
 * Obtiene estadísticas de emociones para un paciente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getEstadisticas = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { pacienteId, startDate, endDate } = req.query;

    let targetPacienteId;

    if (userRole === 'paciente') {
      // Si es paciente, solo puede ver sus propias estadísticas
      targetPacienteId = userId;
    } else if (userRole === 'psicologo') {
      // Si es psicólogo, puede ver estadísticas de sus pacientes
      if (!pacienteId) {
        return res.status(400).json({ message: 'ID del paciente es requerido para psicólogos' });
      }
      targetPacienteId = pacienteId;
    } else {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
    }

    const result = await registroEmocionService.getEstadisticasPaciente(
      targetPacienteId, 
      startDate ? new Date(startDate) : null, 
      endDate ? new Date(endDate) : null
    );
    
    handleServiceResponse(res, result);
  } catch (error) {
    console.error('Error in getEstadisticas:', error);
    handleServiceResponse(res, { success: false, message: 'Error interno del servidor', statusCode: 500 });
  }
};

/**
 * Obtiene el último registro de emociones de un paciente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getUltimoRegistro = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { pacienteId } = req.query;

    let targetPacienteId;

    if (userRole === 'paciente') {
      targetPacienteId = userId;
    } else if (userRole === 'psicologo') {
      if (!pacienteId) {
        return res.status(400).json({ message: 'ID del paciente es requerido para psicólogos' });
      }
      targetPacienteId = pacienteId;
    } else {
      return res.status(403).json({ message: 'No tienes permisos para acceder a este recurso' });
    }

    const result = await registroEmocionService.getUltimoRegistro(targetPacienteId);
    handleServiceResponse(res, result);
  } catch (error) {
    console.error('Error in getUltimoRegistro:', error);
    handleServiceResponse(res, { success: false, message: 'Error interno del servidor', statusCode: 500 });
  }
};

/**
 * Obtiene un registro específico por ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getRegistroById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Implementar lógica para obtener registro específico
    // Por ahora redirigimos al servicio general
    res.status(501).json({ message: 'Funcionalidad no implementada aún' });
  } catch (error) {
    console.error('Error in getRegistroById:', error);
    handleServiceResponse(res, { success: false, message: 'Error interno del servidor', statusCode: 500 });
  }
};
