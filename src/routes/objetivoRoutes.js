import express from 'express';
import ObjetivoController from '../controllers/objetivoController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import psicologoMiddleware from '../middleware/psicologoMiddleware.js';

const router = express.Router();

// Routes for objectives management
// All routes require authentication

// Get all objectives (filtered by user role in controller)
router.get('/', authMiddleware, ObjetivoController.findAll);

// Get objective by ID
router.get('/:id', authMiddleware, ObjetivoController.findById);

// Create new objective (psychologist only)
router.post('/', authMiddleware, psicologoMiddleware, ObjetivoController.create);

// Update objective (psychologist only)
router.put('/:id', authMiddleware, psicologoMiddleware, ObjetivoController.update);

// Delete objective (psychologist only)
router.delete('/:id', authMiddleware, psicologoMiddleware, ObjetivoController.delete);

// Get objectives by patient ID (psychologist can access their patients, patients can access their own)
router.get('/paciente/:pacienteId', authMiddleware, ObjetivoController.findByPaciente);

// Update objective progress (patients can update their own objectives)
router.patch('/:id/progreso', authMiddleware, ObjetivoController.updateProgreso);

export default router;
