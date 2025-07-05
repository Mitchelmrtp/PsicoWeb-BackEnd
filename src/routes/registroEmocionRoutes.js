import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import psicologoMiddleware from '../middleware/psicologoMiddleware.js';
import {
  getRegistros,
  createRegistro,
  updateRegistro,
  deleteRegistro,
  getEstadisticas,
  getUltimoRegistro,
  getRegistroById
} from '../controllers/registroEmocionController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route GET /api/emociones
 * @desc Obtiene registros de emociones filtrados por usuario
 * @access Private (Paciente ve los suyos, Psicólogo ve de sus pacientes)
 * @query {number} pacienteId - ID del paciente (solo para psicólogos)
 * @query {string} startDate - Fecha de inicio (formato: YYYY-MM-DD)
 * @query {string} endDate - Fecha de fin (formato: YYYY-MM-DD)
 */
router.get('/', getRegistros);

/**
 * @route POST /api/emociones
 * @desc Crea un nuevo registro de emoción
 * @access Private (Solo psicólogos)
 * @body {number} idPaciente - ID del paciente
 * @body {number} [idSesion] - ID de la sesión (opcional)
 * @body {object} emociones - Objeto con emociones e intensidades
 * @body {string} [comentarios] - Comentarios del psicólogo
 * @body {string} estadoGeneral - Estado general del paciente
 */
router.post('/', psicologoMiddleware, createRegistro);

/**
 * @route GET /api/emociones/estadisticas
 * @desc Obtiene estadísticas de emociones
 * @access Private (Paciente ve las suyas, Psicólogo ve de sus pacientes)
 * @query {number} pacienteId - ID del paciente (solo para psicólogos)
 * @query {string} startDate - Fecha de inicio para el análisis
 * @query {string} endDate - Fecha de fin para el análisis
 */
router.get('/estadisticas', getEstadisticas);

/**
 * @route GET /api/emociones/ultimo
 * @desc Obtiene el último registro de emociones
 * @access Private (Paciente ve el suyo, Psicólogo ve de sus pacientes)
 * @query {number} pacienteId - ID del paciente (solo para psicólogos)
 */
router.get('/ultimo', getUltimoRegistro);

/**
 * @route GET /api/emociones/:id
 * @desc Obtiene un registro específico por ID
 * @access Private
 * @param {number} id - ID del registro
 */
router.get('/:id', getRegistroById);

/**
 * @route PUT /api/emociones/:id
 * @desc Actualiza un registro de emoción
 * @access Private (Solo psicólogos que crearon el registro)
 * @param {number} id - ID del registro
 * @body {object} [emociones] - Objeto con emociones e intensidades
 * @body {string} [comentarios] - Comentarios del psicólogo
 * @body {string} [estadoGeneral] - Estado general del paciente
 */
router.put('/:id', psicologoMiddleware, updateRegistro);

/**
 * @route DELETE /api/emociones/:id
 * @desc Elimina un registro de emoción
 * @access Private (Solo psicólogos que crearon el registro)
 * @param {number} id - ID del registro
 */
router.delete('/:id', psicologoMiddleware, deleteRegistro);

export default router;
