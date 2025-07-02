import Psicologo from '../models/Psicologo.js';
import User from '../models/User.js';
import Joi from 'joi';
import Sesion from '../models/Sesion.js';
import Paciente from '../models/Paciente.js';
import { Op } from 'sequelize';

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
                attributes: ['name', 'email', 'telephone', 'first_name', 'last_name']
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

export const getPacientes = async (req, res) => {
  try {
    // Get the authenticated psychologist's ID from the request
    // Check both userId and id for compatibility
    const idPsicologo = req.user.userId || req.user.id;
    
    if (!idPsicologo) {
      console.error('No user ID found in request:', req.user);
      return res.status(400).json({ 
        message: 'Usuario no identificado', 
        error: 'Missing user ID in token'
      });
    }
    
    console.log('Fetching patients for psychologist ID:', idPsicologo);
    
    // Validate that the ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idPsicologo)) {
      console.error('Invalid UUID format:', idPsicologo);
      return res.status(400).json({ 
        message: 'ID de usuario inválido', 
        error: 'Invalid UUID format'
      });
    }
    
    // Find all sessions for this psychologist
    const sesiones = await Sesion.findAll({
      where: {
        idPsicologo: idPsicologo
      },
      include: [{
        model: Paciente,
        // Remove the alias since we don't have a specific alias defined
        attributes: ['id', 'diagnostico'],
        include: [{
          model: User,
          attributes: ['first_name', 'last_name', 'email']
        }]
      }],
      attributes: ['id', 'fecha', 'estado'],
      order: [['fecha', 'DESC']]
    });
    
    console.log(`Found ${sesiones.length} sessions`);
    
    // Extract unique patients
    const pacientesMap = new Map();
    
    sesiones.forEach(sesion => {
      const sesionJSON = sesion.toJSON();
      if (sesionJSON.Paciente) {
        const paciente = sesionJSON.Paciente;
        const pacienteId = paciente.id;
        
        // Merge patient data from User relationship
        const pacienteData = {
          id: pacienteId,
          first_name: paciente.User?.first_name || '',
          last_name: paciente.User?.last_name || '',
          email: paciente.User?.email || '',
          diagnostico: paciente.diagnostico || 'Sin diagnóstico registrado',
          lastAppointment: sesion.fecha
        };
        
        // If this patient is not already in the map or if this session is newer
        if (!pacientesMap.has(pacienteId) || 
            new Date(sesion.fecha) > new Date(pacientesMap.get(pacienteId).lastAppointment)) {
          pacientesMap.set(pacienteId, pacienteData);
        }
      }
    });
    
    // Convert map to array
    const pacientes = Array.from(pacientesMap.values());
    
    console.log(`Returning ${pacientes.length} unique patients:`, pacientes);
    return res.status(200).json(pacientes);
    
  } catch (error) {
    console.error('Error in getPacientes controller:', error);
    return res.status(500).json({ 
      message: 'Error al obtener pacientes', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export default {
    findAll,
    findById,
    create,
    update,
    remove,
    findPacientes,
    getPacientes
};
