import Psicologo from '../models/Psicologo.js';
import User from '../models/User.js';
import Joi from 'joi';

const psicologoSchema = Joi.object({
    especialidad: Joi.string().required(),
    licencia: Joi.string().required(),
    formacion: Joi.string().required(),
    biografia: Joi.string().optional(),
    anosExperiencia: Joi.number().optional(),
    tarifaPorSesion: Joi.number().precision(2).optional()
});

export const findAll = async (req, res) => {
    try {
        const psicologos = await Psicologo.findAll({
            include: [{
                model: User,
                attributes: ['name', 'email', 'telephone']
            }]
        });
        
        res.status(200).json(psicologos);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const findById = async (req, res) => {
    try {
        const psicologo = await Psicologo.findByPk(req.params.id, {
            include: [{
                model: User,
                attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
            }]
        });
        
        if (!psicologo) {
            return res.status(404).json({ message: 'Psychologist not found' });
        }
        
        res.status(200).json(psicologo);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const create = async (req, res) => {
    const { error } = psicologoSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const existingProfile = await Psicologo.findByPk(req.user.userId);
        if (existingProfile) {
            return res.status(400).json({ message: 'Psychologist profile already exists for this user' });
        }
        
        const psicologo = await Psicologo.create({
            id: req.user.userId,
            ...req.body
        });
        
        res.status(201).json(psicologo);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const update = async (req, res) => {
    const { error } = psicologoSchema.validate(req.body, { allowUnknown: true });
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const psicologo = await Psicologo.findByPk(req.user.userId);
        
        if (!psicologo) {
            return res.status(404).json({ message: 'Psychologist profile not found' });
        }
        
        await psicologo.update(req.body);
        
        res.status(200).json(psicologo);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const psicologo = await Psicologo.findByPk(req.user.userId);
        
        if (!psicologo) {
            return res.status(404).json({ message: 'Psychologist profile not found' });
        }
        
        await psicologo.destroy();
        
        res.status(200).json({ message: 'Psychologist profile successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const findPacientes = async (req, res) => {
    try {
        const psicologo = await Psicologo.findByPk(req.user.userId, {
            include: [{
                model: Paciente,
                include: [{
                    model: User,
                    attributes: ['name', 'email', 'first_name', 'last_name', 'telephone']
                }]
            }]
        });
        
        if (!psicologo) {
            return res.status(404).json({ message: 'Psychologist not found' });
        }
        
        res.status(200).json(psicologo.Pacientes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export default {
    findAll,
    findById,
    create,
    update,
    remove,
    findPacientes
};
