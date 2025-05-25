import Sesion from '../models/Sesion.js';
import Psicologo from '../models/Psicologo.js';
import Paciente from '../models/Paciente.js';
import { Op } from 'sequelize';
import Joi from 'joi';

const sesionSchema = Joi.object({
    idPsicologo: Joi.string().required(),
    idPaciente: Joi.string().required(),
    fecha: Joi.date().required(),
    horaInicio: Joi.string().required(),
    horaFin: Joi.string().required(),
    notas: Joi.string().optional(),
    estado: Joi.string().valid('programada', 'completada', 'cancelada').default('programada')
});

const updateSchema = Joi.object({
    fecha: Joi.date().optional(),
    horaInicio: Joi.string().optional(),
    horaFin: Joi.string().optional(),
    notas: Joi.string().optional(),
    estado: Joi.string().valid('programada', 'completada', 'cancelada').optional()
});

export const findAll = async (req, res) => {
    try {
        const { startDate, endDate, estado } = req.query;
        const where = {};
        
        if (startDate && endDate) {
            where.fecha = {
                [Op.between]: [startDate, endDate]
            };
        } else if (startDate) {
            where.fecha = {
                [Op.gte]: startDate
            };
        } else if (endDate) {
            where.fecha = {
                [Op.lte]: endDate
            };
        }
        
        if (estado) {
            where.estado = estado;
        }
        
        if (req.user.role === 'admin') {
        } else {
            const psicologo = await Psicologo.findByPk(req.user.userId);
            if (psicologo) {
                where.idPsicologo = req.user.userId;
            } else {
                where.idPaciente = req.user.userId;
            }
        }
        
        const sesiones = await Sesion.findAll({
            where,
            include: [
                { model: Psicologo },
                { model: Paciente }
            ],
            order: [['fecha', 'ASC'], ['horaInicio', 'ASC']]
        });
        
        res.status(200).json(sesiones);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const findById = async (req, res) => {
    try {
        const sesion = await Sesion.findByPk(req.params.id, {
            include: [
                { model: Psicologo },
                { model: Paciente }
            ]
        });
        
        if (!sesion) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        if (req.user.role !== 'admin' && 
            req.user.userId !== sesion.idPsicologo && 
            req.user.userId !== sesion.idPaciente) {
            return res.status(403).json({ message: 'You are not authorized to view this session' });
        }
        
        res.status(200).json(sesion);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const create = async (req, res) => {
    const { error } = sesionSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const { idPsicologo, idPaciente } = req.body;
        
        const psicologo = await Psicologo.findByPk(idPsicologo);
        if (!psicologo) {
            return res.status(404).json({ message: 'Psychologist not found' });
        }
        
        const paciente = await Paciente.findByPk(idPaciente);
        if (!paciente) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        
        if (req.user.role !== 'admin' && 
            req.user.userId !== idPsicologo && 
            req.user.userId !== idPaciente) {
            return res.status(403).json({ message: 'You are not authorized to create this session' });
        }
        
        const sesion = await Sesion.create(req.body);
        
        res.status(201).json(sesion);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const update = async (req, res) => {
    const { error } = updateSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const sesion = await Sesion.findByPk(req.params.id);
        if (!sesion) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        if (req.user.role !== 'admin' && 
            req.user.userId !== sesion.idPsicologo && 
            req.user.userId !== sesion.idPaciente) {
            return res.status(403).json({ message: 'You are not authorized to update this session' });
        }
        
        if (req.user.userId === sesion.idPaciente && req.user.role !== 'admin') {
            const { estado, fecha, horaInicio, horaFin, notas } = req.body;
            if ((estado && estado !== 'cancelada') || fecha || horaInicio || horaFin || notas) {
                return res.status(403).json({ message: 'As a patient, you can only cancel the session' });
            }
        }
        
        await sesion.update(req.body);
        
        res.status(200).json(sesion);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const sesion = await Sesion.findByPk(req.params.id);
        if (!sesion) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        if (req.user.role !== 'admin' && req.user.userId !== sesion.idPsicologo) {
            return res.status(403).json({ message: 'You are not authorized to delete this session' });
        }
        
        await sesion.destroy();
        
        res.status(200).json({ message: 'Session successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export default {
    findAll,
    findById,
    create,
    update,
    remove
};