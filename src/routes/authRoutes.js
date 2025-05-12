import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, deleteAccount } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Rol inválido')
], register);

router.post('/login', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
], login);

router.get('/profile', authMiddleware, getProfile);

router.delete('/delete-account', authMiddleware, deleteAccount);


export default router;