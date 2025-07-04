/**
 * Controlador para gestión de ejercicios
 * Maneja las rutas HTTP y validaciones de entrada
 */
import EjercicioService from '../services/EjercicioService.js';
import Joi from 'joi';

const ejercicioService = new EjercicioService();

// Esquemas de validación
const createEjercicioSchema = Joi.object({
  titulo: Joi.string().min(3).max(200).required(),
  descripcion: Joi.string().max(1000).required(),
  instrucciones: Joi.string().max(2000).optional(),
  tipo: Joi.string().valid('reflexion', 'actividad', 'cuestionario', 'tarea').optional(),
  duracionEstimada: Joi.number().min(1).optional(),
  dificultad: Joi.string().valid('facil', 'intermedio', 'dificil').optional(),
  objetivoId: Joi.string().uuid().required(),
  pacienteId: Joi.string().uuid().optional(),
  psicologoId: Joi.string().uuid().optional(),
  fechaLimite: Joi.date().optional()
});

const updateEjercicioSchema = Joi.object({
  titulo: Joi.string().min(3).max(200).optional(),
  descripcion: Joi.string().max(1000).optional(),
  instrucciones: Joi.string().max(2000).optional(),
  tipo: Joi.string().valid('reflexion', 'actividad', 'cuestionario', 'tarea').optional(),
  duracionEstimada: Joi.number().min(1).optional(),
  dificultad: Joi.string().valid('facil', 'intermedio', 'dificil').optional(),
  fechaLimite: Joi.date().optional()
});

/**
 * Obtiene todos los ejercicios filtrados por usuario
 */
const findAll = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let ejercicios;
    if (userRole === 'psicologo') {
      ejercicios = await ejercicioService.getEjerciciosByPsicologo(userId);
    } else if (userRole === 'paciente') {
      ejercicios = await ejercicioService.getEjerciciosByPaciente(userId);
    } else {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver ejercicios'
      });
    }

    res.json({
      success: true,
      data: ejercicios
    });
  } catch (error) {
    console.error('Error in EjercicioController.findAll:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Obtiene un ejercicio por ID
 */
const findById = async (req, res) => {
  try {
    const { id } = req.params;
    const ejercicio = await ejercicioService.getEjercicioById(id);

    res.json({
      success: true,
      data: ejercicio
    });
  } catch (error) {
    console.error('Error in EjercicioController.findById:', error);
    if (error.message === 'Ejercicio no encontrado') {
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
 * Crea un nuevo ejercicio
 */
const create = async (req, res) => {
  try {
    // Validación de datos
    const { error, value } = createEjercicioSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details
      });
    }

    // Agregar el ID del psicólogo que crea el ejercicio
    const ejercicioData = {
      ...value,
      psicologoId: req.user.id
    };

    const ejercicio = await ejercicioService.createEjercicio(ejercicioData);

    res.status(201).json({
      success: true,
      message: 'Ejercicio creado exitosamente',
      data: ejercicio
    });
  } catch (error) {
    console.error('Error in EjercicioController.create:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Actualiza un ejercicio
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validación de datos
    const { error, value } = updateEjercicioSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details
      });
    }

    const ejercicio = await ejercicioService.updateEjercicio(id, value);

    res.json({
      success: true,
      message: 'Ejercicio actualizado exitosamente',
      data: ejercicio
    });
  } catch (error) {
    console.error('Error in EjercicioController.update:', error);
    if (error.message === 'Ejercicio no encontrado') {
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
 * Elimina un ejercicio
 */
const deleteEjercicio = async (req, res) => {
  try {
    const { id } = req.params;
    await ejercicioService.deleteEjercicio(id);

    res.json({
      success: true,
      message: 'Ejercicio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error in EjercicioController.delete:', error);
    if (error.message === 'Ejercicio no encontrado') {
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
 * Obtiene ejercicios por objetivo
 */
const findByObjetivo = async (req, res) => {
  try {
    const { objetivoId } = req.params;
    const ejercicios = await ejercicioService.getEjerciciosByObjetivo(objetivoId);

    res.json({
      success: true,
      data: ejercicios
    });
  } catch (error) {
    console.error('Error in EjercicioController.findByObjetivo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Obtiene ejercicios por paciente
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
        message: 'No autorizado para ver estos ejercicios'
      });
    }

    const ejercicios = await ejercicioService.getEjerciciosByPaciente(pacienteId);

    res.json({
      success: true,
      data: ejercicios
    });
  } catch (error) {
    console.error('Error in EjercicioController.findByPaciente:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Marca un ejercicio como completado
 */
const marcarCompletado = async (req, res) => {
  try {
    const { id } = req.params;
    const ejercicio = await ejercicioService.marcarCompletado(id);

    res.json({
      success: true,
      message: 'Ejercicio marcado como completado',
      data: ejercicio
    });
  } catch (error) {
    console.error('Error in EjercicioController.marcarCompletado:', error);
    if (error.message === 'Ejercicio no encontrado') {
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
 * Marca un ejercicio como no completado
 */
const marcarNoCompletado = async (req, res) => {
  try {
    const { id } = req.params;
    const ejercicio = await ejercicioService.marcarNoCompletado(id);

    res.json({
      success: true,
      message: 'Ejercicio marcado como no completado',
      data: ejercicio
    });
  } catch (error) {
    console.error('Error in EjercicioController.marcarNoCompletado:', error);
    if (error.message === 'Ejercicio no encontrado') {
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
 * Asigna un ejercicio a un objetivo
 */
const asignarAObjetivo = async (req, res) => {
  try {
    const { id, objetivoId } = req.params;
    const ejercicio = await ejercicioService.asignarAObjetivo(id, objetivoId);

    res.json({
      success: true,
      message: 'Ejercicio asignado al objetivo exitosamente',
      data: ejercicio
    });
  } catch (error) {
    console.error('Error in EjercicioController.asignarAObjetivo:', error);
    if (error.message === 'Ejercicio no encontrado' || error.message === 'Objetivo no encontrado') {
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
  delete: deleteEjercicio,
  findByObjetivo,
  findByPaciente,
  marcarCompletado,
  marcarNoCompletado,
  asignarAObjetivo
};
