import DisponibilidadPsicologo from '../models/DisponibilidadPsicologo.js';
import Psicologo from '../models/Psicologo.js';
import Joi from 'joi';
import { Op } from 'sequelize';

const disponibilidadSchema = Joi.object({
    diaSemana: Joi.string().valid('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO').required(),
    horaInicio: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    horaFin: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    activo: Joi.boolean().optional()
});

export const findAllByPsicologo = async (req, res) => {
    try {
        const disponibilidades = await DisponibilidadPsicologo.findAll({
            where: {
                idPsicologo: req.user.userId
            },
            order: [
                ['diaSemana', 'ASC'],
                ['horaInicio', 'ASC']
            ]
        });
        
        res.status(200).json(disponibilidades);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

export const create = async (req, res) => {
    const { error } = disponibilidadSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Error de validación', error: error.details });
    }

    try {
        // Verificar que el usuario sea psicólogo
        const psicologo = await Psicologo.findByPk(req.user.userId);
        if (!psicologo) {
            return res.status(403).json({ message: 'Solo los psicólogos pueden crear disponibilidades' });
        }

        // Verificar si ya existe una disponibilidad con el mismo día y horario superpuesto
        const { diaSemana, horaInicio, horaFin } = req.body;
        const disponibilidadesExistentes = await DisponibilidadPsicologo.findAll({
            where: {
                idPsicologo: req.user.userId,
                diaSemana: diaSemana
            }
        });

        // Validar superposición de horarios
        for (const disp of disponibilidadesExistentes) {
            if (
                (horaInicio >= disp.horaInicio && horaInicio < disp.horaFin) ||
                (horaFin > disp.horaInicio && horaFin <= disp.horaFin) ||
                (horaInicio <= disp.horaInicio && horaFin >= disp.horaFin)
            ) {
                return res.status(400).json({ 
                    message: 'La disponibilidad se superpone con otra ya existente' 
                });
            }
        }
        
        // Crear la disponibilidad
        const disponibilidad = await DisponibilidadPsicologo.create({
            idPsicologo: req.user.userId,
            ...req.body
        });
        
        res.status(201).json(disponibilidad);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

export const update = async (req, res) => {
    const { error } = disponibilidadSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Error de validación', error: error.details });
    }

    try {
        const disponibilidad = await DisponibilidadPsicologo.findOne({
            where: {
                id: req.params.id,
                idPsicologo: req.user.userId
            }
        });
        
        if (!disponibilidad) {
            return res.status(404).json({ message: 'Disponibilidad no encontrada' });
        }

        // Verificar superposición con otras disponibilidades
        if (req.body.diaSemana || req.body.horaInicio || req.body.horaFin) {
            const diaSemana = req.body.diaSemana || disponibilidad.diaSemana;
            const horaInicio = req.body.horaInicio || disponibilidad.horaInicio;
            const horaFin = req.body.horaFin || disponibilidad.horaFin;

            const disponibilidadesExistentes = await DisponibilidadPsicologo.findAll({
                where: {
                    id: { [Op.ne]: req.params.id }, // excluir la disponibilidad actual
                    idPsicologo: req.user.userId,
                    diaSemana: diaSemana
                }
            });

            for (const disp of disponibilidadesExistentes) {
                if (
                    (horaInicio >= disp.horaInicio && horaInicio < disp.horaFin) ||
                    (horaFin > disp.horaInicio && horaFin <= disp.horaFin) ||
                    (horaInicio <= disp.horaInicio && horaFin >= disp.horaFin)
                ) {
                    return res.status(400).json({ 
                        message: 'La disponibilidad se superpone con otra ya existente' 
                    });
                }
            }
        }
        
        await disponibilidad.update(req.body);
        
        res.status(200).json(disponibilidad);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const disponibilidad = await DisponibilidadPsicologo.findOne({
            where: {
                id: req.params.id,
                idPsicologo: req.user.userId
            }
        });
        
        if (!disponibilidad) {
            return res.status(404).json({ message: 'Disponibilidad no encontrada' });
        }
        
        await disponibilidad.destroy();
        
        res.status(200).json({ message: 'Disponibilidad eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

export default {
    findAllByPsicologo,
    create,
    update,
    remove
};