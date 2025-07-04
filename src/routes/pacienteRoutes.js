import express from 'express';
import PacienteController from '../controllers/pacienteController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import psicologoMiddleware from '../middleware/psicologoMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// Admin-only route to list all patients
router.get('/', authMiddleware, adminMiddleware, PacienteController.findAll);

// Patient routes - controllers handle specific permissions
// Esta ruta permite que psicólogos accedan a perfiles de sus pacientes asignados
router.get('/:id', authMiddleware, PacienteController.findById); 
router.post('/profile', authMiddleware, PacienteController.create);
router.delete('/profile', authMiddleware, PacienteController.remove);

// Routes where psychologists can update their patients' info
router.put('/:id/diagnose', authMiddleware, psicologoMiddleware, PacienteController.update);
router.put('/profile/:id?', authMiddleware, PacienteController.update); // Controller handles permissions

// Route to assign psychologist to patient
router.post('/:id/assign-psicologo', authMiddleware, PacienteController.assignPsicologo);

export default router;