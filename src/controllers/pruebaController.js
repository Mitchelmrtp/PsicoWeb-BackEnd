import Prueba from '../models/Prueba.js';
import Pregunta from '../models/Pregunta.js';
import ResultadoPrueba from '../models/ResultadoPrueba.js';
import Paciente from '../models/Paciente.js';
import Psicologo from '../models/Psicologo.js';
import Joi from 'joi';

const pruebaSchema = Joi.object({
    titulo: Joi.string().required(),
    descripcion: Joi.string().required(),
    activa: Joi.boolean().default(true)
});

const preguntaSchema = Joi.object({
    enunciado: Joi.string().required(),
    opciones: Joi.array().required(),
    pesoEvaluativo: Joi.number().default(1)
});

const resultadoSchema = Joi.object({
    idPaciente: Joi.string().required(),
    resultado: Joi.string().required(),
    interpretacion: Joi.string().optional()
});

export const findAll = async (req, res) => {
    try {
        const pruebas = await Prueba.findAll({
            where: req.user.role !== 'admin' ? { activa: true } : {}
        });
        
        res.status(200).json(pruebas);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const findById = async (req, res) => {
    try {
        const prueba = await Prueba.findByPk(req.params.id, {
            include: [{
                model: Pregunta,
                attributes: ['id', 'enunciado', 'opciones', 'pesoEvaluativo']
            }]
        });
        
        if (!prueba) {
            return res.status(404).json({ message: 'Test not found' });
        }
        
        if (req.user.role !== 'admin' && !prueba.activa) {
            return res.status(403).json({ message: 'You are not authorized to view this test' });
        }
        
        res.status(200).json(prueba);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const create = async (req, res) => {
    const { error } = pruebaSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const prueba = await Prueba.create(req.body);
        
        res.status(201).json(prueba);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const update = async (req, res) => {
    const { error } = pruebaSchema.validate(req.body, { allowUnknown: true });
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const prueba = await Prueba.findByPk(req.params.id);
        
        if (!prueba) {
            return res.status(404).json({ message: 'Test not found' });
        }
        
        await prueba.update(req.body);
        
        res.status(200).json(prueba);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const prueba = await Prueba.findByPk(req.params.id);
        
        if (!prueba) {
            return res.status(404).json({ message: 'Test not found' });
        }
        
        await prueba.destroy();
        
        res.status(200).json({ message: 'Test successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createPregunta = async (req, res) => {
    const { error } = preguntaSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const prueba = await Prueba.findByPk(req.params.id);
        if (!prueba) {
            return res.status(404).json({ message: 'Test not found' });
        }
        
        const pregunta = await Pregunta.create({
            ...req.body,
            idPrueba: req.params.id
        });
        
        res.status(201).json(pregunta);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updatePregunta = async (req, res) => {
    const { error } = preguntaSchema.validate(req.body, { allowUnknown: true });
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const pregunta = await Pregunta.findOne({
            where: {
                id: req.params.questionId,
                idPrueba: req.params.testId
            }
        });
        
        if (!pregunta) {
            return res.status(404).json({ message: 'Question not found' });
        }
        
        await pregunta.update(req.body);
        
        res.status(200).json(pregunta);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const removePregunta = async (req, res) => {
    try {
        const pregunta = await Pregunta.findOne({
            where: {
                id: req.params.questionId,
                idPrueba: req.params.testId
            }
        });
        
        if (!pregunta) {
            return res.status(404).json({ message: 'Question not found' });
        }
        
        await pregunta.destroy();
        
        res.status(200).json({ message: 'Question successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createResultado = async (req, res) => {
    const { error } = resultadoSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const { idPaciente } = req.body;
        const idPrueba = req.params.id;
        
        const prueba = await Prueba.findByPk(idPrueba);
        if (!prueba) {
            return res.status(404).json({ message: 'Test not found' });
        }
        
        if (req.user.userId !== idPaciente && req.user.role !== 'admin') {
            const isPsicologo = await Psicologo.findOne({
                where: { id: req.user.userId },
                include: [{
                    model: Paciente,
                    where: { id: idPaciente }
                }]
            });
            
            if (!isPsicologo) {
                return res.status(403).json({ message: 'You are not authorized to submit results for this patient' });
            }
        }
        
        const resultado = await ResultadoPrueba.create({
            idPrueba,
            idPaciente,
            ...req.body
        });
        
        res.status(201).json(resultado);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const findResultados = async (req, res) => {
    try {
        let where = {};
        
        if (req.user.role === 'admin') {
            if (req.query.pacienteId) {
                where.idPaciente = req.query.pacienteId;
            }
            if (req.query.pruebaId) {
                where.idPrueba = req.query.pruebaId;
            }
        } else {
            const psicologo = await Psicologo.findByPk(req.user.userId);
            if (psicologo) {
                const pacientes = await psicologo.getPacientes();
                const pacienteIds = pacientes.map(p => p.id);
                
                if (req.query.pacienteId) {
                    if (!pacienteIds.includes(req.query.pacienteId)) {
                        return res.status(403).json({ message: 'You are not authorized to view results for this patient' });
                    }
                    where.idPaciente = req.query.pacienteId;
                } else {
                    where.idPaciente = pacienteIds;
                }
            } else {
                where.idPaciente = req.user.userId;
            }
            
            if (req.query.pruebaId) {
                where.idPrueba = req.query.pruebaId;
            }
        }
        
        const resultados = await ResultadoPrueba.findAll({
            where,
            include: [
                { model: Prueba },
                { model: Paciente }
            ]
        });
        
        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const findResultadoById = async (req, res) => {
    try {
        const resultado = await ResultadoPrueba.findByPk(req.params.id, {
            include: [
                { model: Prueba },
                { model: Paciente }
            ]
        });
        
        if (!resultado) {
            return res.status(404).json({ message: 'Result not found' });
        }
        
        if (req.user.role !== 'admin' && req.user.userId !== resultado.idPaciente) {
            const psicologo = await Psicologo.findByPk(req.user.userId);
            if (psicologo) {
                const paciente = await psicologo.getPacientes({
                    where: { id: resultado.idPaciente }
                });
                
                if (paciente.length === 0) {
                    return res.status(403).json({ message: 'You are not authorized to view this result' });
                }
            } else {
                return res.status(403).json({ message: 'You are not authorized to view this result' });
            }
        }
        
        res.status(200).json(resultado);
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
    createPregunta,
    updatePregunta,
    removePregunta,
    createResultado,
    findResultados,
    findResultadoById
};