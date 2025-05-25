import Calendario from '../models/Calendario.js';
import Evento from '../models/Evento.js';
import { Op } from 'sequelize';
import Joi from 'joi';

const eventoSchema = Joi.object({
    idCalendario: Joi.string().required(),
    titulo: Joi.string().required(),
    descripcion: Joi.string().optional(),
    fecha: Joi.date().required(),
    horaInicio: Joi.string().required(),
    horaFin: Joi.string().required(),
    color: Joi.string().optional(),
    tipo: Joi.string().required()
});

export const findUserCalendar = async (req, res) => {
    try {
        let calendario = await Calendario.findOne({
            where: { idUsuario: req.user.userId }
        });
        
        if (!calendario) {
            calendario = await Calendario.create({
                idUsuario: req.user.userId,
                tipo: 'personal'
            });
        }
        
        res.status(200).json(calendario);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const findCalendarEvents = async (req, res) => {
    try {
        const { calendarId, startDate, endDate } = req.query;
        
        const calendario = await Calendario.findByPk(calendarId);
        if (!calendario) {
            return res.status(404).json({ message: 'Calendar not found' });
        }
        
        if (calendario.idUsuario !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to view this calendar' });
        }
        
        const where = { idCalendario: calendarId };
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
        
        const eventos = await Evento.findAll({ 
            where,
            order: [['fecha', 'ASC'], ['horaInicio', 'ASC']]
        });
        
        res.status(200).json(eventos);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createEvent = async (req, res) => {
    const { error } = eventoSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const { idCalendario } = req.body;
        
        const calendario = await Calendario.findByPk(idCalendario);
        if (!calendario) {
            return res.status(404).json({ message: 'Calendar not found' });
        }
        
        if (calendario.idUsuario !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to modify this calendar' });
        }
        
        const evento = await Evento.create(req.body);
        
        res.status(201).json(evento);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateEvent = async (req, res) => {
    const { error } = eventoSchema.validate(req.body, { allowUnknown: true });
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const evento = await Evento.findByPk(req.params.id, {
            include: [{
                model: Calendario
            }]
        });
        
        if (!evento) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        if (evento.Calendario.idUsuario !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to modify this event' });
        }
        
        await evento.update(req.body);
        
        res.status(200).json(evento);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const removeEvent = async (req, res) => {
    try {
        const evento = await Evento.findByPk(req.params.id, {
            include: [{
                model: Calendario
            }]
        });
        
        if (!evento) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        if (evento.Calendario.idUsuario !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to delete this event' });
        }
        
        await evento.destroy();
        
        res.status(200).json({ message: 'Event successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export default {
    findUserCalendar,
    findCalendarEvents,
    createEvent,
    updateEvent,
    removeEvent
};