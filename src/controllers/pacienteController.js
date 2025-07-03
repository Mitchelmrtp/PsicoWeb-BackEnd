import { PacienteService } from '../services/PacienteService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import Joi from 'joi';

const pacienteService = new PacienteService();

const pacienteSchema = Joi.object({
    motivoConsulta: Joi.string().required(),
    diagnosticoPreliminar: Joi.string().optional(),
    diagnostico: Joi.string().optional(),
    idPsicologo: Joi.string().optional()
});

const assignSchema = Joi.object({
    psicologoId: Joi.string().required()
});

export const findAll = async (req, res) => {
    try {
        const result = await pacienteService.getAllPacientes();
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findById = async (req, res) => {
    try {
        const result = await pacienteService.getPacienteById(req.params.id, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const create = async (req, res) => {
    try {
        const { error } = pacienteSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        // For patient profile creation, use current user ID
        const pacienteData = {
            id: req.user.userId,
            ...req.body
        };

        const result = await pacienteService.createPaciente(pacienteData);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const update = async (req, res) => {
    try {
        const { error } = pacienteSchema.validate(req.body, { allowUnknown: true });
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const pacienteId = req.params.id || req.user.userId;
        const result = await pacienteService.updatePaciente(pacienteId, req.body, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const remove = async (req, res) => {
    try {
        const pacienteId = req.params.id || req.user.userId;
        const result = await pacienteService.deletePaciente(pacienteId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const assignPsicologo = async (req, res) => {
    try {
        const { error } = assignSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const pacienteId = req.params.id || req.user.userId;
        const result = await pacienteService.assignPsicologoToPaciente(
            pacienteId, 
            req.body.psicologoId, 
            req.user
        );
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export default {
    findAll,
    findById,
    create,
    update,
    remove,
    assignPsicologo
};