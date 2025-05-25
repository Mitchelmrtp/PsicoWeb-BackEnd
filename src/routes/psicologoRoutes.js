import express from 'express';
import PsicologoController from '../controllers/psicologoController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import psicologoMiddleware from '../middleware/psicologoMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public routes (anyone can view psychologist listings)
router.get('/', PsicologoController.findAll);
router.get('/:id', PsicologoController.findById);

// Profile management - anyone can create a profile, but needs to be authenticated
router.post('/profile', authMiddleware, PsicologoController.create);

// Routes requiring psychologist role
router.put('/profile', authMiddleware, psicologoMiddleware, PsicologoController.update);
router.delete('/profile', authMiddleware, psicologoMiddleware, PsicologoController.remove);
router.get('/pacientes', authMiddleware, psicologoMiddleware, PsicologoController.findPacientes);

export default router;