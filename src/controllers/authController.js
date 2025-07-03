import { AuthService } from '../services/AuthService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import Joi from 'joi';

const authService = new AuthService();

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

const deleteAccountSchema = Joi.object({
    password: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
    password: Joi.string().min(6).required()
});

export const register = async (req, res) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await authService.register(req.body);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const login = async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await authService.login(req.body.email, req.body.password);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const getProfile = async (req, res) => {
    try {
        const result = await authService.getProfile(req.user.userId);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const { error } = deleteAccountSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await authService.deleteAccount(req.user.userId, req.body.password);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { error } = resetPasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Validation error', details: error.details });
        }

        const result = await authService.resetPassword(req.params.token, req.body.password);
        handleServiceResponse(res, result);
    } catch (error) {
        handleServiceResponse(res, error);
    }
};

export default {
    register,
    login,
    getProfile,
    deleteAccount,
    resetPassword
};
