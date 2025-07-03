import { ChatService } from '../services/ChatService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import { getFileInfo } from '../middleware/uploadMiddleware.js';
import Joi from 'joi';

const chatService = new ChatService();

// Schemas de validación
const createChatSchema = Joi.object({
    idPsicologo: Joi.string().uuid().required(),
    idPaciente: Joi.string().uuid().required(),
    titulo: Joi.string().optional()
});

const sendMessageSchema = Joi.object({
    idChat: Joi.string().uuid().required(),
    contenido: Joi.string().min(1).required(),
    tipoMensaje: Joi.string().valid('texto').optional()
});

const updateChatSchema = Joi.object({
    estado: Joi.string().valid('activo', 'archivado', 'bloqueado').required()
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    order: Joi.string().valid('ASC', 'DESC').optional()
});

// ============ CONTROLADORES DE CHAT ============

export const getUserChats = async (req, res) => {
    try {
        const result = await chatService.getChatsByUser(req.user.userId, req.user.role);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const getChatById = async (req, res) => {
    try {
        const result = await chatService.getChatById(req.params.id, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const createOrGetChat = async (req, res) => {
    try {
        const { error } = createChatSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                message: 'Validation error', 
                details: error.details 
            });
        }

        const { idPsicologo, idPaciente } = req.body;
        const result = await chatService.createOrGetChat(idPsicologo, idPaciente, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const updateChatStatus = async (req, res) => {
    try {
        const { error } = updateChatSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                message: 'Validation error', 
                details: error.details 
            });
        }

        const result = await chatService.updateChatStatus(
            req.params.id, 
            req.body.estado, 
            req.user
        );
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

// ============ CONTROLADORES DE MENSAJES ============

export const getChatMessages = async (req, res) => {
    try {
        const { error } = paginationSchema.validate(req.query);
        if (error) {
            return res.status(400).json({ 
                message: 'Validation error', 
                details: error.details 
            });
        }

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            order: req.query.order || 'ASC'
        };

        const result = await chatService.getMessagesByChat(
            req.params.chatId, 
            req.user, 
            options
        );
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { error } = sendMessageSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                message: 'Validation error', 
                details: error.details 
            });
        }

        const result = await chatService.sendMessage(req.body, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const sendFileMessage = async (req, res) => {
    try {
        // Validar que se envió un archivo
        if (!req.file) {
            return res.status(400).json({ 
                message: 'No se proporcionó ningún archivo' 
            });
        }

        // Validar chat ID
        if (!req.body.idChat) {
            return res.status(400).json({ 
                message: 'ID del chat es requerido' 
            });
        }

        const fileInfo = getFileInfo(req.file);
        const result = await chatService.sendFileMessage(
            req.body.idChat,
            fileInfo,
            req.user
        );
        
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const result = await chatService.deleteMessage(req.params.messageId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export default {
    getUserChats,
    getChatById,
    createOrGetChat,
    updateChatStatus,
    getChatMessages,
    sendMessage,
    sendFileMessage,
    deleteMessage
};
