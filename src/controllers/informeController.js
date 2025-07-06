// src/controllers/InformeController.js
import { InformeService } from '../services/InformeService.js';
import Joi from 'joi';
import { handleServiceResponse } from '../utils/responseUtils.js';

const service = new InformeService();

const informeSchema = Joi.object({
  nombre_paciente: Joi.string().required(),
  nombre_psicologo: Joi.string().required(),
  hora_inicio: Joi.string().required(),
  hora_fin: Joi.string().required(),
  fecha_sesion: Joi.string().required(),
  motivo_consulta: Joi.string().allow('', null),
  objetivo_sesion: Joi.string().allow('', null),
  comentario_sesion: Joi.string().allow('', null),
});

export const findAll = async (req, res) => {
  try {
    const result = await service.getAllInformes();
    handleServiceResponse(res, result);
  } catch (err) {
    handleServiceResponse(res, err);
  }
};

export const findById = async (req, res) => {
  try {
    const result = await service.getInformeById(req.params.id);
    handleServiceResponse(res, result);
  } catch (err) {
    handleServiceResponse(res, err);
  }
};

export const create = async (req, res) => {
  const { error } = informeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: 'Validation error', details: error.details });
  }
  try {
    const result = await service.createInforme(req.body);
    handleServiceResponse(res, result);
  } catch (err) {
    handleServiceResponse(res, err);
  }
};

export const update = async (req, res) => {
  const { error } = informeSchema.validate(req.body, { allowUnknown: true });
  if (error) {
    return res.status(400).json({ message: 'Validation error', details: error.details });
  }
  try {
    const result = await service.updateInforme(req.params.id, req.body);
    handleServiceResponse(res, result);
  } catch (err) {
    handleServiceResponse(res, err);
  }
};

export const remove = async (req, res) => {
  try {
    const result = await service.deleteInforme(req.params.id);
    handleServiceResponse(res, result);
  } catch (err) {
    handleServiceResponse(res, err);
  }
};

export default {
  findAll,
  findById,
  create,
  update,
  remove,
};
