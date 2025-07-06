// src/routes/informeRoutes.js
import express from 'express';
import InformeController from '../controllers/InformeController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Obtener todos los informes (ordenados por fecha_sesion desc)
router.get('/', authMiddleware, InformeController.findAll);

// Obtener un informe por ID
router.get('/:id', authMiddleware, InformeController.findById);

// Crear un nuevo informe
router.post('/', authMiddleware, InformeController.create);

// Actualizar un informe existente
router.put('/:id', authMiddleware, InformeController.update);

// Eliminar un informe
router.delete('/:id', authMiddleware, InformeController.remove);

export default router;
