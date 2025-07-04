import express from 'express';
import EjercicioController from '../controllers/ejercicioController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import psicologoMiddleware from '../middleware/psicologoMiddleware.js';

const router = express.Router();

// Routes for exercises management
// All routes require authentication

// Get all exercises (filtered by user role in controller)
router.get('/', authMiddleware, EjercicioController.findAll);

// Get exercise by ID
router.get('/:id', authMiddleware, EjercicioController.findById);

// Create new exercise (psychologist only)
router.post('/', authMiddleware, psicologoMiddleware, EjercicioController.create);

// Update exercise (psychologist only)
router.put('/:id', authMiddleware, psicologoMiddleware, EjercicioController.update);

// Delete exercise (psychologist only)
router.delete('/:id', authMiddleware, psicologoMiddleware, EjercicioController.delete);

// Get exercises by objective ID
router.get('/objetivo/:objetivoId', authMiddleware, EjercicioController.findByObjetivo);

// Get exercises by patient ID (through their objectives)
router.get('/paciente/:pacienteId', authMiddleware, EjercicioController.findByPaciente);

// Mark exercise as completed (patients can mark their own exercises)
router.patch('/:id/completar', authMiddleware, EjercicioController.marcarCompletado);

// Mark exercise as incomplete (patients can mark their own exercises)
router.patch('/:id/descompletar', authMiddleware, EjercicioController.marcarNoCompletado);

// Assign exercise to objective (psychologist only)
router.post('/:id/asignar/:objetivoId', authMiddleware, psicologoMiddleware, EjercicioController.asignarAObjetivo);

export default router;
