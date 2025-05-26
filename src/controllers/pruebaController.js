import Prueba from '../models/Prueba.js';
import Pregunta from '../models/Pregunta.js';
import ResultadoPrueba from '../models/ResultadoPrueba.js';
import Paciente from '../models/Paciente.js';
import Psicologo from '../models/Psicologo.js';
import Joi from 'joi';
import { sequelize } from '../models/index.js';

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
    interpretacion: Joi.string().optional(),
    puntuacionTotal: Joi.number().optional(),
    puntuacionPromedio: Joi.number().optional()
});

export const findAll = async (req, res) => {
    try {
        const pruebas = await Prueba.findAll({
            include: [{
                model: Pregunta,
                as: 'Preguntas'  // Incluir el alias aquí también
            }]
        });
        
        res.status(200).json(pruebas);
    } catch (error) {
        console.error('Error in findAll:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const findById = async (req, res) => {
    try {
        console.log(`Finding test with id: ${req.params.id}`);
        
        // Primero buscar la prueba por su ID
        const prueba = await Prueba.findByPk(req.params.id, {
            include: [{
                model: Pregunta,
                as: 'Preguntas'
            }]
        });
        
        if (!prueba) {
            console.log(`Test with id ${req.params.id} not found`);
            return res.status(404).json({ message: 'Test not found' });
        }
        
        // Convertir a JSON y manipular las preguntas
        const testData = prueba.toJSON();
        
        console.log(`Test found: ${testData.titulo}`);
        console.log(`Questions count: ${testData.Preguntas ? testData.Preguntas.length : 0}`);
        
        // Obtener las opciones directamente de la base de datos para cada pregunta
        if (testData.Preguntas && testData.Preguntas.length > 0) {
            for (let i = 0; i < testData.Preguntas.length; i++) {
                const preguntaId = testData.Preguntas[i].id;
                
                // Obtener el registro raw de la pregunta para asegurar que tenemos el dato sin procesar
                const preguntaRaw = await sequelize.query(
                    `SELECT opciones FROM pregunta WHERE id = ?`,
                    {
                        replacements: [preguntaId],
                        type: sequelize.QueryTypes.SELECT,
                        raw: true
                    }
                );
                
                if (preguntaRaw && preguntaRaw.length > 0) {
                    let opcionesStr = preguntaRaw[0].opciones;
                    console.log(`Raw options for question ${preguntaId}:`, opcionesStr);
                    
                    try {
                        // Intentar parsear las opciones como JSON
                        const opciones = JSON.parse(opcionesStr);
                        testData.Preguntas[i].opciones = opciones;
                    } catch (e) {
                        console.error(`Error parsing options for question ${preguntaId}:`, e);
                        testData.Preguntas[i].opciones = [];
                    }
                }
            }
        }
        
        res.status(200).json(testData);
    } catch (error) {
        console.error('Error in findById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const create = async (req, res) => {
    // Only allow admin and psychologists to create tests
    if (req.user.role !== 'admin' && req.user.role !== 'psicologo') {
        return res.status(403).json({ message: 'You are not authorized to create tests' });
    }

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
        console.log('Request body:', req.body);
        console.log('Test ID:', req.params.id);
        
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
        console.error('Error creating question:', error);
        return res.status(400).json({ message: error.message });
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

export const updatePreguntaOpciones = async (req, res) => {
  try {
    const { testId, preguntaId } = req.params;
    const { opciones } = req.body;

    if (!Array.isArray(opciones)) {
      return res.status(400).json({ message: 'Las opciones deben ser un array' });
    }

    // Verificar si la pregunta existe y pertenece al test
    const pregunta = await Pregunta.findOne({
      where: {
        id: preguntaId,
        idPrueba: testId
      }
    });

    if (!pregunta) {
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }

    // Actualizar las opciones
    pregunta.opciones = opciones;
    await pregunta.save();

    res.status(200).json({
      message: 'Opciones actualizadas correctamente',
      pregunta
    });
  } catch (error) {
    console.error('Error actualizando opciones:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

export const findPreguntaById = async (req, res) => {
  try {
    const { id: testId, preguntaId } = req.params;
    
    const pregunta = await Pregunta.findOne({
      where: {
        id: preguntaId,
        idPrueba: testId
      }
    });
    
    if (!pregunta) {
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }
    
    // Procesar las opciones
    let opciones = pregunta.opciones;
    if (typeof opciones === 'string') {
      try {
        opciones = JSON.parse(opciones);
      } catch (e) {
        console.error(`Error parsing options for question ${pregunta.id}:`, e);
        opciones = [];
      }
    } else if (!Array.isArray(opciones)) {
      opciones = [];
    }
    
    const preguntaData = pregunta.toJSON();
    preguntaData.opciones = opciones;
    
    res.status(200).json(preguntaData);
  } catch (error) {
    console.error('Error finding question:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add this method or update if it exists
export const getResultadosByPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.query;
    
    // Validate pacienteId
    if (!pacienteId) {
      return res.status(400).json({ 
        message: 'pacienteId parameter is required',
        error: 'Missing required parameter'
      });
    }
    
    const resultados = await ResultadoPrueba.findAll({
      where: { idPaciente: pacienteId },
      include: [
        {
          model: Prueba,
          attributes: ['titulo', 'descripcion']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json(resultados);
  } catch (error) {
    console.error('Error getting test results:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
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
    findResultadoById,
    updatePreguntaOpciones,
    findPreguntaById,
    getResultadosByPaciente
};