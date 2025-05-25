import express from 'express';
import SesionController from '../controllers/sesionController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import psicologoMiddleware from '../middleware/psicologoMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// Routes accessible by authenticated users
router.get('/', authMiddleware, SesionController.findAll);
router.get('/:id', authMiddleware, SesionController.findById);

// Routes for creating sessions (patients and psychologists can create)
router.post('/', authMiddleware, SesionController.create);

// Routes only for psychologists or admins
router.put('/:id/complete', authMiddleware, psicologoMiddleware, SesionController.update);
router.put('/:id/notes', authMiddleware, psicologoMiddleware, SesionController.update);

// Regular update route - controller handles permissions internally
router.put('/:id', authMiddleware, SesionController.update);

// Delete is restricted to psychologists and admins in controller
router.delete('/:id', authMiddleware, SesionController.remove);

export default router;