import express from 'express';
import * as PsicologoController from '../controllers/psicologoController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import psicologoMiddleware from '../middleware/psicologoMiddleware.js';

const router = express.Router();

// Public routes (anyone can view psychologist listings)
router.get('/', PsicologoController.findAll);

// Profile management - anyone can create a profile, but needs to be authenticated
router.post('/profile', authMiddleware, PsicologoController.create);

// Routes requiring psychologist role
router.put('/profile', authMiddleware, psicologoMiddleware, PsicologoController.update);
router.delete('/profile', authMiddleware, psicologoMiddleware, PsicologoController.remove);

// Route for getting psychologist's patients (must be before /:id route)
router.get('/pacientes', authMiddleware, PsicologoController.getPacientes);

// Route for getting a specific psychologist's patients
router.get('/:id/pacientes', PsicologoController.getPacientesByPsicologoId);

// Individual psychologist route (must be after specific routes)
router.get('/:id', PsicologoController.findById);

export default router;