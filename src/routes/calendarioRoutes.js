import express from 'express';
import CalendarioController from '../controllers/calendarioController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, CalendarioController.findUserCalendar);
router.get('/events', authMiddleware, CalendarioController.findCalendarEvents);
router.post('/events', authMiddleware, CalendarioController.createEvent);
router.put('/events/:id', authMiddleware, CalendarioController.updateEvent);
router.delete('/events/:id', authMiddleware, CalendarioController.removeEvent);

export default router;