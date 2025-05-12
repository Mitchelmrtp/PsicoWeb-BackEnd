import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Joi from 'joi';

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    telephone: Joi.string().optional(),
    role: Joi.string().valid('user', 'admin').default('user')
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

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const user = await User.create({
            email,
            password,
            name,
            first_name,
            last_name,
            telephone,
            role: role || 'user'
        });

        const token = jwt.sign(
            { 
                userId: user.id,
                role: user.role
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
                role: user.role
            }
        });
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

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { 
                userId: user.id,
                role: user.role
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
        const user = await User.findByPk(req.user.userId, {
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
      // Check if password was provided
      if (!req.body.password) {
        return res.status(400).json({ 
          message: 'La contraseña es requerida para eliminar la cuenta' 
        });
      }
  
      const userId = req.user.userId;
      
      // Find user with password field
      const user = await User.findOne({ 
        where: { id: userId },
        attributes: ['id', 'password'] // Explicitly request password field
      });
  
      if (!user) {
        return res.status(404).json({ 
          message: 'Usuario no encontrado' 
        });
      }
  
      // Debug logs (remove in production)
      console.log('Password provided:', req.body.password);
      console.log('Stored hash:', user.password);
  
      // Compare passwords
      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
  
      if (!validPassword) {
        return res.status(401).json({ 
          message: 'Contraseña incorrecta' 
        });
      }
  
      // Perform deletion
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