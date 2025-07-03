import { PruebaService } from '../services/PruebaService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import Joi from 'joi';

const pruebaService = new PruebaService();

const pruebaSchema = Joi.object({
    nombre: Joi.string().required(),
    descripcion: Joi.string().required(),
    instrucciones: Joi.string().required(),
    tiempoDuracion: Joi.number().integer().min(1).optional(),
    activa: Joi.boolean().optional()
});

const preguntaSchema = Joi.object({
    texto: Joi.string().required(),
    tipo: Joi.string().valid('LIKERT', 'MULTIPLE_CHOICE', 'OPEN_TEXT').required(),
    opciones: Joi.array().items(Joi.string()).optional(),
    orden: Joi.number().integer().min(1).required()
});

const resultadoPruebaSchema = Joi.object({
    idPrueba: Joi.string().required(),
    idPaciente: Joi.string().required(),
    respuestas: Joi.array().items(Joi.object({
        idPregunta: Joi.string().required(),
        respuesta: Joi.string().required(),
        puntuacion: Joi.number().optional()
    })).required()
});

// CRUD for Pruebas
export const findAll = async (req, res) => {
    try {
        const result = await pruebaService.getAllPruebas();
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findById = async (req, res) => {
    try {
        const result = await pruebaService.getPruebaById(req.params.id);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const create = async (req, res) => {
    try {
        const { error } = pruebaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await pruebaService.createPrueba(req.body, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const update = async (req, res) => {
    try {
        const { error } = pruebaSchema.validate(req.body, { allowUnknown: true });
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await pruebaService.updatePrueba(req.params.id, req.body, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const remove = async (req, res) => {
    try {
        const result = await pruebaService.deletePrueba(req.params.id, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

// Preguntas methods
export const findPreguntasByPrueba = async (req, res) => {
    try {
        const result = await pruebaService.getPreguntasByPrueba(req.params.id);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const createPregunta = async (req, res) => {
    try {
        const { error } = preguntaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const preguntaData = {
            idPrueba: req.params.id,
            ...req.body
        };

        const result = await pruebaService.createPregunta(preguntaData, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const updatePregunta = async (req, res) => {
    try {
        const { error } = preguntaSchema.validate(req.body, { allowUnknown: true });
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await pruebaService.updatePregunta(req.params.preguntaId, req.body, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const removePregunta = async (req, res) => {
    try {
        const result = await pruebaService.deletePregunta(req.params.preguntaId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

// ResultadoPrueba methods
export const createResultado = async (req, res) => {
    try {
        const { error } = resultadoPruebaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await pruebaService.createResultadoPrueba(req.body, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findResultadosByPaciente = async (req, res) => {
    try {
        const result = await pruebaService.getResultadosByPaciente(req.params.pacienteId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findResultadosByPrueba = async (req, res) => {
    try {
        const result = await pruebaService.getResultadosByPrueba(req.params.pruebaId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const findResultadoById = async (req, res) => {
    try {
        const result = await pruebaService.getResultadoById(req.params.resultadoId, req.user);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

// Alias para compatibilidad con las rutas
export const getResultadosByPaciente = findResultadosByPaciente;
export const updatePreguntaOpciones = updatePregunta;
export const findPreguntaById = async (req, res) => {
    try {
        const result = await pruebaService.getPreguntaById(req.params.preguntaId);
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
    findPreguntasByPrueba,
    createPregunta,
    updatePregunta,
    removePregunta,
    updatePreguntaOpciones,
    findPreguntaById,
    createResultado,
    findResultadosByPaciente,
    getResultadosByPaciente,
    findResultadosByPrueba,
    findResultadoById
};
