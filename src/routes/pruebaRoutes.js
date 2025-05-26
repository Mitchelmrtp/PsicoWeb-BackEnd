import express from 'express';
import PruebaController from '../controllers/pruebaController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import psicologoMiddleware from '../middleware/psicologoMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, PruebaController.findAll);
router.get('/resultados', authMiddleware, PruebaController.getResultadosByPaciente);
router.get('/:id', authMiddleware, PruebaController.findById);

router.post('/', authMiddleware, psicologoMiddleware, PruebaController.create);
router.put('/:id', authMiddleware, psicologoMiddleware, PruebaController.update);
router.delete('/:id', authMiddleware, psicologoMiddleware, PruebaController.remove);

router.post('/:id/preguntas', authMiddleware, psicologoMiddleware, PruebaController.createPregunta);
router.put('/:testId/preguntas/:questionId', authMiddleware, psicologoMiddleware, PruebaController.updatePregunta);
router.delete('/:testId/preguntas/:questionId', authMiddleware, psicologoMiddleware, PruebaController.removePregunta);

router.put('/:id/preguntas/:preguntaId', authMiddleware, psicologoMiddleware, PruebaController.updatePreguntaOpciones);
router.get('/:id/preguntas/:preguntaId', authMiddleware, PruebaController.findPreguntaById);

router.post('/:id/resultados', authMiddleware, PruebaController.createResultado);
router.get('/resultados/:id', authMiddleware, PruebaController.findResultadoById);

export default router;