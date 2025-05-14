// src/controllers/passwordController.js
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import User from '../models/User.js';

const dataFilePath = path.resolve('data', 'resetTokens.json');

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'El email es requerido' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log(`❌ Forgot password attempt: email no encontrado -> ${email}`);
      return res.status(404).json({ message: 'Ese correo no se encuentra registrado' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetData = await loadResetTokens();
    resetData.push({
      id: uuidv4(),
      userId: user.id,
      token,
      createdAt: new Date()
    });

    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify(resetData, null, 2));

    const recoveryLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    console.log('🔐 Recuperación solicitada exitosamente:', {
      message: 'Correo de recuperación enviado',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      recoveryLink
    });

    return res.status(200).json({ message: 'Correo de recuperación enviado' });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const loadResetTokens = async () => {
  try {
    const file = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(file);
  } catch {
    return [];
  }
};
