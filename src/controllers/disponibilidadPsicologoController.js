import { DisponibilidadService } from '../services/DisponibilidadService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import Joi from 'joi';

const disponibilidadService = new DisponibilidadService();

const disponibilidadSchema = Joi.object({
    idPsicologo: Joi.string().optional(),
    diaSemana: Joi.string().valid('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO').required(),
    horaInicio: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    horaFin: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    activa: Joi.boolean().optional()
});

export const findAll = async (req, res) => {
    try {
        const result = await disponibilidadService.getAllDisponibilidades();
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findAllByPsicologo = async (req, res) => {
    try {
        const psicologoId = req.params.psicologoId || req.user.userId;
        const result = await disponibilidadService.getDisponibilidadesByPsicologo(psicologoId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findByPsicologoId = async (req, res) => {
    try {
        const result = await disponibilidadService.getDisponibilidadesActivasByPsicologo(req.params.id);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const create = async (req, res) => {
    try {
        const { error } = disponibilidadSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const disponibilidadData = {
            idPsicologo: req.user.userId,
            ...req.body
        };

        const result = await disponibilidadService.createDisponibilidad(disponibilidadData, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const update = async (req, res) => {
    try {
        const { error } = disponibilidadSchema.validate(req.body, { allowUnknown: true });
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await disponibilidadService.updateDisponibilidad(req.params.id, req.body, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const remove = async (req, res) => {
    try {
        const result = await disponibilidadService.deleteDisponibilidad(req.params.id, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const toggle = async (req, res) => {
    try {
        const result = await disponibilidadService.toggleDisponibilidad(req.params.id, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export default {
    findAll,
    findAllByPsicologo,
    findByPsicologoId,
    create,
    update,
    remove,
    toggle
};