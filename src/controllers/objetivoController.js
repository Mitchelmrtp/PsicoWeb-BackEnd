/**
 * Controlador para gestión de objetivos
 * Maneja las rutas HTTP y validaciones de entrada
 */
import ObjetivoService from '../services/ObjetivoService.js';
import Joi from 'joi';

const objetivoService = new ObjetivoService();

// Esquemas de validación
const createObjetivoSchema = Joi.object({
  titulo: Joi.string().min(3).max(200).required(),
  descripcion: Joi.string().max(1000).optional(),
  fechaInicio: Joi.date().optional(),
  fechaLimite: Joi.date().optional(),
  estado: Joi.string().valid('activo', 'pausado', 'completado', 'cancelado').optional(),
  prioridad: Joi.string().valid('baja', 'media', 'alta').optional(),
  pacienteId: Joi.string().uuid().required()
});

const updateObjetivoSchema = Joi.object({
  titulo: Joi.string().min(3).max(200).optional(),
  descripcion: Joi.string().max(1000).optional(),
  fechaLimite: Joi.date().optional(),
  estado: Joi.string().valid('activo', 'pausado', 'completado', 'cancelado').optional(),
  prioridad: Joi.string().valid('baja', 'media', 'alta').optional()
});

/**
 * Obtiene todos los objetivos filtrados por usuario
 */
const findAll = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let objetivos;
    if (userRole === 'psicologo') {
      objetivos = await objetivoService.getObjetivosByPsicologo(userId);
    } else if (userRole === 'paciente') {
      objetivos = await objetivoService.getObjetivosByPaciente(userId);
    } else {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver objetivos'
      });
    }

    res.json({
      success: true,
      data: objetivos
    });
  } catch (error) {
    console.error('Error in ObjetivoController.findAll:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Obtiene un objetivo por ID
 */
const findById = async (req, res) => {
  try {
    const { id } = req.params;
    const objetivo = await objetivoService.getObjetivoById(id);

    res.json({
      success: true,
      data: objetivo
    });
  } catch (error) {
    console.error('Error in ObjetivoController.findById:', error);
    if (error.message === 'Objetivo no encontrado') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
};

/**
 * Crea un nuevo objetivo
 */
const create = async (req, res) => {
  try {
    // Validación de datos
    const { error, value } = createObjetivoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details
      });
    }

    // Agregar el ID del psicólogo que crea el objetivo
    const objetivoData = {
      ...value,
      psicologoId: req.user.id
    };

    const objetivo = await objetivoService.createObjetivo(objetivoData);

    res.status(201).json({
      success: true,
      message: 'Objetivo creado exitosamente',
      data: objetivo
    });
  } catch (error) {
    console.error('Error in ObjetivoController.create:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Actualiza un objetivo
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validación de datos
    const { error, value } = updateObjetivoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details
      });
    }

    const objetivo = await objetivoService.updateObjetivo(id, value);

    res.json({
      success: true,
      message: 'Objetivo actualizado exitosamente',
      data: objetivo
    });
  } catch (error) {
    console.error('Error in ObjetivoController.update:', error);
    if (error.message === 'Objetivo no encontrado') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
};

/**
 * Elimina un objetivo
 */
const deleteObjetivo = async (req, res) => {
  try {
    const { id } = req.params;
    await objetivoService.deleteObjetivo(id);

    res.json({
      success: true,
      message: 'Objetivo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error in ObjetivoController.delete:', error);
    if (error.message === 'Objetivo no encontrado') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
};

/**
 * Obtiene objetivos por paciente
 */
const findByPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Verificar permisos
    if (userRole === 'paciente' && pacienteId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver estos objetivos'
      });
    }

    const objetivos = await objetivoService.getObjetivosByPaciente(pacienteId);

    res.json({
      success: true,
      data: objetivos
    });
  } catch (error) {
    console.error('Error in ObjetivoController.findByPaciente:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Actualiza el progreso de un objetivo
 */
const updateProgreso = async (req, res) => {
  try {
    const { id } = req.params;
    const { progreso } = req.body;

    // Validación
    if (typeof progreso !== 'number' || progreso < 0 || progreso > 100) {
      return res.status(400).json({
        success: false,
        message: 'El progreso debe ser un número entre 0 y 100'
      });
    }

    const objetivo = await objetivoService.updateProgreso(id, progreso);

    res.json({
      success: true,
      message: 'Progreso actualizado exitosamente',
      data: objetivo
    });
  } catch (error) {
    console.error('Error in ObjetivoController.updateProgreso:', error);
    if (error.message === 'Objetivo no encontrado') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
};

export default {
  findAll,
  findById,
  create,
  update,
  delete: deleteObjetivo,
  findByPaciente,
  updateProgreso
};
