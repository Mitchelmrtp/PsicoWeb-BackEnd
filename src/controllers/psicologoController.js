import { PsicologoService } from '../services/PsicologoService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import Joi from 'joi';

const psicologoService = new PsicologoService();

const psicologoSchema = Joi.object({
    especialidad: Joi.string().optional().allow(''),
    licencia: Joi.string().optional().allow(''),
    formacion: Joi.string().optional().allow(''),
    biografia: Joi.string().optional().allow(''),
    anosExperiencia: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().allow('')
    ).optional(),
    tarifaPorSesion: Joi.alternatives().try(
        Joi.number().precision(2).min(0),
        Joi.string().allow('')
    ).optional()
});

export const findAll = async (req, res) => {
    try {
        const result = await psicologoService.getAllPsicologos();
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findById = async (req, res) => {
    try {
        const result = await psicologoService.getPsicologoById(req.params.id);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const create = async (req, res) => {
    try {
        const { error } = psicologoSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const psicologoData = {
            id: req.user.userId,
            ...req.body
        };

        const result = await psicologoService.createPsicologo(psicologoData, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const update = async (req, res) => {
    try {
        console.log('=== PsicologoController.update ===');
        console.log('Body received:', req.body);
        console.log('User:', req.user);

        const { error } = psicologoSchema.validate(req.body, { allowUnknown: true });
        if (error) {
            console.log('Validation error:', error.details);
            return res.status(400).json({ 
                message: 'Validation error', 
                details: error.details.map(detail => detail.message)
            });
        }

        const result = await psicologoService.updatePsicologo(req.user.userId, req.body, req.user);
        console.log('Service result:', result);
        handleServiceResponse(res, result);
    } catch (error) {
        console.error('Controller error:', error);
        handleServiceResponse(res, error);
    }
};

export const remove = async (req, res) => {
    try {
        const result = await psicologoService.deletePsicologo(req.user.userId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findPacientes = async (req, res) => {
    try {
        const result = await psicologoService.getPacientesByPsicologo(req.user.userId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const getPacientes = async (req, res) => {
    try {
        const result = await psicologoService.getPacientesWithAppointments(req.user.userId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const getPacientesByPsicologoId = async (req, res) => {
    try {
        const psicologoId = req.params.id;
        console.log(`Controller: Getting patients for psychologist ID: ${psicologoId}`);
        
        // Verificar y registrar información de depuración
        console.log(`Controller: Request headers:`, req.headers);
        console.log(`Controller: Request user:`, req.user || 'No user in request');
        
        const result = await psicologoService.getPacientesByPsicologoId(psicologoId);
        console.log(`Controller: Got result with status: ${result.success ? 'Success' : 'Error'}`);
        
        if (!result.success) {
            console.error(`Controller: Error response - ${result.message}`);
        } else {
            console.log(`Controller: Found ${result.data.length} patients`);
        }
        
        handleServiceResponse(res, result);
    } catch (error) {
        console.error(`Controller error: ${error.message}`);
        handleServiceResponse(res, error);
    }
};

export default {
    findAll,
    findById,
    create,
    update,
    remove,
    findPacientes,
    getPacientes,
    getPacientesByPsicologoId
};
