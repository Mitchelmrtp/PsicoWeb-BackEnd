import { NotificacionService } from '../services/CalendarioService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import Joi from 'joi';

const notificacionService = new NotificacionService();

const notificacionSchema = Joi.object({
    mensaje: Joi.string().required(),
    tipo: Joi.string().required(),
    idUsuario: Joi.string().required()
});

export const getNotificacionesByUser = async (req, res) => {
    try {
        const usuarioId = req.params.usuarioId || req.user.userId;
        const result = await notificacionService.getNotificacionesByUsuario(usuarioId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const getNotificacionesNoLeidas = async (req, res) => {
    try {
        const usuarioId = req.params.usuarioId || req.user.userId;
        const result = await notificacionService.getNotificacionesNoLeidas(usuarioId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const create = async (req, res) => {
    try {
        const { error } = notificacionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await notificacionService.createNotificacion(req.body);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const marcarComoLeida = async (req, res) => {
    try {
        const result = await notificacionService.markAsRead(req.params.id, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const marcarTodasComoLeidas = async (req, res) => {
    try {
        const usuarioId = req.params.usuarioId || req.user.userId;
        const result = await notificacionService.markAllAsRead(usuarioId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const usuarioId = req.params.usuarioId || req.user.userId;
        const result = await notificacionService.getUnreadCount(usuarioId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export default {
    getNotificacionesByUser,
    getNotificacionesNoLeidas,
    create,
    marcarComoLeida,
    marcarTodasComoLeidas,
    getUnreadCount
};
