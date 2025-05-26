import express from 'express';
import DisponibilidadPsicologoController from '../controllers/disponibilidadPsicologoController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import psicologoMiddleware from '../middleware/psicologoMiddleware.js';

const router = express.Router();

// Ruta pública para cualquier usuario autenticado (pacientes pueden ver disponibilidad)
router.get('/psicologo/:id', authMiddleware, DisponibilidadPsicologoController.findByPsicologoId);

// Rutas que requieren ser psicólogo (gestión de disponibilidad)
router.get('/', authMiddleware, psicologoMiddleware, DisponibilidadPsicologoController.findAllByPsicologo);
router.post('/', authMiddleware, psicologoMiddleware, DisponibilidadPsicologoController.create);
router.put('/:id', authMiddleware, psicologoMiddleware, DisponibilidadPsicologoController.update);
router.delete('/:id', authMiddleware, psicologoMiddleware, DisponibilidadPsicologoController.remove);

export default router;