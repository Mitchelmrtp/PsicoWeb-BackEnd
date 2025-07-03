import { PasswordService } from '../services/PasswordService.js';
import { handleServiceResponse } from '../utils/responseUtils.js';
import Joi from 'joi';

const passwordService = new PasswordService();

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).required()
});

export const forgotPassword = async (req, res) => {
  try {
    const { error } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Validation error', details: error.details });
    }

    const result = await passwordService.forgotPassword(req.body.email);
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

    const result = await passwordService.resetPassword(req.params.token, req.body.password);
    handleServiceResponse(res, result);
  } catch (error) {
    handleServiceResponse(res, error);
  }
};

export default {
  forgotPassword,
  resetPassword
};
