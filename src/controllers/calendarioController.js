import { CalendarioService } from '../services/CalendarioService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import Joi from 'joi';

const calendarioService = new CalendarioService();

const eventoSchema = Joi.object({
    titulo: Joi.string().required(),
    descripcion: Joi.string().optional(),
    fechaInicio: Joi.date().required(),
    fechaFin: Joi.date().required(),
    tipoEvento: Joi.string().valid('sesion', 'disponibilidad', 'personal').default('personal'),
    idUsuario: Joi.string().optional(),
    activo: Joi.boolean().optional().default(true)
});

export const findAll = async (req, res) => {
    try {
        const result = await calendarioService.getAllEventos(req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findById = async (req, res) => {
    try {
        const result = await calendarioService.getEventoById(req.params.id, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findByUser = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.userId;
        const result = await calendarioService.getEventosByUsuario(userId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findByDateRange = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ message: 'fechaInicio y fechaFin son requeridos' });
        }

        const result = await calendarioService.getEventosByDateRange(fechaInicio, fechaFin, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const create = async (req, res) => {
    try {
        const { error } = eventoSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const eventoData = {
            idUsuario: req.user.userId,
            ...req.body
        };

        const result = await calendarioService.createEvento(eventoData, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const update = async (req, res) => {
    try {
        const { error } = eventoSchema.validate(req.body, { allowUnknown: true });
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await calendarioService.updateEvento(req.params.id, req.body, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const remove = async (req, res) => {
    try {
        const result = await calendarioService.deleteEvento(req.params.id, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

// Alias para compatibilidad con las rutas
export const findUserCalendar = findByUser;
export const findCalendarEvents = findAll;
export const createEvent = create;
export const updateEvent = update;
export const removeEvent = remove;

export default {
    findAll,
    findById,
    findByUser,
    findByDateRange,
    findUserCalendar,
    findCalendarEvents,
    create,
    createEvent,
    update,
    updateEvent,
    remove,
    removeEvent
};
