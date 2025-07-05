import express from 'express';
import pagoController from '../controllers/pagoController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas para pagos
router.post('/procesar-con-sesion', pagoController.procesarPagoConSesion); // Procesar pago y crear sesión
router.post('/', pagoController.procesarPago);                        // Procesar nuevo pago
router.get('/mis-pagos', pagoController.misPagos);                     // Mis pagos (paciente)
router.get('/sesion/:sesionId', pagoController.pagosPorSesion);        // Pagos de una sesión
router.get('/comprobante/:numero', pagoController.obtenerComprobante); // Obtener comprobante por número
router.get('/:id/estado', pagoController.verificarEstado);             // Verificar estado de pago
router.get('/:id/comprobante', pagoController.generarComprobante);     // Generar comprobante
router.patch('/:id/confirmar', pagoController.confirmarPago);          // Confirmar pago (admin/psicólogo)
router.get('/', pagoController.findAll);                               // Todos los pagos (admin/psicólogo)

export default router;
