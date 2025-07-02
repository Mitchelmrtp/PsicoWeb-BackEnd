import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sequelize } from '../models/index.js';
import * as models from '../models/index.js';
import Joi from 'joi';
import fs from 'fs/promises';

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    telephone: Joi.string().optional(),
    role: Joi.string().valid('admin', 'psicologo', 'paciente').default('paciente'),
    // Fields for psychologist
    especialidad: Joi.when('role', {
        is: 'psicologo',
        then: Joi.string().optional(),
        otherwise: Joi.forbidden()
    }),
    licencia: Joi.when('role', {
        is: 'psicologo',
        then: Joi.string().optional(),
        otherwise: Joi.forbidden()
    }),
    formacion: Joi.when('role', {
        is: 'psicologo',
        then: Joi.string().optional(),
        otherwise: Joi.forbidden()
    }),
    // Fields for patient
    motivoConsulta: Joi.when('role', {
        is: 'paciente',
        then: Joi.string().optional(),
        otherwise: Joi.forbidden()
    })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const register = async (req, res) => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const { email, password, name, first_name, last_name, telephone, role } = req.body;

        const userExists = await models.User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Start a transaction to ensure data consistency
        const transaction = await sequelize.transaction();

        try {
            // 1. Create the base user record
            const user = await models.User.create({
                email,
                password,
                name,
                first_name,
                last_name,
                telephone,
                role: role || 'paciente' // Default role is paciente
            }, { transaction });

            // 2. Create role-specific profile based on role
            if (role === 'psicologo') {
                // Create minimal psychologist profile
                await models.Psicologo.create({
                    id: user.id,
                    especialidad: req.body.especialidad || 'No especificada',
                    licencia: req.body.licencia || 'Pendiente',
                    formacion: req.body.formacion || 'No especificada'
                }, { transaction });
            } 
            else if (role === 'paciente') {
                // Create minimal patient profile
                await models.Paciente.create({
                    id: user.id,
                    motivoConsulta: req.body.motivoConsulta || 'No especificado'
                }, { transaction });
            }

            // Commit transaction
            await transaction.commit();

            // Generate token
            const token = jwt.sign(
                { 
                    id: user.id,
                    userId: user.id,
                    role: user.role,
                    userType: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Usuario creado exitosamente',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    userType: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            });
        } catch (error) {
            // Rollback transaction on error
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

export const login = async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    }

    try {
        const { email, password } = req.body;

        const user = await models.User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { 
                id: user.id,
                userId: user.id,
                role: user.role,
                userType: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                userType: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                telephone: user.telephone
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await models.User.findByPk(req.user.userId, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};


export const deleteAccount = async (req, res) => {
    try {
      if (!req.body.password) {
        return res.status(400).json({ 
          message: 'La contraseña es requerida para eliminar la cuenta' 
        });
      }
  
      const userId = req.user.userId;
      
      const user = await models.User.findOne({ 
        where: { id: userId },
        attributes: ['id', 'password'] 
      });
  
      if (!user) {
        return res.status(404).json({ 
          message: 'Usuario no encontrado' 
        });
      }
  
      console.log('Password provided:', req.body.password);
      console.log('Stored hash:', user.password);
  
      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
  
      if (!validPassword) {
        return res.status(401).json({ 
          message: 'Contraseña incorrecta' 
        });
      }
  
      await user.destroy();
  
      res.status(200).json({ 
        message: 'Cuenta eliminada exitosamente' 
      });
  
    } catch (error) {
      console.error('Error detallado:', error);
      res.status(500).json({ 
        message: 'Error al eliminar la cuenta', 
        error: error.message 
      });
    }
  };

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'La nueva contraseña es requerida' });
  }

  try {
    const resetData = await fs.readFile(dataFilePath, 'utf-8').then(JSON.parse);
    const tokenData = resetData.find(t => t.token === token);

    if (!tokenData) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await models.User.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.password = password; // asegúrate de que tu modelo encripta automáticamente o hazlo aquí
    await user.save();

    // Elimina el token usado
    const updatedTokens = resetData.filter(t => t.token !== token);
    await fs.writeFile(dataFilePath, JSON.stringify(updatedTokens, null, 2));

    return res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    return res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};
