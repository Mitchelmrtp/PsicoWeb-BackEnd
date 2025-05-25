import Paciente from '../models/Paciente.js';
import User from '../models/User.js';
import Psicologo from '../models/Psicologo.js';
import Joi from 'joi';

const pacienteSchema = Joi.object({
    motivoConsulta: Joi.string().required(),
    diagnosticoPreliminar: Joi.string().optional()
});

const assignSchema = Joi.object({
    psicologoId: Joi.string().required()
});

export const findAll = async (req, res) => {
    try {
        const pacientes = await Paciente.findAll({
            include: [{
                model: User,
                attributes: ['name', 'email', 'telephone']
            }]
        });
        
        res.status(200).json(pacientes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const findById = async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.params.id, {
            include: [{
                model: User,
                attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
            }]
        });
        
        if (!paciente) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        
        if (req.user.userId !== paciente.id && req.user.role !== 'admin') {
            const isPsicologo = await Psicologo.findOne({
                where: { id: req.user.userId },
                include: [{
                    model: Paciente,
                    where: { id: paciente.id }
                }]
            });
            
            if (!isPsicologo) {
                return res.status(403).json({ message: 'You are not authorized to view this patient' });
            }
        }
        
        res.status(200).json(paciente);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const create = async (req, res) => {
    const { error } = pacienteSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const existingProfile = await Paciente.findByPk(req.user.userId);
        if (existingProfile) {
            return res.status(400).json({ message: 'Patient profile already exists for this user' });
        }
        
        const paciente = await Paciente.create({
            id: req.user.userId,
            ...req.body
        });
        
        res.status(201).json(paciente);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const update = async (req, res) => {
    const { error } = pacienteSchema.validate(req.body, { allowUnknown: true });
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const pacienteId = req.params.id || req.user.userId;
        const paciente = await Paciente.findByPk(pacienteId);
        
        if (!paciente) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        
        if (req.user.userId !== paciente.id && req.user.role !== 'admin') {
            const isPsicologo = await Psicologo.findOne({
                where: { id: req.user.userId },
                include: [{
                    model: Paciente,
                    where: { id: paciente.id }
                }]
            });
            
            if (!isPsicologo) {
                return res.status(403).json({ message: 'You are not authorized to update this patient' });
            }
        }
        
        await paciente.update(req.body);
        
        res.status(200).json(paciente);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.user.userId);
        
        if (!paciente) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        
        await paciente.destroy();
        
        res.status(200).json({ message: 'Patient profile successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const assignPsicologo = async (req, res) => {
    const { error } = assignSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }
    
    try {
        const { psicologoId } = req.body;
        const pacienteId = req.params.id || req.user.userId;
        
        const paciente = await Paciente.findByPk(pacienteId);
        if (!paciente) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        
        const psicologo = await Psicologo.findByPk(psicologoId);
        if (!psicologo) {
            return res.status(404).json({ message: 'Psychologist not found' });
        }
        
        await paciente.addPsicologo(psicologo);
        
        res.status(200).json({ message: 'Psychologist successfully assigned' });
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
    assignPsicologo
};