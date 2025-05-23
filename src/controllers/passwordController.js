// src/controllers/passwordController.js
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import User from '../models/User.js';

const dataFilePath = path.resolve('data', 'resetTokens.json');

// --------- Solicitud de recuperación ---------
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

// --------- Utilidad para leer tokens ---------
const loadResetTokens = async () => {
  try {
    const file = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(file);
  } catch {
    return [];
  }
};

// --------- Restablecer contraseña ---------
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'La nueva contraseña es requerida' });
  }

  try {
    const resetData = await loadResetTokens();
    const tokenData = resetData.find(t => t.token === token);

    if (!tokenData) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Token expirado o inválido' });
    }

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.password = password; // Se debe encriptar automáticamente si el modelo lo hace
    await user.save();

    const updatedTokens = resetData.filter(t => t.token !== token);
    await fs.writeFile(dataFilePath, JSON.stringify(updatedTokens, null, 2));

    return res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    return res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};
