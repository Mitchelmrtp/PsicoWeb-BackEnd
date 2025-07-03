import { SesionService } from '../services/SesionService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import Joi from 'joi';

const sesionService = new SesionService();

const sesionSchema = Joi.object({
  idPsicologo: Joi.string().required(),
  idPaciente: Joi.string().required(),
  fecha: Joi.date().required(),
  horaInicio: Joi.string().required(),
  horaFin: Joi.string().required(),
  notas: Joi.string().optional(),
  estado: Joi.string()
    .valid("programada", "completada", "cancelada")
    .default("programada"),
});

const updateSchema = Joi.object({
  fecha: Joi.date().optional(),
  horaInicio: Joi.string().optional(),
  horaFin: Joi.string().optional(),
  notas: Joi.string().optional(),
  estado: Joi.string()
    .valid("programada", "completada", "cancelada")
    .optional(),
});

export const findAll = async (req, res) => {
  try {
    const { startDate, endDate, estado } = req.query;
    const filters = { startDate, endDate, estado };
    
    const result = await sesionService.getAllSesiones(filters, req.user);
    handleServiceResponse(res, result);
  } catch (error) {
    handleServiceResponse(res, error);
  }
};

export const findById = async (req, res) => {
  try {
    const result = await sesionService.getSesionById(req.params.id, req.user);
    handleServiceResponse(res, result);
  } catch (error) {
    handleServiceResponse(res, error);
  }
};

export const create = async (req, res) => {
  try {
    const { error } = sesionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Validation error', details: error.details });
    }

    const result = await sesionService.createSesion(req.body, req.user);
    handleServiceResponse(res, result);
  } catch (error) {
    handleServiceResponse(res, error);
  }
};

export const update = async (req, res) => {
  try {
    const { error } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Validation error', details: error.details });
    }

    const result = await sesionService.updateSesion(req.params.id, req.body, req.user);
    handleServiceResponse(res, result);
  } catch (error) {
    handleServiceResponse(res, error);
  }
};

export const remove = async (req, res) => {
  try {
    const result = await sesionService.deleteSesion(req.params.id, req.user);
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
};
