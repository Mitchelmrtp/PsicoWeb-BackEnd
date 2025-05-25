import express from 'express';
import PruebaController from '../controllers/pruebaController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, PruebaController.findAll);
router.get('/:id', authMiddleware, PruebaController.findById);

router.post('/', authMiddleware, adminMiddleware, PruebaController.create);
router.put('/:id', authMiddleware, adminMiddleware, PruebaController.update);
router.delete('/:id', authMiddleware, adminMiddleware, PruebaController.remove);

router.post('/:id/preguntas', authMiddleware, adminMiddleware, PruebaController.createPregunta);
router.put('/:testId/preguntas/:questionId', authMiddleware, adminMiddleware, PruebaController.updatePregunta);
router.delete('/:testId/preguntas/:questionId', authMiddleware, adminMiddleware, PruebaController.removePregunta);

router.post('/:id/resultados', authMiddleware, PruebaController.createResultado);
router.get('/resultados', authMiddleware, PruebaController.findResultados);
router.get('/resultados/:id', authMiddleware, PruebaController.findResultadoById);

export default router;