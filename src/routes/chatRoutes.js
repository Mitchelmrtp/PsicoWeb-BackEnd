import express from 'express';
import chatController from '../controllers/chatController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { uploadChatFile, handleUploadErrors } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============ RUTAS DE CHAT ============

// Obtener todos los chats del usuario autenticado
router.get('/', chatController.getUserChats);

// Crear un nuevo chat o obtener uno existente
router.post('/', chatController.createOrGetChat);

// Obtener un chat específico por ID
router.get('/:id', chatController.getChatById);

// Actualizar estado del chat (archivar, bloquear, etc.)
router.put('/:id/status', chatController.updateChatStatus);

// ============ RUTAS DE MENSAJES ============

// Obtener mensajes de un chat específico
router.get('/:chatId/messages', chatController.getChatMessages);

// Enviar mensaje de texto
router.post('/messages', chatController.sendMessage);

// Enviar mensaje con archivo
router.post('/:chatId/messages/file', 
    uploadChatFile,
    handleUploadErrors,
    chatController.sendFileMessage
);

// Eliminar mensaje
router.delete('/messages/:messageId', chatController.deleteMessage);

export default router;
