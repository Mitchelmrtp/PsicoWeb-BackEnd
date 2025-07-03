import { UserRepository } from '../repositories/UserRepository.js';
import { PsicologoRepository } from '../repositories/PsicologoRepository.js';
import { PacienteRepository } from '../repositories/PacienteRepository.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../utils/authUtils.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.join(__dirname, '../../data/resetTokens.json');

export class AuthService {
    constructor() {
        this.userRepository = new UserRepository();
        this.psicologoRepository = new PsicologoRepository();
        this.pacienteRepository = new PacienteRepository();
    }

    async register(userData) {
        try {
            const { email, password, name, first_name, last_name, telephone, role } = userData;

            // Check if user already exists
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                return createErrorResponse('El usuario ya existe', 400);
            }

            // Create user with hashed password
            const hashedPassword = await hashPassword(password);
            const user = await this.userRepository.create({
                email,
                password: hashedPassword,
                name,
                first_name,
                last_name,
                telephone,
                role: role || 'paciente'
            });

            // Create role-specific profile
            if (role === 'psicologo') {
                await this.psicologoRepository.create({
                    id: user.id,
                    especialidad: userData.especialidad || 'No especificada',
                    licencia: userData.licencia || 'Pendiente',
                    formacion: userData.formacion || 'No especificada'
                });
            } else if (role === 'paciente') {
                await this.pacienteRepository.create({
                    id: user.id,
                    motivoConsulta: userData.motivoConsulta || 'No especificado'
                });
            }

            // Generate token
            const token = generateToken({
                id: user.id,
                userId: user.id,
                role: user.role,
                userType: user.role
            });

            return createSuccessResponse({
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
            }, 201);
        } catch (error) {
            console.error('Error in AuthService.register:', error);
            return createErrorResponse('Error en el servidor', 500);
        }
    }

    async login(email, password) {
        try {
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                return createErrorResponse('Credenciales inválidas', 400);
            }

            const validPassword = await comparePassword(password, user.password);
            if (!validPassword) {
                return createErrorResponse('Credenciales inválidas', 400);
            }

            const token = generateToken({
                id: user.id,
                userId: user.id,
                role: user.role,
                userType: user.role
            });

            return createSuccessResponse({
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
            console.error('Error in AuthService.login:', error);
            return createErrorResponse('Error en el servidor', 500);
        }
    }

    async getProfile(userId) {
        try {
            const user = await this.userRepository.findByIdWithoutPassword(userId);
            if (!user) {
                return createErrorResponse('Usuario no encontrado', 404);
            }

            return createSuccessResponse(user);
        } catch (error) {
            console.error('Error in AuthService.getProfile:', error);
            return createErrorResponse('Error en el servidor', 500);
        }
    }

    async deleteAccount(userId, password) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return createErrorResponse('Usuario no encontrado', 404);
            }

            const validPassword = await comparePassword(password, user.password);
            if (!validPassword) {
                return createErrorResponse('Contraseña incorrecta', 401);
            }

            await this.userRepository.delete(userId);

            return createSuccessResponse({
                message: 'Cuenta eliminada exitosamente'
            });
        } catch (error) {
            console.error('Error in AuthService.deleteAccount:', error);
            return createErrorResponse('Error al eliminar la cuenta', 500);
        }
    }

    async resetPassword(token, newPassword) {
        try {
            // Read reset tokens from file
            let resetData = [];
            try {
                const data = await fs.readFile(dataFilePath, 'utf-8');
                resetData = JSON.parse(data);
            } catch (error) {
                console.log('No reset tokens file found or empty');
            }

            const tokenData = resetData.find(t => t.token === token);
            if (!tokenData) {
                return createErrorResponse('Token inválido o expirado', 400);
            }

            const decoded = verifyToken(token);
            const user = await this.userRepository.findById(decoded.userId);
            if (!user) {
                return createErrorResponse('Usuario no encontrado', 404);
            }

            // Update password
            const hashedPassword = await hashPassword(newPassword);
            await this.userRepository.update(user.id, { password: hashedPassword });

            // Remove used token
            const updatedTokens = resetData.filter(t => t.token !== token);
            await fs.writeFile(dataFilePath, JSON.stringify(updatedTokens, null, 2));

            return createSuccessResponse({
                message: 'Contraseña restablecida exitosamente'
            });
        } catch (error) {
            console.error('Error in AuthService.resetPassword:', error);
            return createErrorResponse('Error al restablecer la contraseña', 500);
        }
    }
}